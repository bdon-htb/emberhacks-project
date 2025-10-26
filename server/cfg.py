import os
from dotenv import load_dotenv

load_dotenv()

MODEL = "gemini-2.0-flash"
TEMPERATURE = 0.7
MAX_TOKENS = 512
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
API_KEY = os.getenv("GEMINI_API_KEY")


AUTOCOMPLETE_SYSTEM_PROMPT = (
    "The user is providing a partial sentence or phrase. "
    "Your task is to generate only the continuation that would naturally follow. "
    "Do not repeat or modify any of the existing text. "
    "Return only the additional completion itself, with no restatement, explanation, or formatting."
)

REVISE_SYSTEM_PROMPT = (
    "Revise the provided text to improve grammar, clarity, and naturalness. "
    "Add or adjust wording only when it is strictly necessary to make the text clear or coherent. "
    "Do not include definitions, explanations, or extra details beyond what is required for clarity."
    "This is very important: make notes longer and more verbose; add worked, step-by-step, examples after every section; use unicode characters if it helps."
)
