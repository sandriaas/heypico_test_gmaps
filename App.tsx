
import React from 'react';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center font-sans">
      <div className="w-full h-screen flex flex-col max-w-4xl mx-auto">
        <header className="p-4 border-b border-gray-700 text-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            GeoChat AI
          </h1>
          <p className="text-sm text-gray-400">Your AI assistant for maps and directions</p>
        </header>
        <main className="flex-1 overflow-y-auto">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
};

export default App;
