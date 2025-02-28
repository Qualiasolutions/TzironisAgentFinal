'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { detect } from '@/utils/languageDetection';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectLanguage = (text: string): string => {
    try {
      const detected = detect(text);
      return detected?.[0]?.lang || 'en';
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const language = detectLanguage(input);
      
      const response = await axios.post('/api/chat', {
        message: input,
        language,
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.message,
        role: 'assistant',
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to communicate with the AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow p-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Tzironis Business Suite</h1>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col p-4">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
              <p className="text-lg">Welcome to the Tzironis Business Assistant</p>
              <p className="text-sm mt-2">How can I help you today?</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 text-right mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 max-w-[80%] rounded-lg p-3 shadow">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
                {error}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
