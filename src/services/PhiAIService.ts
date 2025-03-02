/**
 * PhiAIService.ts
 * Service for integrating Microsoft's Phi-4-mini-instruct model from Hugging Face
 */

import { HumanMessage, BaseMessage } from '@langchain/core/messages';

// Define types for service
interface Message {
  role: string;
  content: string;
}

export class PhiAIService {
  private apiKey: string | undefined;
  private modelUrl: string = 'https://api-inference.huggingface.co/models/microsoft/Phi-4-mini-instruct';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Generates a response using the Phi-4-mini-instruct model
   */
  async generateResponse(
    userMessage: string,
    history: BaseMessage[],
    agent: string = 'Tzironis'
  ): Promise<string> {
    try {
      const formattedMessages = this.formatMessages(userMessage, history, agent);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (!this.apiKey) {
        console.error('No API key provided for Hugging Face');
        throw new Error('Missing API key for authentication');
      }
      
      headers['Authorization'] = `Bearer ${this.apiKey}`;

      console.log(`Sending request to ${this.modelUrl} with ${formattedMessages.length} messages`);
      
      try {
        const response = await fetch(this.modelUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            inputs: formattedMessages,
            parameters: {
              temperature: 0.7,
              max_new_tokens: 512, // Reduced for faster responses
              top_p: 0.95,
              do_sample: true,
              return_full_text: false
            }
          }),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error (${response.status}):`, errorText);
          
          if (response.status === 401) {
            throw new Error('Authentication error: Invalid API key');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded or quota reached');
          } else if (response.status === 503) {
            // Instead of throwing an error, generate a fallback response
            return this.generateFallbackResponse(userMessage, agent);
          }
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
  
        const result = await response.json();
        console.log('Raw API response:', JSON.stringify(result).substring(0, 200) + '...');
        
        // Handle different response formats from Hugging Face API
        if (Array.isArray(result) && result.length > 0) {
          if (typeof result[0].generated_text === 'string') {
            return result[0].generated_text.trim();
          }
        }
  
        if (typeof result === 'object' && result !== null && typeof result.generated_text === 'string') {
          return result.generated_text.trim();
        }
        
        // Additional fallback for other response formats
        if (typeof result === 'string') {
          return result.trim();
        }
  
        console.error('Unexpected API response format:', JSON.stringify(result));
        return this.generateFallbackResponse(userMessage, agent);
      } catch (error) {
        // If API call fails completely, use fallback
        console.error('API call error:', error);
        return this.generateFallbackResponse(userMessage, agent);
      }
    } catch (error) {
      console.error('PhiAIService error:', error);
      
      // Provide a fallback response instead of throwing
      return this.generateFallbackResponse(userMessage, agent);
    }
  }
  
  /**
   * Formats the messages for the Phi-4-mini-instruct model
   */
  private formatMessages(
    userMessage: string,
    history: BaseMessage[],
    agent: string
  ): Message[] {
    const messages: Message[] = [];
    
    // Add system message
    const systemMessage = this.createSystemMessage(agent);
    messages.push({ role: 'system', content: systemMessage });
    
    // Add conversation history
    for (const message of history) {
      const role = message._getType() === 'human' ? 'user' : 'assistant';
      messages.push({ role, content: message.content as string });
    }
    
    // Add current user message
    messages.push({ role: 'user', content: userMessage });
    
    return messages;
  }
  
  /**
   * Creates a system message based on the agent type
   */
  private createSystemMessage(agent: string): string {
    const basePrompt = `You are the Tzironis Business Suite AI Assistant named ${agent}. You are helpful, concise, and provide accurate information.`;
    
    // Specialized system prompts based on agent
    switch (agent.toLowerCase()) {
      case 'pablos':
        return `${basePrompt} Your specialty is in software development, coding, and technical implementations. Provide detailed, technically accurate responses focusing on best practices.`;
      case 'giorgos':
        return `${basePrompt} Your specialty is in business strategy, project management, and process optimization. Be analytical and provide actionable business insights.`;
      case 'achillies':
        return `${basePrompt} Your specialty is in creative problem solving, innovation, and design thinking. Offer unique perspectives and creative solutions to problems.`;
      case 'fawzi':
        return `${basePrompt} Your specialty is in data analysis, market research, and reporting. Provide fact-based, analytical responses backed by relevant information.`;
      default:
        return `${basePrompt} You excel at understanding user needs and providing practical solutions for business automation and productivity.`;
    }
  }
  
  /**
   * Generates a fallback response when the API is unavailable
   */
  private generateFallbackResponse(userMessage: string, agent: string): string {
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Simple question-answer fallbacks
    if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi') || lowercaseMessage.length < 5) {
      return `Hello! I'm ${agent}, your Tzironis Business Suite assistant. How can I help you today?`;
    }
    
    if (lowercaseMessage.includes('how are you')) {
      return `I'm doing well, thank you for asking! As your ${agent} assistant, I'm ready to help with your business needs.`;
    }
    
    if (lowercaseMessage === 'why') {
      return `I understand you're asking why there might be an issue. Currently, our connection to the AI service is experiencing temporary difficulties. This could be due to high demand or scheduled maintenance. Please try again in a few moments.`;
    }
    
    // Generic fallback based on detected intent
    if (lowercaseMessage.includes('help') || lowercaseMessage.includes('can you')) {
      return `I'd be happy to help you with that. However, I'm currently operating in fallback mode due to a temporary service limitation. Please try again in a few minutes when our AI service connection is restored.`;
    }
    
    // Default fallback response
    return `I apologize, but I'm currently experiencing connection issues with our AI service. This is likely a temporary problem due to high demand or scheduled maintenance. Please try again in a few minutes, or contact support if the issue persists.`;
  }
} 