import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { IconArrowLeft, IconSend, IconUser, IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
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
      content: `I'm ${agent}. Hello! I'm your intelligent Tzironis Business Suite assistant. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
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

  // Scroll to the bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        return new HumanMessage(message.content);
      } else {
        return new AIMessage(message.content);
      }
    });
  };

  // Handle submitting a new message
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const userMessage = input.trim();
    if (!userMessage) return;
    
    // Stop speech recognition if active
    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    
    // Update messages with user input
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    
    try {
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
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      // Add the assistant's response
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'I apologize, but there was an error processing your request. Please try again later.' 
        },
      ]);
    } finally {
      setIsLoading(false);
      // Focus back on the input
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  };

  // Return to the agent selection screen
  const handleBack = () => {
    router.push('/');
  };

  // Function to get the first letter for the avatar
  const getAvatarText = (text: string): string => {
    return text.charAt(0);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title-container">
          <button className="back-button" onClick={handleBack} aria-label="Back to agent selection">
            <IconArrowLeft size={18} />
          </button>
          <span className="chat-title">Conversation with {agent}</span>
        </div>
      </div>
      
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role} fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className={`message-avatar ${message.role === 'assistant' ? 'assistant-avatar' : 'user-avatar'}`}>
              {message.role === 'assistant' 
                ? getAvatarText(agent) 
                : <IconUser size={18} />}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="typing-indicator fade-in">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-container">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          className="message-input"
          disabled={isLoading}
        />
        {recognition && (
          <button 
            type="button"
            onClick={toggleListening}
            className={`voice-button ${isListening ? 'voice-active' : ''}`}
            disabled={isLoading}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <IconMicrophoneOff size={18} /> : <IconMicrophone size={18} />}
          </button>
        )}
        <button 
          type="submit" 
          className="send-button" 
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          <IconSend size={18} />
        </button>
      </form>
    </div>
  );
};

export default Chat; 