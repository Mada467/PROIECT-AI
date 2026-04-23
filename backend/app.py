from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_service import get_game_description
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

RAWG_API_KEY = os.getenv("RAWG_API_KEY")
RAWG_BASE = "https://api.rawg.io/api"


@app.route("/api/search", methods=["GET"])
def search_games():
    query = request.args.get("q", "")
    if not query:
        return jsonify({"error": "No query provided"}), 400

    rawg_resp = requests.get(f"{RAWG_BASE}/games", params={
        "key": RAWG_API_KEY,
        "search": query,
        "page_size": 6
    })

    if rawg_resp.status_code != 200:
        return jsonify({"error": "RAWG API error"}), 500

    data = rawg_resp.json()
    games = data.get("results", [])

    result = []
    for game in games:
        result.append({
            "id": game.get("id"),
            "name": game.get("name"),
            "image": game.get("background_image"),
            "rating": game.get("rating"),
            "released": game.get("released"),
            "genres": [g["name"] for g in game.get("genres", [])]
        })

    return jsonify(result)


@app.route("/api/game/<int:game_id>", methods=["GET"])
def game_detail(game_id):
    rawg_resp = requests.get(f"{RAWG_BASE}/games/{game_id}", params={
        "key": RAWG_API_KEY
    })

    if rawg_resp.status_code != 200:
        return jsonify({"error": "Game not found"}), 404

    game = rawg_resp.json()
    name = game.get("name")
    description = get_game_description(name)

    return jsonify({
        "id": game.get("id"),
        "name": name,
        "image": game.get("background_image"),
        "rating": game.get("rating"),
        "released": game.get("released"),
        "genres": [g["name"] for g in game.get("genres", [])],
        "platforms": [p["platform"]["name"] for p in game.get("platforms", [])],
        "description_ai": description
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)