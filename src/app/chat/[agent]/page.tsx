'use client';

import { useParams } from 'next/navigation';
import Chat from '@/components/Chat';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  
  // Validate agent
  const validAgents = ['PABLOS', 'GIORGOS', 'ACHILLIES', 'FAWZI'];
  if (!validAgents.includes(agent)) {
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
        <Chat agent={agent} />
      </main>
    </div>
  );
} 