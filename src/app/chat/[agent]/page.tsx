'use client';

import { useParams, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const agent = useParams().agent as string;
  const normalizedAgent = normalizeAgentName(agent);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-col flex-1">
        <div className="flex flex-col flex-1 overflow-hidden">
          <Chat agent={normalizedAgent} />
        </div>
      </div>
    </main>
  );
}

// Helper to normalize agent name
function normalizeAgentName(agent: string): string {
  switch (agent?.toLowerCase()) {
    case 'pablos':
      return 'Pablos';
    case 'giorgos':
      return 'Giorgos';
    case 'achillies':
      return 'Achillies';
    case 'fawzi':
      return 'Fawzi';
    default:
      return 'Tzironis';
  }
} 