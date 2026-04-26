import requests
import os
from dotenv import load_dotenv

load_dotenv()

RAWG_BASE = "https://api.rawg.io/api"


# 🔧 Mapare cuvinte → genuri RAWG
def detect_genre(message):
    message = message.lower()

    genre_map = {
        "fps": "shooter",
        "shooter": "shooter",
        "cs2": "shooter",
        "counter": "shooter",
        "battle royale": "battle-royale",
        "rpg": "role-playing-games-rpg",
        "strategie": "strategy",
        "sport": "sports",
        "fotbal": "sports",
        "horror": "horror",
        "aventura": "adventure",
        "adventure": "adventure",
        "co-op": "cooperative",
        "coop": "cooperative",
        "2 jucatori": "cooperative",
        "doi jucatori": "cooperative",
    }

    for key, value in genre_map.items():
        if key in message:
            return value

    return None


# 🔧 fallback dacă nu detectăm nimic
def get_fallback_games(message):
    return [
        "Elden Ring",
        "The Witcher 3",
        "Red Dead Redemption 2",
        "GTA 5"
    ]


# 🔥 FUNCȚIA PRINCIPALĂ (RECOMANDĂRI)
def get_ai_chat_response(user_message, rawg_api_key):
    response_text = "Ți-am găsit câteva jocuri potrivite pentru tine 🎮"
    games = []
    seen_ids = set()

    genre = detect_genre(user_message)

    try:
        params = {
            "key": rawg_api_key,
            "page_size": 12,
            "ordering": "-rating"
        }

        if genre:
            params["genres"] = genre
        else:
            # fallback dacă nu detectăm gen → jocuri populare
            params["ordering"] = "-added"

        resp = requests.get(f"{RAWG_BASE}/games", params=params, timeout=10)

        if resp.status_code == 200:
            results = resp.json().get("results", [])

            for game in results:
                if game.get("id") not in seen_ids and game.get("background_image"):
                    seen_ids.add(game.get("id"))

                    games.append({
                        "id": game.get("id"),
                        "name": game.get("name"),
                        "image": game.get("background_image"),
                        "rating": game.get("rating"),
                        "released": game.get("released"),
                        "genres": [g["name"] for g in game.get("genres", [])]
                    })

                if len(games) == 4:
                    break

    except requests.exceptions.Timeout:
        print("RAWG timeout")
    except Exception as e:
        print(f"RAWG error: {e}")

    # 🔥 fallback dacă nu găsește nimic
    if not games:
        fallback = get_fallback_games(user_message)

        for name in fallback:
            try:
                resp = requests.get(f"{RAWG_BASE}/games", params={
                    "key": rawg_api_key,
                    "search": name,
                    "page_size": 1
                })

                if resp.status_code == 200:
                    result = resp.json().get("results", [])
                    if result:
                        g = result[0]
                        games.append({
                            "id": g.get("id"),
                            "name": g.get("name"),
                            "image": g.get("background_image"),
                            "rating": g.get("rating"),
                            "released": g.get("released"),
                            "genres": [gen["name"] for gen in g.get("genres", [])]
                        })

            except:
                continue

    return {
        "response_text": response_text,
        "games": games
    }
def get_game_description(game_name):
    return f"{game_name} este un joc popular. Verifică platformele disponibile pentru mai multe detalii."

