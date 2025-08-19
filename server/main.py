from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import google.generativeai as genai
import httpx

# --- Environment Variables ---
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")
OLLAMA_SERVER_URL = os.getenv("OLLAMA_SERVER_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# --- Pydantic Models ---
class ChatMessage(BaseModel):
    id: int
    text: str
    sender: str

class ChatRequest(BaseModel):
    prompt: str
    history: List[ChatMessage]
    modelId: str

class MapDirectionsPayload(BaseModel):
    origin: str
    destination: str
    mode: str

class MapSearchPayload(BaseModel):
    query: str

class MapDirectionsToolCall(BaseModel):
    type: str = 'map_directions'
    payload: MapDirectionsPayload

class MapSearchToolCall(BaseModel):
    type: str = 'map_search'
    payload: MapSearchPayload

class LlmResponse(BaseModel):
    text: str
    toolCall: Optional[MapDirectionsToolCall | MapSearchToolCall] = None

# --- FastAPI App ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Gemini API Configuration ---
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# --- System Instructions ---
geminiSystemInstruction = """You are GeoChat AI, a helpful assistant integrated into a mapping application. You are having an ongoing conversation with a user. Your primary function is to understand their requests in the context of the entire conversation history.

Your response MUST be a single, valid JSON object and nothing else. Do not wrap it in markdown backticks.

The JSON object must conform to the following schema:
{
  "type": "object",
  "properties": {
    "requestType": {
      "type": "string",
      "description": "Classify the user's request. Must be 'DIRECTIONS', 'SEARCH', or 'NONE'."
    },
    "responseText": {
      "type": "string",
      "description": "A conversational response to the user."
    },
    "origin": {
      "type": "string",
      "description": "Directions starting location. Required only for 'DIRECTIONS'."
    },
    "destination": {
      "type": "string",
      "description": "Directions destination. Required only for 'DIRECTIONS'."
    },
    "mode": {
      "type": "string",
      "description": "Travel mode. Only for 'DIRECTIONS'. Default 'driving'."
    },
    "searchQuery": {
      "type": "string",
      "description": "A concise search query. Required only for 'SEARCH'."
    }
  },
  "required": ["requestType", "responseText"]
}

Based on the conversation, generate the JSON object. For example:
- If the user asks for directions, set 'requestType' to 'DIRECTIONS' and fill in the other required fields.
- If the user asks to find a place, set 'requestType' to 'SEARCH'.
- If it's just conversation, set 'requestType' to 'NONE'.
"""
ollamaSystemInstruction = """You are a strict JSON generation bot. Your only job is to analyze the user's request and respond with a single, valid JSON object. Do not add any conversational text outside the JSON.

Based on the user's request, choose a `requestType`:
1. 'DIRECTIONS': For requests about directions.
2. 'SEARCH': For requests to find a place.
3. 'NONE': For anything else.

- If `requestType` is 'DIRECTIONS', your JSON must include `origin`, `destination`, and `mode`.
- If `requestType` is 'SEARCH', your JSON must include `searchQuery`.
- If `requestType` is 'NONE', your JSON must include a `responseText` with a conversational reply.

EXAMPLE (Directions):
User: "get me to the airport from downtown"
Your JSON: {"requestType": "DIRECTIONS", "origin": "downtown", "destination": "airport", "mode": "driving"}

EXAMPLE (Search):
User: "any good coffee shops nearby?"
Your JSON: {"requestType": "SEARCH", "searchQuery": "good coffee shops nearby"}

EXAMPLE (Conversation):
User: "thanks!"
Your JSON: {"requestType": "NONE", "responseText": "You're welcome! Is there anything else I can help with?"}

Now, generate the JSON for the user's request."""
responseSchema = {
    "type": "object",
    "properties": {
        "requestType": {"type": "string", "description": "Must be 'DIRECTIONS', 'SEARCH', or 'NONE'."},
        "responseText": {"type": "string", "description": "A conversational response to the user."},
        "origin": {"type": "string", "description": "Directions starting location. Only for 'DIRECTIONS'."},
        "destination": {"type": "string", "description": "Directions destination. Only for 'DIRECTIONS'."},
        "mode": {"type": "string", "description": "Travel mode. Only for 'DIRECTIONS'. Default 'driving'."},
        "searchQuery": {"type": "string", "description": "Search query. Only for 'SEARCH'."}
    },
    "required": ["requestType", "responseText"]
}

# --- API Endpoint ---
@app.get("/api/maps-key")
async def maps_key():
    if not GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Google Maps API key not configured on the server.")
    return {"apiKey": GOOGLE_MAPS_API_KEY}


@app.post("/api/chat", response_model=LlmResponse)
async def chat(request: ChatRequest):
    try:
        if request.modelId.startswith('gemini'):
            json_text = await get_gemini_response(request.prompt, request.history)
        elif request.modelId.startswith('ollama'):
            json_text = await get_ollama_response(request.prompt, request.history)
        else:
            raise HTTPException(status_code=400, detail="Unknown model provider.")
        
        return parse_llm_json_response(json_text)

    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- LLM Logic ---
async def get_gemini_response(prompt: str, history: List[ChatMessage]) -> str:
    model = genai.GenerativeModel(GEMINI_MODEL, system_instruction=geminiSystemInstruction)
    formatted_history = [
        {"role": "user" if msg.sender == "USER" else "model", "parts": [{"text": msg.text}]}
        for msg in history if msg.id != 1
    ]
    contents = formatted_history + [{"role": "user", "parts": [{"text": prompt}]}]
    
    response = await model.generate_content_async(
        contents,
        generation_config={"response_mime_type": "application/json"},
    )
    return response.text

async def get_ollama_response(prompt: str, history: List[ChatMessage]) -> str:
    formatted_history = [
        {"role": "user" if msg.sender == "USER" else "assistant", "content": msg.text}
        for msg in history if msg.id != 1
    ]
    messages = [
        {"role": "system", "content": ollamaSystemInstruction},
        *formatted_history,
        {"role": "user", "content": prompt},
    ]

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{OLLAMA_SERVER_URL}/v1/chat/completions",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "response_format": {"type": "json_object"},
            },
            timeout=60.0,
        )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]

import json

import json
import re

def parse_llm_json_response(raw_response: str) -> LlmResponse:
    print(f"--- Raw LLM Response ---\n{raw_response}\n------------------------")

    # Use regex to find a JSON object within the raw response string
    json_match = re.search(r'{.*}', raw_response, re.DOTALL)
    
    if not json_match:
        print("No JSON object found in LLM response.")
        return LlmResponse(text=raw_response or "I'm sorry, I couldn't understand that request.")

    json_text = json_match.group(0)

    try:
        parsed_response = json.loads(json_text)
        request_type = parsed_response.get("requestType")

        if request_type == 'DIRECTIONS' and parsed_response.get("origin") and parsed_response.get("destination"):
            mode_str = parsed_response.get('mode', 'driving').lower()
            mode = 'driving'
            if 'walk' in mode_str: mode = 'walking'
            elif 'bike' in mode_str or 'bicycling' in mode_str: mode = 'bicycling'
            elif 'transit' in mode_str: mode = 'transit'
            
            response_text = parsed_response.get("responseText") or f"Here are the directions from {parsed_response['origin']} to {parsed_response['destination']}."

            return LlmResponse(
                text=response_text,
                toolCall=MapDirectionsToolCall(
                    payload=MapDirectionsPayload(
                        origin=parsed_response["origin"],
                        destination=parsed_response["destination"],
                        mode=mode
                    )
                )
            )
        elif request_type == 'SEARCH' and parsed_response.get("searchQuery"):
            response_text = parsed_response.get("responseText") or f"Searching for \"{parsed_response['searchQuery']}\"."
            return LlmResponse(
                text=response_text,
                toolCall=MapSearchToolCall(
                    payload=MapSearchPayload(query=parsed_response["searchQuery"])
                )
            )
        else:
            response_text = parsed_response.get("responseText") or "I'm sorry, I received an unexpected response. Could you please try rephrasing?"
            return LlmResponse(text=response_text)

    except (json.JSONDecodeError, KeyError) as e:
        print(f"Failed to parse LLM JSON response: {json_text} - Error: {e}")
        return LlmResponse(text=raw_response)