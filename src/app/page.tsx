'use client';

import { useState, useRef, useEffect } from 'react';
import { detect } from '@/utils/languageDetection';
import Image from 'next/image';

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognition = useRef<SpeechRecognition | null>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognition.current = new SpeechRecognitionAPI();
      speechRecognition.current.continuous = true;
      speechRecognition.current.interimResults = true;
      
      speechRecognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
      };
      
      speechRecognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      speechRecognition.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechRecognition.current) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      speechRecognition.current.stop();
      setIsListening(false);
    } else {
      speechRecognition.current.start();
      setIsListening(true);
      setError(null);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in your browser.');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Set language based on detected text
    utterance.lang = getTextLanguage(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setError('Error occurred while speaking.');
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Language detection function - used internally by speakText
  const getTextLanguage = (text: string): string => {
    try {
      const detected = detect(text);
      return detected?.[0]?.lang || 'en';
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Show loading indicator
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          agent: selectedAgent || 'default'
        }),
      });

      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, there was an error processing your request.',
          role: 'assistant',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelection = (agent: string) => {
    setSelectedAgent(agent);
    
    // Add a system message indicating the selected agent
    const systemMessage: Message = {
      id: Date.now().toString(),
      content: `I'm ${agent}. Hello! I'm your intelligent Tzironis Business Suite assistant. How can I help you today?`,
      role: 'assistant',
      timestamp: Date.now(),
    };
    
    setMessages([systemMessage]);
  };

  return (
    <div className="chat-container fade-in">
      <header className="chat-header">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Tzironis Logo" 
              width={32}
              height={32}
              className="h-8 w-auto mr-3"
            />
            <h1 className="text-2xl font-bold text-white">
              Tzironis Business Suite
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-white opacity-80">Powered by AI</div>
          </div>
        </div>
      </header>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="text-center my-8">
            <div className="flex justify-center mb-6">
              <Image 
                src="/logo.png" 
                alt="Tzironis Logo" 
                width={64}
                height={64}
                className="h-16 w-auto mb-4"
              />
            </div>
            <h2 className="text-2xl font-semibold mb-6 text-primary">
              Welcome to Tzironis Business Suite
            </h2>
            
            <div className="welcome-box max-w-xl mx-auto">
              <p className="mb-6 text-gray-600">Please select your virtual assistant to begin:</p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { id: 'PABLOS', icon: '👨‍💼', role: 'Business Strategist' },
                  { id: 'GIORGOS', icon: '👨‍💻', role: 'Technical Advisor' },
                  { id: 'ACHILLIES', icon: '📊', role: 'Analytics Expert' },
                  { id: 'FAWZI', icon: '🤖', role: 'AI Specialist' }
                ].map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleAgentSelection(agent.id)}
                    className="p-4 rounded-lg border hover:border-primary transition-colors text-lg"
                  >
                    <div className="text-3xl mb-2">{agent.icon}</div>
                    <div className="font-medium text-primary">{agent.id}</div>
                    <div className="text-sm text-gray-500">{agent.role}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={message.role === 'user' ? 'message-user' : 'message-assistant'}
            >
              <div className="message-content">{message.content}</div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                {message.role === 'assistant' && (
                  <button 
                    onClick={() => speakText(message.content)}
                    disabled={isSpeaking}
                    className="text-xs flex items-center opacity-70 hover:opacity-100 transition-opacity"
                    title="Listen to this message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                      <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                      <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        
        {isListening && (
          <div className="self-center py-2 px-4 rounded-full bg-primary text-white animate-pulse shadow-lg">
            Listening...
          </div>
        )}
        
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input">
          <button
            type="button"
            onClick={toggleListening}
            className={`voice-button ${isListening ? 'active' : ''}`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3zm0 1a2 2 0 0 1 2 2v5a2 2 0 1 1-4 0V3a2 2 0 0 1 2-2z"/>
              <path d="M12.5 5a.5.5 0 0 0-1 0 3.5 3.5 0 1 1-7 0 .5.5 0 0 0-1 0 4.5 4.5 0 0 0 4 4.472V13H5.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1H8.5V9.472A4.5 4.5 0 0 0 12.5 5z"/>
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            ) : (
              <span className="flex items-center">
                Send
                <svg className="ml-1 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
