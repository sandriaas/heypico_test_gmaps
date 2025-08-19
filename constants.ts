import { LlmModel } from "./types";

// --- LLM Configuration ---

// The endpoint for your local Ollama server.
export const OLLAMA_API_URL = "http://localhost:11434";

// The name of the model to use with Ollama, as requested by the user.
// Ensure you have pulled this model (e.g., `ollama pull gemma3:1b`).
export const OLLAMA_MODEL_NAME = "gemma3:1b";

// The list of AI models available in the application.
export const AVAILABLE_MODELS: LlmModel[] = [
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    name: 'Gemini 2.5 Flash (Cloud)'
  },
  {
    id: 'ollama-gemma3-1b',
    provider: 'ollama',
    name: `Ollama (${OLLAMA_MODEL_NAME}) (Local)`
  }
];
