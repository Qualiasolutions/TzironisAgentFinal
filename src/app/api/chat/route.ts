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
    const { message, history } = await request.json();

    // Validate input
    if (!message || typeof message !== 'string') {
      console.warn('Invalid message format received');
      return NextResponse.json(
        { response: ERROR_RESPONSES.validation },
        { status: 400 }
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

    // Add timeout to the entire API request (25 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), 25000);
    });

    // Process the conversation with a timeout
    const responsePromise = processConversation(message, langchainHistory);
    
    try {
      // Race between the API processing and the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      // Return the AI response
      return NextResponse.json({ response });
    } catch (error: Error | unknown) {
      console.error('Request failed:', error);
      
      // Return appropriate fallback based on error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('timed out')) {
        return NextResponse.json({ response: ERROR_RESPONSES.timeout });
      } else {
        return NextResponse.json({ response: ERROR_RESPONSES.apiFailure });
      }
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { response: ERROR_RESPONSES.general },
      { status: 200 } // Still return 200 to show error in chat instead of failing
    );
  }
} 