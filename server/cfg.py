import os
from dotenv import load_dotenv

load_dotenv()

MODEL = "gemini-2.0-flash"
TEMPERATURE = 0.7
MAX_TOKENS = 512
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
API_KEY = os.getenv("GEMINI_API_KEY")
