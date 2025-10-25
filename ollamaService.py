from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import json

app = FastAPI(title="Ollama Backend Stream (NoThink)")

# Ollama local API
OLLAMA_API_URL = "http://localhost:11434/api/generate"


class GenerateRequest(BaseModel):
    model: str = "qwen3:1.7b"
    prompt: str
    temperature: float = 0.7
    max_tokens: int = 512


def stream_ollama(req: GenerateRequest):
    """Stream response from local Ollama with /no_think"""
    payload = {
        "model": req.model,
        "prompt": req.prompt.strip() + " /no_think",  # force non-thinking mode
        "stream": False,
        "options": {
            "temperature": req.temperature,
            "num_predict": req.max_tokens,
        },
    }

    with requests.post(OLLAMA_API_URL, json=payload, stream=True) as r:
        for line in r.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line.decode("utf-8"))
                if "response" in data:
                    yield data["response"]
            except json.JSONDecodeError:
                continue


@app.post("/generate")
async def generate(req: GenerateRequest):
    """Stream text output from Qwen3 without thinking mode"""
    return StreamingResponse(stream_ollama(req), media_type="text/plain")


@app.get("/")
def root():
    return {"message": "Ollama backend (NoThink + Stream) running!"}
