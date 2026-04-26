import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

RAWG_BASE = "https://api.rawg.io/api"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

ESRB_MAP = {
    1: "Everyone (Toate vârstele)",
    2: "Everyone 10+ (10+)",
    3: "Teen (13+)",
    4: "Mature (17+)",
    5: "Adults Only (18+)",
}


def call_gemini(prompt: str, max_tokens: int = 1024) -> str:
    """Apelează Gemini și returnează textul răspunsului."""
    try:
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.7,
            }
        }
        resp = requests.post(GEMINI_URL, json=payload, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        else:
            print(f"Gemini error {resp.status_code}: {resp.text}")
            return None
    except Exception as e:
        print(f"Gemini exception: {e}")
        return None


def extract_game_info_from_gemini(user_message: str) -> dict:
    """
    Folosește Gemini să înțeleagă ce vrea userul și să extragă:
    - genul de joc (slug RAWG)
    - cuvinte cheie de căutare
    - un răspuns text prietenos
    """
    prompt = f"""Ești GameMatch AI, un asistent expert în jocuri video. Userul a scris: "{user_message}"

Analizează mesajul și returnează DOAR un JSON valid (fără markdown, fără backticks) cu structura:
{{
  "response_text": "răspuns prietenos în română, maxim 2 propoziții, care să fie relevant pentru cererea userului",
  "genre_slug": "unul din: action, shooter, adventure, role-playing-games-rpg, strategy, puzzle, racing, sports, simulation, arcade, fighting, platformer, horror, cooperative sau null dacă nu e clar",
  "search_query": "cuvinte cheie pentru căutare în RAWG, ex: 'tactical shooter multiplayer' sau null",
  "ordering": "unul din: -rating, -released, -metacritic sau -rating dacă nu e specificat"
}}

Exemple:
- "jocuri ca CS2" → genre_slug: "shooter", search_query: "tactical shooter competitive multiplayer"
- "ceva relaxant de seara" → genre_slug: null, search_query: "relaxing casual", ordering: "-rating"
- "RPG cu story bun" → genre_slug: "role-playing-games-rpg", search_query: "story driven RPG narrative"
- "Valorant" → genre_slug: "shooter", search_query: "Valorant tactical shooter"

Returnează DOAR JSON-ul, nimic altceva."""

    result = call_gemini(prompt, max_tokens=300)
    if not result:
        return {
            "response_text": "Ți-am găsit câteva jocuri potrivite pentru tine 🎮",
            "genre_slug": None,
            "search_query": None,
            "ordering": "-rating"
        }

    try:
        # Curăță eventuale backticks sau prefix json
        clean = result.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(clean)
    except Exception as e:
        print(f"JSON parse error: {e} | Raw: {result}")
        return {
            "response_text": result[:200] if result else "Ți-am găsit câteva jocuri potrivite 🎮",
            "genre_slug": None,
            "search_query": None,
            "ordering": "-rating"
        }


def get_ai_chat_response(user_message: str, rawg_api_key: str, filters: dict = None) -> dict:
    """
    Funcția principală: Gemini înțelege cererea → RAWG caută jocurile → returnează rezultate.
    Dacă nu sunt jocuri relevante, Gemini răspunde direct (ex: întrebări generale).
    """
    filters = filters or {}

    # Verifică dacă e o întrebare generală despre jocuri (nu neapărat recomandare)
    general_question_prompt = f"""Userul a scris: "{user_message}"
Este aceasta o cerere de recomandare de jocuri sau o întrebare generală despre jocuri video?
Răspunde DOAR cu "recomandare" sau "intrebare"."""

    intent = call_gemini(general_question_prompt, max_tokens=10)
    is_recommendation = intent is None or "recomandare" in (intent or "").lower()

    if not is_recommendation:
        # Răspuns direct de la Gemini pentru întrebări generale
        answer_prompt = f"""Ești GameMatch AI, un expert în jocuri video. Răspunde în română la întrebarea: "{user_message}"
Fii concis, util și prietenos. Maxim 3-4 propoziții."""
        answer = call_gemini(answer_prompt, max_tokens=400)
        return {
            "response_text": answer or "Nu am putut procesa întrebarea ta. Încearcă din nou! 🎮",
            "games": []
        }

    # Extrage info din mesaj cu Gemini
    info = extract_game_info_from_gemini(user_message)
    response_text = info.get("response_text", "Ți-am găsit câteva jocuri potrivite 🎮")
    genre_slug = info.get("genre_slug")
    search_query = info.get("search_query")
    ordering = info.get("ordering", "-rating")

    games = []
    seen_ids = set()

    # Construiește parametrii pentru RAWG
    params = {
        "key": rawg_api_key,
        "page_size": 12,
        "ordering": ordering
    }

    if genre_slug:
        params["genres"] = genre_slug
    if search_query:
        params["search"] = search_query

    # Aplică filtrele userului
    if filters.get("age_rating"):
        params["esrb_rating"] = filters["age_rating"]
    if filters.get("platform"):
        params["platforms"] = filters["platform"]
    if filters.get("min_rating"):
        params["metacritic"] = f"{filters['min_rating']},100"

    try:
        resp = requests.get(f"{RAWG_BASE}/games", params=params, timeout=10)
        if resp.status_code == 200:
            results = resp.json().get("results", [])
            for game in results:
                if game.get("id") not in seen_ids and game.get("background_image"):
                    seen_ids.add(game["id"])
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

    # Fallback dacă nu s-au găsit jocuri
    if not games:
        fallback_prompt = f"""Ești GameMatch AI. Userul a cerut: "{user_message}"
Nu am găsit jocuri în baza de date. Oferă un răspuns util în română, sugerând 2-3 titluri cunoscute manual.
Maxim 3 propoziții."""
        fallback_text = call_gemini(fallback_prompt, max_tokens=300)
        return {
            "response_text": fallback_text or "Nu am găsit jocuri pentru această cerere. Încearcă cu alți termeni! 🎮",
            "games": []
        }

    return {"response_text": response_text, "games": games}


def get_game_description(game_name: str, game_data: dict = None) -> str:
    """
    Generează o descriere completă a jocului folosind Gemini.
    Include capitole/nivele dacă e cazul.
    """
    genres = ", ".join(game_data.get("genres", [])) if game_data else ""
    platforms = ", ".join(game_data.get("platforms", [])) if game_data else ""
    released = game_data.get("released", "") if game_data else ""

    prompt = f"""Ești GameMatch AI, expert în jocuri video. Scrie o descriere detaliată în română pentru jocul "{game_name}".

Informații cunoscute: genuri: {genres}, platforme: {platforms}, lansat: {released}

Structura răspunsului tău (folosește exact aceste secțiuni dacă sunt relevante):
1. O descriere generală captivantă a jocului (3-4 propoziții)
2. Dacă jocul are o campanie/story (ex: God of War, The Last of Us, Horizon): menționează câte capitole/acte are aproximativ
3. Dacă jocul are nivele/stages (ex: jocuri arcade, platformer, shooter single-player): menționează câte nivele are aproximativ
4. Ce face jocul special și de ce merită jucat

Fii specific și informativ. Dacă nu știi exact numărul de capitole/nivele, estimează sau omite acea secțiune."""

    result = call_gemini(prompt, max_tokens=600)
    return result or f"{game_name} este un joc captivant. Explorează platformele disponibile pentru mai multe detalii."