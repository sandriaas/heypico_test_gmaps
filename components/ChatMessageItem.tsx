import React from 'react';
import { ChatMessage, MessageSender } from '../types';
import MapEmbed from './MapEmbed';
import { UserIcon, BotIcon } from './Icons';

interface ChatMessageItemProps {
  message: ChatMessage;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const mapPayload = message.mapDirectionsPayload || message.mapSearchPayload;

  const userMessage = (
    <div className="flex items-start justify-end space-x-4">
      <div className="p-4 max-w-lg bg-blue-600 rounded-2xl rounded-br-none">
        <p className="text-white whitespace-pre-wrap">{message.text}</p>
      </div>
       <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
        <UserIcon />
      </div>
    </div>
  );

  const assistantMessage = (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center">
        <BotIcon />
      </div>
      <div className="p-4 max-w-lg bg-gray-700 rounded-2xl rounded-bl-none">
        <p className={`text-gray-200 whitespace-pre-wrap ${mapPayload ? 'mb-4' : ''}`}>{message.text}</p>
        {mapPayload && (
          <MapEmbed payload={mapPayload} />
        )}
      </div>
    </div>
  );

  return isUser ? userMessage : assistantMessage;
};

export default ChatMessageItem;