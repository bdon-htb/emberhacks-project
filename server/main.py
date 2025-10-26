import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from enum import Enum

import cfg


app = FastAPI(title="Gemini Backend")


class Task(Enum):
    AUTOCOMPLETE = "autocomplete"
    REVISE = "revise"


class GenerateRequest(BaseModel):
    text: str
    context_before: str
    context_after: str
    task_type: Task


async def call_gemini(instruction: str, req: GenerateRequest):
    user_input = (
        f"Context before:\n{req.context_before}\n\n"
        f"Text to complete:\n{req.text}\n\n"
        f"Context after:\n{req.context_after}"
    )

    headers = {"Content-Type": "application/json"}
    params = {"key": cfg.API_KEY}

    body = {
        "contents": [
            {
                "role": "model",
                "parts": [{"text": instruction}],
            },
            {
                "role": "user",
                "parts": [{"text": user_input}],
            }
        ]
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(cfg.API_URL, headers=headers, params=params, json=body)

    if resp.status_code != 200:
        msg = resp.text or f"Gemini API returned {resp.status_code}"
        raise HTTPException(status_code=resp.status_code, detail=msg)

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise HTTPException(
            status_code=502,
            detail="Gemini API returned no candidates (empty response)."
        )
    
    parts = candidates[0].get("content", {}).get("parts", [])
    text = parts[0].get("text", "") if parts else "(no text)"
    return {"response": text}


@app.post("/generate")
async def generate(req: GenerateRequest):
    if not cfg.API_KEY:
        raise HTTPException(status_code=500, detail="API_KEY is not set")
        
    if req.task_type == Task.AUTOCOMPLETE:
        return await call_gemini(cfg.AUTOCOMPLETE_SYSTEM_PROMPT, req)
    elif req.task_type == Task.REVISE:
        return await call_gemini(cfg.REVISE_SYSTEM_PROMPT, req)
    else:
        return JSONResponse(
            {"error": "Invalid task_type. Use 'autocomplete' or 'revise'."},
            status_code=400,
        )

@app.get("/")
def read_root():
    return {"message": "Gemini backend running with API key!"}
