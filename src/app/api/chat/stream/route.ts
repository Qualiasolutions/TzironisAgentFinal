import { NextRequest, NextResponse } from 'next/server';
import { MistralAIService } from '@/services/MistralAIService';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

export const runtime = 'edge';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { message, history, agent = 'Tzironis' } = await req.json();

    if (!message) {
      return new NextResponse(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize service with API key from environment
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error('No Mistral API key found in environment');
      return new NextResponse(
        JSON.stringify({ error: 'Missing API key for Mistral AI service' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Mistral AI service
    const mistralService = new MistralAIService(apiKey);

    // Convert history to LangChain format
    const formattedHistory = history.map((msg: any) => {
      if (msg.type === 'human' || msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    });

    // Create a TransformStream to stream the response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the streaming process
    streamResponse(writer, encoder, mistralService, message, formattedHistory, agent)
      .catch(error => {
        console.error('Streaming error:', error);
        writer.write(encoder.encode(`Error: ${error.message}`));
        writer.close();
      });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Chat stream API error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to process streaming chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function streamResponse(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  service: MistralAIService, 
  message: string, 
  history: any[], 
  agent: string
): Promise<void> {
  try {
    // Begin streaming the response
    await service.generateStreamingResponse(
      message,
      history,
      {
        onToken: (token: string) => {
          writer.write(encoder.encode(token));
        },
        onComplete: async (fullResponse: string) => {
          await writer.close();
        },
        onError: async (error: Error) => {
          console.error('Streaming error:', error);
          writer.write(encoder.encode(`\nError: ${error.message}`));
          await writer.close();
        }
      },
      agent
    );
  } catch (error) {
    console.error('Failed to stream response:', error);
    writer.write(encoder.encode(`\nFailed to generate streaming response: ${error instanceof Error ? error.message : 'Unknown error'}`));
    await writer.close();
  }
} 