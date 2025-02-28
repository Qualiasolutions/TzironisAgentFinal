import { NextRequest, NextResponse } from 'next/server';
import { processConversation } from '@/utils/langchainSetup';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Define proper types for chat history
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, agent } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Convert history to LangChain message format
    const langchainHistory = history?.map((msg: ChatMessage) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    }) || [];

    // Add timeout to the entire API request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timed out')), 20000);
    });

    // Process the conversation with a timeout
    const responsePromise = processConversation(message, langchainHistory, agent);
    
    try {
      // Race between the API processing and the timeout
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      // Return the AI response
      return NextResponse.json({ response });
    } catch (error) {
      console.error('Request timed out or failed:', error);
      // Return a fallback response
      return NextResponse.json({ 
        response: "I'm currently experiencing high demand. Let me assist you with simpler tasks while our systems catch up." 
      });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { response: 'Sorry, I encountered an error processing your message. Please try again.' },
      { status: 200 } // Still return 200 to show error in chat instead of failing
    );
  }
} 