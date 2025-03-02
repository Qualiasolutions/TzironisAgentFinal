// Force Node.js runtime for better compatibility with API calls
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { processConversation } from '@/utils/mistralSetup';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Define proper types for chat history
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MistralMessage {
  type: 'human' | 'ai';
  content: string;
}

// Message validation interface
interface MessageValidation {
  role?: string;
  content?: string;
  type?: string;
  [key: string]: unknown;
}

// Custom error responses for different scenarios
const ERROR_RESPONSES = {
  timeout: "I apologize for the delay. Our systems are currently experiencing high demand. Let me help with your query as soon as possible. For urgent matters, please try a more specific question.",
  apiFailure: "I encountered a technical issue while processing your request. This is likely a temporary problem. Could you please try again in a moment?",
  validation: "I need more information to assist you properly. Could you please provide a clear question or request?",
  general: "I apologize for the inconvenience. There was an unexpected error. Let's try a different approach to your question."
};

// API route handler for chat requests
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { message, history, agent } = body;
    
    // Validate required parameters
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Format history into LangChain message format
    let formattedHistory;
    
    if (Array.isArray(history)) {
      // Handle different message formats that might come from different components
      formattedHistory = history.map((msg: any) => {
        if (msg.type === 'human') {
          return new HumanMessage(msg.content);
        } else if (msg.type === 'ai') {
          return new AIMessage(msg.content);
        } else if (msg.role === 'user') {
          return new HumanMessage(msg.content);
        } else if (msg.role === 'assistant') {
          return new AIMessage(msg.content);
        } else {
          // Default fallback
          return new AIMessage(msg.content || '');
        }
      });
    } else {
      formattedHistory = [];
    }

    console.log(`Processing chat request with agent: ${agent || 'default'}`);
    
    // Process the conversation using Mistral AI
    const response = await processConversation(message, formattedHistory, agent);
    
    // Return the AI response
    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Error processing chat request:', error);
    
    // Return an appropriate error response
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'An unknown error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}

// Optional: Handle GET requests
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { info: 'Chat API is working. Send POST requests to interact with Mistral AI.' }
  );
} 