'use client';

import { useParams } from 'next/navigation';
import Chat from '@/components/Chat';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const GeneralChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call Mistral API with conversation history
      const response = await fetchMistralResponse(messages.concat(userMessage));
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.content 
      }]);
    } catch (error) {
      // Handle errors appropriately
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="chat-container">
      {/* Messages display */}
      {/* Input field */}
    </div>
  );
};

async function fetchMistralResponse(messages: ChatMessage[]): Promise<{content: string}> {
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    return { content: data.choices[0].message.content };
  } catch (error) {
    throw new Error(`Mistral API error: ${error.message}`);
  }
}

export default function ChatPage() {
  const params = useParams();
  const [agent, setAgent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Get the agent from the URL params
    if (params && params.agent) {
      setAgent(params.agent as string);
    }
    setIsLoading(false);
  }, [params]);
  
  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  // Validate agent - convert both to uppercase for case-insensitive comparison
  const validAgents = ['PABLOS', 'GIORGOS', 'ACHILLIES', 'FAWZI'];
  const normalizedAgent = agent.toUpperCase();
  if (!validAgents.includes(normalizedAgent)) {
    return (
      <div className="container">
        <div className="welcome-screen">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Invalid Agent Selected</h2>
          <p className="mb-6">The selected agent is not valid. Please return to the home page and select a valid agent.</p>
          <Link href="/" className="send-button px-4 py-2">Return to Home</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <main className="main">
        <Chat agent={normalizedAgent} />
      </main>
    </div>
  );
} 