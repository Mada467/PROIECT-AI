from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_service import get_game_description, get_ai_chat_response
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

RAWG_API_KEY = os.getenv("RAWG_API_KEY")
RAWG_BASE = "https://api.rawg.io/api"

if not RAWG_API_KEY:
    raise ValueError("RAWG_API_KEY lipsește din .env!")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        result = get_ai_chat_response(user_message, RAWG_API_KEY)
        return jsonify(result)
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": "Eroare internă server"}), 500


@app.route("/api/game/<int:game_id>", methods=["GET"])
def game_detail(game_id):
    if game_id <= 0:
        return jsonify({"error": "ID invalid"}), 400

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
        "description_ai": description,
        "stores": [
            {
                "store_name": s["store"]["name"],
                "store_slug": s["store"]["slug"],
                "url": s.get("url", "")
            }
            for s in game.get("stores", [])
        ]
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=os.getenv("FLASK_ENV") == "development")