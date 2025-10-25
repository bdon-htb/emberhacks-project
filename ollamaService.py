import json
import httpx
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import os

app = FastAPI(title="Gemini Backend (httpx + Async Stream)")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "<YOUR_GEMINI_API_KEY>")
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

conversation_history: list[str] = []


class GenerateRequest(BaseModel):
    prompt: str
    task_type: str          # "solve" or "concept"
    temperature: float = 0.7
    max_tokens: int = 512


def build_payload(req: GenerateRequest, system_prompt: str):
    context = "\n".join(conversation_history[-10:])
    full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nUser: {req.prompt.strip()}"
    return {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": req.temperature,
            "maxOutputTokens": req.max_tokens
        }
    }


async def call_gemini_api(payload):
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers={"Content-Type": "application/json"}, json=payload)
    if resp.status_code != 200:
        raise RuntimeError(f"Gemini API error {resp.status_code}: {resp.text}")
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return json.dumps(data, ensure_ascii=False, indent=2)


@app.post("/generate")
async def generate(req: GenerateRequest):
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("<"):
        return JSONResponse({"error": "Missing or invalid API key"}, status_code=400)

    if req.task_type == "solve":
        system_prompt = (
            "You are a logical problem solver. Think step by step and reason carefully before answering."
        )
    elif req.task_type == "concept":
        system_prompt = "You are a concise and clear teacher. Explain simply and directly."
    else:
        return JSONResponse({"error": "Invalid task_type. Use 'solve' or 'concept'."}, status_code=400)

    payload = build_payload(req, system_prompt)
    result = await call_gemini_api(payload)

    conversation_history.append(f"User: {req.prompt}")
    conversation_history.append(f"AI: {result}")

    return JSONResponse({"result": result})


@app.get("/")
def root():
    return {"message": "Gemini backend running with API key!"}

