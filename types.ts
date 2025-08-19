
export type LlmProvider = 'gemini' | 'ollama';

export interface LlmModel {
  id: string; // e.g., 'gemini-2.5-flash'
  provider: LlmProvider;
  name: string; // e.g., 'Gemini 2.5 Flash'
}

export enum MessageSender {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export interface MapDirectionsPayload {
  origin: string;
  destination: string;
  mode: 'driving' | 'walking' | 'bicycling' | 'transit';
}

export interface MapSearchPayload {
  query: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  sender: MessageSender;
  mapDirectionsPayload?: MapDirectionsPayload;
  mapSearchPayload?: MapSearchPayload;
}