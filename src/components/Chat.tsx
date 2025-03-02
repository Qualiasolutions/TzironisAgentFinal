import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { IconArrowLeft, IconSend, IconUser, IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import ChatMessageList from './ChatMessageList';
import PromptForm from './PromptForm';
import Avatar from './Avatar';
import { Message } from '@/types';
import { SendIcon, AvatarIcon, Spinner } from './Icons';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  isStreaming?: boolean;
};

interface ChatProps {
  agent: string;
}

// Add these interfaces at the top of the file, before the component
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: Event) => void;
  onstart: () => void;
  start(): void;
  stop(): void;
  abort(): void;
}

// Add these to the Window interface
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const Chat: React.FC<ChatProps> = ({ agent }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `I'm ${agent}. Hello! I'm your intelligent Tzironis Business Suite assistant powered by Mistral AI. How can I help you today?`,
      id: 'welcome-message',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Speech recognition setup
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition if available in browser
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Scroll to the bottom when messages update or streaming content changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBack = () => {
    router.push('/');
  };

  // Toggle voice input
  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // Convert messages for the API
  const formatMessagesForAPI = () => {
    return messages.map((message) => {
      if (message.role === 'user') {
        return { type: 'human', content: message.content };
      } else {
        return { type: 'ai', content: message.content };
      }
    });
  };

  // Get avatar text for the agent
  const getAvatarText = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Handle submitting a new message
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const userMessage = input.trim();
    if (!userMessage) return;
    
    // Reset states
    setError(null);
    
    // Stop speech recognition if active
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    
    // Update messages with user input
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, id: `user-${Date.now()}` }]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Check if streaming is supported and enabled
      const useStreaming = true; // Enable streaming

      if (useStreaming) {
        // Create a temporary message for streaming
        const streamMessageId = `assistant-${Date.now()}`;
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'assistant',
            content: '',
            id: streamMessageId,
            isStreaming: true,
          },
        ]);

        // Start streaming response
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            history: formatMessagesForAPI(),
            agent,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Response body is unavailable');
        }

        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode and accumulate the chunk
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          
          // Update the streaming content
          setStreamingContent(accumulatedContent);
          
          // Update the message content
          setMessages((prevMessages) => 
            prevMessages.map((msg) => 
              msg.id === streamMessageId 
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        }

        // Mark streaming as complete
        setMessages((prevMessages) => 
          prevMessages.map((msg) => 
            msg.id === streamMessageId 
              ? { ...msg, isStreaming: false }
                : msg
          )
        );
        
        setStreamingContent('');
      } else {
        // Send the message to the API
        const history = formatMessagesForAPI();
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            history,
            agent,
          }),
        });

        // Get response data - handle errors appropriately
        let data;
        const responseText = await response.text();
        
        try {
          // Try to parse the response as JSON
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse API response:', responseText);
          throw new Error(`Invalid response format: ${response.status}`);
        }

        if (!response.ok) {
          const errorMessage = data.error || `Error ${response.status}`;
          console.error('API error:', errorMessage);
          throw new Error(errorMessage);
        }
        
        // Add the assistant's response
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: data.message,
          id: `assistant-${Date.now()}` 
        }]);
      }
    } catch (err) {
      let errorMessage = 'An error occurred while getting a response';
      
      if (err instanceof Error) {
        console.error('Chat error:', err);
        
        // Handle specific error cases
        if (err.message.includes('401') || err.message.includes('auth')) {
          errorMessage = 'API key error: Please add a valid Mistral API key to your .env.local file and restart the server.';
        } else if (err.message.includes('429') || err.message.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded: Please try again in a few moments.';
        } else if (err.message.includes('500') || err.message.includes('server error')) {
          errorMessage = 'Internal server error: There was a problem processing your request. Please try again.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (err.message.includes('format')) {
          errorMessage = 'Response format error: The API returned an unexpected response format.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-neutral-950 to-neutral-900">
      <div className="flex items-center justify-center border-b border-neutral-800 py-2 px-4">
        <AvatarIcon className="w-6 h-6 mr-2 text-blue-500" />
        <h1 className="text-lg font-medium">Mistral AI Chat</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Avatar className="mx-auto h-12 w-12 text-neutral-400" />
              <h2 className="mt-5 text-lg font-medium text-neutral-200">
                Welcome to Tzironis Business Suite
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                Powered by Mistral AI
              </p>
            </div>
          </div>
        ) : (
          <ChatMessageList messages={messages} />
        )}
        
        {isLoading && !streamingContent && (
          <div className="loading-indicator">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-neutral-800 p-4">
        <PromptForm
          input={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        >
          {isLoading ? (
            <Spinner className="w-5 h-5 text-neutral-400" />
          ) : (
            <SendIcon className="w-5 h-5 text-neutral-400" />
          )}
        </PromptForm>
      </div>
    </div>
  );
};

export default Chat; 