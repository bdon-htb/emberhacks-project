import json
import asyncio
import httpx
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

app = FastAPI(title="Ollama Backend (httpx + Async Stream)")

# Ollama local API endpoint
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Simple in-memory conversation store
conversation_history: list[str] = []


class GenerateRequest(BaseModel):
    prompt: str
    task_type: str          # "solve" or "concept"
    temperature: float = 0.7
    max_tokens: int = 512


def build_payload(req: GenerateRequest, system_prompt: str, think_mode: bool):
    """Construct full prompt with context and mode"""
    context = "\n".join(conversation_history[-10:])  # keep last 10 exchanges
    suffix = "/think" if think_mode else "/no_think"

    full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nUser: {req.prompt.strip()} {suffix}"

    payload = {
        "model": "qwen3:1.7b",
        "prompt": full_prompt,
        "stream": True,
        "options": {
            "temperature": req.temperature,
            "num_predict": req.max_tokens,
        },
    }
    return payload


async def stream_ollama_async(payload):
    """Async generator that yields streaming tokens from Ollama"""
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", OLLAMA_API_URL, json=payload) as resp:
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    if "response" in data:
                        yield data["response"]
                except json.JSONDecodeError:
                    continue


@app.post("/generate")
async def generate(req: GenerateRequest):
    """Handle both task types: 'solve' (think) or 'concept' (no_think)"""

    # Select mode
    if req.task_type == "solve":
        system_prompt = (
            "You are a logical problem solver. Think step by step and reason carefully before answering."
        )
        think_mode = True

        payload = build_payload(req, system_prompt, think_mode)
        result = []

        # Collect stream asynchronously
        async for chunk in stream_ollama_async(payload):
            print(chunk)
            result.append(chunk)

        final_output = "".join(result).strip()
        conversation_history.append(f"User: {req.prompt}")
        conversation_history.append(f"AI: {final_output}")

        return JSONResponse({"result": final_output})

    elif req.task_type == "concept":
        system_prompt = "You are a concise and clear teacher. Explain simply and directly."
        think_mode = False
        payload = build_payload(req, system_prompt, think_mode)
        conversation_history.append(f"User: {req.prompt}")

        async def stream_response():
            output = ""
            async for chunk in stream_ollama_async(payload):
                print(chunk)
                output += chunk
                yield chunk
            conversation_history.append(f"AI: {output.strip()}")

        return StreamingResponse(stream_response(), media_type="text/plain")

    else:
        return JSONResponse(
            {"error": "Invalid task_type. Use 'solve' or 'concept'."},
            status_code=400,
        )


@app.get("/")
def root():
    return {"message": "Ollama backend (httpx + Async Stream) running!"}
