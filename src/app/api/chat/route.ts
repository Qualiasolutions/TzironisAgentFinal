// Force Node.js runtime for better compatibility with API calls
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { processConversation } from '@/utils/langchainSetup';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Define proper types for chat history
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Message validation interface
interface MessageValidation {
  role?: string;
  content?: string;
  [key: string]: unknown;
}

// Custom error responses for different scenarios
const ERROR_RESPONSES = {
  timeout: "I apologize for the delay. Our systems are currently experiencing high demand. Let me help with your query as soon as possible. For urgent matters, please try a more specific question.",
  apiFailure: "I encountered a technical issue while processing your request. This is likely a temporary problem. Could you please try again in a moment?",
  validation: "I need more information to assist you properly. Could you please provide a clear question or request?",
  general: "I apologize for the inconvenience. There was an unexpected error. Let's try a different approach to your question."
};

export async function POST(request: NextRequest) {
  try {
    let message, history, agent;
    
    try {
      // Parse the request body and handle potential JSON parse errors
      const body = await request.json();
      message = body.message;
      history = body.history;
      agent = body.agent;
    } catch (error) {
      console.error('Error parsing request JSON:', error);
      return NextResponse.json(
        { message: "I couldn't process your message format. Please try again." },
        { status: 400 }
      );
    }

    // Validate input
    if (!message || typeof message !== 'string') {
      console.warn('Invalid message format received');
      return NextResponse.json(
        { message: ERROR_RESPONSES.validation },
        { status: 400 }
      );
    }

    // Log API call for debugging
    console.log(`Chat request received: agent=${agent || 'default'}, message length=${message.length}`);
    
    // Detailed log of incoming request
    console.log('Request history:', 
      Array.isArray(history) ? `${history.length} messages` : 'Invalid history format'
    );
    
    // Check for Hugging Face API key
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error('Missing HUGGINGFACE_API_KEY in environment variables');
      return NextResponse.json(
        { message: "I apologize, but I cannot process your request at the moment due to a configuration issue. Please contact the administrator to set up the AI service properly." },
        { status: 200 } // Return 200 to display the error message in the chat
      );
    }

    // Convert history to LangChain message format with validation
    const langchainHistory = Array.isArray(history) 
      ? history.filter((msg: MessageValidation) => 
          msg && typeof msg === 'object' && 
          (msg.role === 'user' || msg.role === 'assistant') && 
          typeof msg.content === 'string'
        ).map((msg: ChatMessage) => {
          return msg.role === 'user' 
            ? new HumanMessage(msg.content) 
            : new AIMessage(msg.content);
        }) 
      : [];

    // Add timeout to the entire API request (8 seconds for Vercel compatibility)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), 8000);
    });

    // Process the conversation with a timeout
    const responsePromise = processConversation(message, langchainHistory, agent);
    
    try {
      // Race between the API processing and the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      // Return the AI response with the correct key 'message'
      return NextResponse.json({ message: response });
    } catch (error) {
      console.error('Request failed:', error);
      
      // Return appropriate fallback based on error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Detailed error:', JSON.stringify(error));
      
      if (errorMessage.includes('timed out')) {
        return NextResponse.json({ message: ERROR_RESPONSES.timeout });
      } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        return NextResponse.json({ 
          message: "I apologize, but we've reached our usage limit for the AI service. Please try again in a few minutes."
        });
      } else if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
        return NextResponse.json({ 
          message: "I apologize, but there seems to be an authentication issue with our AI service. Please contact the administrator."
        });
      } else {
        return NextResponse.json({ 
          message: ERROR_RESPONSES.apiFailure
        });
      }
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { message: ERROR_RESPONSES.general },
      { status: 200 } // Still return 200 to show error in chat instead of failing
    );
  }
} 