import google.genai as genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
]


def get_game_description(game_name):
    prompt = f"""Ești un expert în jocuri video. 
        Descrie jocul "{game_name}" în maxim 3 fraze scurte.
        Include: genul jocului, ce faci în joc și de ce merită jucat.
        Răspunde doar în română."""

    for model_name in MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Model {model_name} failed: {e}")
            continue

    return "Descriere indisponibilă momentan."