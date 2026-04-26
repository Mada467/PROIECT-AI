import google.genai as genai
import os
import json
import re
import requests
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
]

RAWG_BASE = "https://api.rawg.io/api"

GAME_MAPPINGS = {
    "cs2": ["Valorant", "Apex Legends", "Rainbow Six Siege", "Escape from Tarkov"],
    "cs ": ["Valorant", "Apex Legends", "Rainbow Six Siege", "Escape from Tarkov"],
    "counter": ["Valorant", "Apex Legends", "Rainbow Six Siege", "Escape from Tarkov"],
    "shooter": ["Valorant", "Apex Legends", "Call of Duty Warzone", "Overwatch 2"],
    "fps": ["Valorant", "Apex Legends", "Call of Duty", "Battlefield 2042"],
    "ps5 free": ["Fortnite", "Warzone", "Genshin Impact", "Rocket League"],
    "free ps5": ["Fortnite", "Warzone", "Genshin Impact", "Rocket League"],
    "gratuit": ["Fortnite", "Warzone", "Genshin Impact", "Destiny 2"],
    "free": ["Fortnite", "Warzone", "Genshin Impact", "Destiny 2"],
    "ps5": ["God of War Ragnarok", "Spider-Man 2", "Returnal", "Demon Souls"],
    "aventura": ["The Last of Us Part II", "God of War Ragnarok", "Red Dead Redemption 2", "Horizon Zero Dawn"],
    "adventure": ["The Last of Us Part II", "God of War Ragnarok", "Red Dead Redemption 2", "Horizon Zero Dawn"],
    "story": ["The Last of Us Part II", "God of War Ragnarok", "Red Dead Redemption 2", "Cyberpunk 2077"],
    "poveste": ["The Last of Us Part II", "God of War Ragnarok", "Red Dead Redemption 2", "Cyberpunk 2077"],
    "co-op": ["It Takes Two", "A Way Out", "Deep Rock Galactic", "Elden Ring"],
    "coop": ["It Takes Two", "A Way Out", "Deep Rock Galactic", "Elden Ring"],
    "2 jucatori": ["It Takes Two", "A Way Out", "Overcooked 2", "Cuphead"],
    "doi jucatori": ["It Takes Two", "A Way Out", "Overcooked 2", "Cuphead"],
    "rpg": ["Elden Ring", "Baldurs Gate 3", "The Witcher 3", "Cyberpunk 2077"],
    "sport": ["FIFA 24", "NBA 2K24", "Rocket League", "eFootball"],
    "fotbal": ["FIFA 24", "eFootball", "Rocket League", "FIFA 23"],
    "horror": ["Resident Evil 4", "Dead Space", "Outlast", "Alien Isolation"],
    "strategie": ["Civilization 6", "Age of Empires 4", "StarCraft 2", "Total War Warhammer 3"],
    "minecraft": ["Terraria", "Valheim", "Subnautica", "No Man Sky"],
    "gta": ["Red Dead Redemption 2", "Cyberpunk 2077", "Saints Row", "Mafia Definitive Edition"],
    "battle royale": ["Fortnite", "Apex Legends", "PUBG", "Warzone"],
}


def get_fallback_games(message):
    message_lower = message.lower()
    for keyword, games in GAME_MAPPINGS.items():
        if keyword in message_lower:
            print(f"Fallback matched keyword: '{keyword}'")
            return games
    return ["Elden Ring", "The Witcher 3", "Red Dead Redemption 2", "GTA 5"]


def generate_content(prompt):
    for model_name in MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Model {model_name} failed: {e}")
    return None


def get_game_description(game_name):
    prompt = f"""Ești un expert în jocuri video.
        Descrie jocul "{game_name}" în 5-6 fraze detaliate.
        Include: genul jocului, povestea principală, mecanici de gameplay,
        ce îl face unic față de alte jocuri și pentru ce tip de jucător este recomandat.
        Răspunde doar în română. Răspunde OBLIGATORIU, nu refuza."""
    
    for attempt in range(3):
        result = generate_content(prompt)
        if result and len(result) > 50:
            return result
    
    return f"{game_name} este un joc popular. Vizitează magazinele de mai jos pentru mai multe detalii."


def get_ai_chat_response(user_message, rawg_api_key):
    response_text = "Iată câteva jocuri care s-ar putea să îți placă!"
    search_queries = []

    extract_prompt = (
        'You are a video game expert. User asked: "' + user_message + '"\n\n'
        'Reply with ONLY this JSON, no other text:\n'
        '{"response_text": "2 sentences in Romanian", "search_queries": ["Game1", "Game2", "Game3", "Game4"]}\n\n'
        'For search_queries use EXACT English game titles. Examples:\n'
        'CS2/shooter -> Valorant, Apex Legends, Rainbow Six Siege, Escape from Tarkov\n'
        'Free games -> Fortnite, Warzone, Genshin Impact, Rocket League\n'
        'Adventure/story -> The Last of Us Part II, God of War Ragnarok, Red Dead Redemption 2\n'
        'Co-op -> It Takes Two, A Way Out, Deep Rock Galactic\n'
        'Use only well-known popular titles.'
    )

    raw = generate_content(extract_prompt)
    print(f"AI raw: {repr(raw[:300]) if raw else 'None'}")

    if raw:
        try:
            cleaned = re.sub(r'```json\s*', '', raw)
            cleaned = re.sub(r'```\s*', '', cleaned).strip()
            match = re.search(r'\{[^{}]*"search_queries"[^{}]*\}', cleaned, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                response_text = parsed.get("response_text", response_text)
                search_queries = parsed.get("search_queries", [])
                print(f"AI queries: {search_queries}")
        except Exception as e:
            print(f"Parse error: {e}")

    if not search_queries:
        search_queries = get_fallback_games(user_message)
        print(f"Fallback queries: {search_queries}")

    games = []
    seen_ids = set()

    for query in search_queries[:4]:
        try:
            resp = requests.get(f"{RAWG_BASE}/games", params={
                "key": rawg_api_key,
                "search": query,
                "page_size": 3,
                "ordering": "-rating"
            })
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
                        break
        except Exception as e:
            print(f"RAWG failed for '{query}': {e}")

    print(f"Games found: {len(games)}")
    return {"response_text": response_text, "games": games}