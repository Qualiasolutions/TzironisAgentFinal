'use client';

import { useState, useEffect, useRef } from 'react';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function MistralChatExample() {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('Pablos');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Display welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I'm ${selectedAgent}, your Tzironis Business Suite assistant powered by Mistral AI. I can help with tasks like web scraping, invoice generation, and accessing business data.`
        }
      ]);
    }
  }, [selectedAgent, messages.length]);

  // Reset chat when agent changes
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Hello! I'm ${selectedAgent}, your Tzironis Business Suite assistant powered by Mistral AI. I can help with tasks like web scraping, invoice generation, and accessing business data.`
      }
    ]);
  }, [selectedAgent]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear any previous errors
    setError(null);
    
    // Add user message to chat
    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert messages to format expected by API
      const history = messages.map((msg) => {
        return msg.role === 'user' 
          ? { type: 'human', content: msg.content }
          : { type: 'ai', content: msg.content };
      });

      // Make API request with retry logic
      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: input,
              history,
              agent: selectedAgent
            }),
          });
          
          // If successful, break out of retry loop
          if (response.ok) break;
          
          // If got a 503 error, retry
          if (response.status === 503) {
            retryCount++;
            if (retryCount <= maxRetries) {
              // Add short delay before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          }
          
          // For other errors, throw immediately
          throw new Error(`API request failed with status ${response.status}`);
        } catch (err) {
          // Network error (like CORS, timeout, etc)
          retryCount++;
          if (retryCount <= maxRetries) {
            // Add short delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw err;
        }
      }

      if (!response || !response.ok) {
        const errorText = await response?.text() || 'Network error';
        console.error('API error:', errorText);
        throw new Error(`Failed to get response from server: ${response?.status || 'Network error'}`);
      }

      const data = await response.json();
      
      if (data.message) {
        // Add AI response to chat
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message }
        ]);
      } else {
        throw new Error('Empty response from API');
      }
    } catch (error) {
      console.error('Error calling API:', error);
      
      // Show a specific error message based on the error
      let errorMessage = 'I encountered an error processing your request. This could be due to a connection issue or service limitations. Please try again later.';
      
      if (error instanceof Error) {
        if (error.message.includes('503') || error.message.includes('service unavailable')) {
          errorMessage = 'The AI service is currently unavailable due to high demand. Please try again in a few minutes.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request took too long to process. Please try a shorter message or try again later.';
        } else if (error.message.includes('Network error')) {
          errorMessage = 'There seems to be a network connectivity issue. Please check your internet connection and try again.';
        }
      }
      
      setError(errorMessage);
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an unexpected error processing your request. Please try again or contact support if the issue persists.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mistral-chat-container">
      <div className="mistral-chat-header">
        <h3>Chat with {selectedAgent} (Mistral AI)</h3>
        <select 
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="agent-selector"
        >
          <option value="Tzironis">Tzironis (General)</option>
          <option value="Pablos">Pablos (Tech)</option>
          <option value="Giorgos">Giorgos (Business)</option>
          <option value="Achillies">Achillies (Analytics)</option>
          <option value="Fawzi">Fawzi (Innovation)</option>
        </select>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="assistant-message loading">
            <div className="loading-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me to scrape data, generate invoices, or access business information..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
      
      <div className="tool-capabilities">
        <h4>Available Capabilities:</h4>
        <ul>
          <li>Web Scraping - "Scrape data from [website]"</li>
          <li>Invoice Generation - "Generate an invoice for client [name]"</li>
          <li>Client/Product Management - "List all clients" or "Find product [name]"</li>
          <li>Data Analysis - "Analyze sales for [time period]"</li>
        </ul>
      </div>
    </div>
  );
} 