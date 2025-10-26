# emberhacks-project

## Running the Development Server

Follow these steps to run the backend locally and expose it via ngrok.

1. Open two terminal windows or tabs.
2. In both terminals, navigate to the project’s server directory:
   cd path/to/your/project/server
3. In the first terminal, start the FastAPI server:
   uvicorn main:app --host 0.0.0.0 --port 8000
4. In the second terminal, run ngrok to expose the local server:
   ngrok http 8000
5. ngrok will display a public forwarding URL (e.g. https://example.ngrok-free.app). Use this URL to access your FastAPI app remotely.

The server expects a .env file with the key value pair GEMINI_API_KEY={YOUR_KEY_HERE}

