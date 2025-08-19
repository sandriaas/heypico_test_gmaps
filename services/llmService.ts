
import { ChatMessage } from '../types';
import { MapDirectionsPayload, MapSearchPayload } from '../types';

// --- Type Definitions ---
interface MapDirectionsToolCall {
  type: 'map_directions';
  payload: MapDirectionsPayload;
}

interface MapSearchToolCall {
  type: 'map_search';
  payload: MapSearchPayload;
}

type ToolCall = MapDirectionsToolCall | MapSearchToolCall;

export interface LlmResponse {
  text: string;
  toolCall?: ToolCall;
}

/**
 * Gets a response from the currently selected LLM via the FastAPI backend.
 */
export const getLlmResponse = async (prompt: string, history: ChatMessage[], modelId: string): Promise<LlmResponse> => {
  const response = await fetch('http://localhost:8000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      history,
      modelId,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("API Error:", errorBody);
    return { text: `I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.` };
  }

  const data = await response.json();
  return data;
};
