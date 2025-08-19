
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, MessageSender } from '../types';
import { getLlmResponse } from '../services/llmService';
import ChatMessageItem from './ChatMessageItem';
import { SendIcon, BotIcon, NavigationIcon } from './Icons';
import ModelSwitcher from './ModelSwitcher';
import { AVAILABLE_MODELS } from '../constants';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Hello! I can help you with directions or find places for you. Try 'directions from Jakarta to Bandung' or click the navigation button to use your current location.",
      sender: MessageSender.ASSISTANT
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingDestination, setIsAwaitingDestination] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>(AVAILABLE_MODELS[1].id);
  const currentUserLocationRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNavigationClick = useCallback(() => {
    if (!navigator.geolocation) {
      const errorMsg: ChatMessage = {
        id: Date.now(),
        text: "I'm sorry, but your browser does not support geolocation.",
        sender: MessageSender.ASSISTANT,
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        currentUserLocationRef.current = `${latitude},${longitude}`;
        setIsAwaitingDestination(true);

        const successMsg: ChatMessage = {
          id: Date.now(),
          text: "I've found your current location. Please enter your destination.",
          sender: MessageSender.ASSISTANT,
        };
        setMessages(prev => [...prev, successMsg]);
        setIsLoading(false);
      },
      (error) => {
        let errorMessageText = "I couldn't retrieve your location. Please ensure you've enabled location permissions for this site in your browser settings.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessageText = "You've denied permission to access your location. I cannot provide navigation without it. You can change this in your browser settings.";
        }
        const errorMsg: ChatMessage = {
          id: Date.now(),
          text: errorMessageText,
          sender: MessageSender.ASSISTANT,
        };
        setMessages(prev => [...prev, errorMsg]);
        setIsLoading(false);
      }
    );
  }, []);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: input,
      sender: MessageSender.USER,
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    let prompt = input;
    if (isAwaitingDestination && currentUserLocationRef.current) {
      prompt = `Give me directions from my current location, which is ${currentUserLocationRef.current}, to ${input}`;
      setIsAwaitingDestination(false);
      currentUserLocationRef.current = null;
    }
    
    setInput('');
    setIsLoading(true);

    const assistantResponse = await getLlmResponse(prompt, messages, selectedModelId);
    
    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      text: assistantResponse.text,
      sender: MessageSender.ASSISTANT,
      mapDirectionsPayload: assistantResponse.toolCall?.type === 'map_directions' 
        ? assistantResponse.toolCall.payload 
        : undefined,
      mapSearchPayload: assistantResponse.toolCall?.type === 'map_search' 
        ? assistantResponse.toolCall.payload 
        : undefined,
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  }, [input, isLoading, isAwaitingDestination, messages, selectedModelId]);

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center">
              <BotIcon />
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="w-3 h-3 bg-gray-400 rounded-full animate-pulse delay-0"></span>
              <span className="w-3 h-3 bg-gray-400 rounded-full animate-pulse delay-150"></span>
              <span className="w-3 h-3 bg-gray-400 rounded-full animate-pulse delay-300"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="max-w-md mx-auto mb-3">
            <ModelSwitcher
              models={AVAILABLE_MODELS}
              selectedModelId={selectedModelId}
              onModelChange={setSelectedModelId}
              disabled={isLoading}
            />
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isAwaitingDestination ? "Enter your destination..." : "Ask for directions or places..."}
            className="flex-1 w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleNavigationClick}
            disabled={isLoading || isAwaitingDestination}
            className="p-3 bg-gray-600 rounded-full text-white hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Use current location for navigation"
          >
            <NavigationIcon />
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
