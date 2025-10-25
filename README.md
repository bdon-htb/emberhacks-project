# emberhacks-project

If you want to run backend please do the following:
```
cd ~/emberhacks-project
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn requests httpx
uvicorn ollamaService:app --reload
```

Also making sure you have ollama and qwen3:1.7b on your local, if you don't, run the following command:
```
ollama run qwen3:1.7b
```
