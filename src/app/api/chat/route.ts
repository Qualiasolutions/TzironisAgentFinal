import { NextRequest, NextResponse } from 'next/server';
import { MistralService, ChatMessage } from '@/lib/mistral';

// Default to environment variable or fallback to a placeholder
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { message, history, language = 'en' } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: 'Mistral API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize Mistral service with configuration
    const mistralService = new MistralService({
      model: 'mistral-medium',
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Prepare conversation history for Mistral AI
    const messages: ChatMessage[] = [
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      } as ChatMessage)),
      { role: 'user', content: message },
    ];

    // Send the message to Mistral AI
    const aiMessage = await mistralService.sendMessage(messages);

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('API key')) {
        statusCode = 401;
      } else if (errorMessage.includes('Rate limit')) {
        statusCode = 429;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 