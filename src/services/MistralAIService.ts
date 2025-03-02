import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import { ChatMistralAI } from '@langchain/mistralai';

interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export class MistralAIService {
  private client: ChatMistralAI;
  private tools: Tool[] = [];
  
  constructor(apiKey?: string) {
    if (!apiKey) {
      console.error('No API key provided for Mistral AI');
      throw new Error('Missing API key for Mistral authentication');
    }
    
    // Log masked API key for debugging
    const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'not set';
    console.log(`Initializing Mistral AI client with API key: ${maskedKey}`);
    
    this.client = new ChatMistralAI({
      apiKey: apiKey,
      modelName: "mistral-large-latest",
      temperature: 0.7,
      maxTokens: 800,
    });
  }
  
  /**
   * Register tools that the model can use
   */
  registerTools(tools: Tool[]) {
    this.tools = tools;
    return this;
  }
  
  /**
   * Generates a response using Mistral AI with tool calling capabilities
   */
  async generateResponse(
    userMessage: string,
    history: BaseMessage[],
    agent: string = 'Tzironis'
  ): Promise<string> {
    try {
      // Format conversation history for Mistral
      const formattedMessages = this.formatMessages(userMessage, history, agent);
      
      // Make the API call with tool definitions if available
      const options = this.tools.length > 0 ? { 
        tools: this.tools,
        toolChoice: "auto"
      } : {};
      
      console.log(`Sending request to Mistral AI with agent: ${agent}`);
      
      const response = await this.client.invoke(formattedMessages, options);
      
      // Check if the model wants to call a tool
      if (response.additional_kwargs?.tool_calls) {
        const toolCalls = response.additional_kwargs.tool_calls;
        console.log('Tool call detected:', JSON.stringify(toolCalls));
        
        // Here we would implement the actual tool execution logic
        return `I'd like to help you with this task. I can use my automation capabilities to assist with this.`;
      }
      
      return response.content as string;
    } catch (error) {
      console.error('MistralAIService error:', error);
      
      // Provide meaningful error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('auth')) {
          console.error('Authentication error with Mistral AI - check your API key');
        } else if (error.message.includes('429') || error.message.includes('rate')) {
          console.error('Rate limit reached with Mistral AI');
        } else if (error.message.includes('500')) {
          console.error('Mistral AI service error');
        } else if (error.message.includes('timeout')) {
          console.error('Request to Mistral AI timed out');
        }
      }
      
      return this.generateFallbackResponse(userMessage, agent);
    }
  }

  /**
   * Generate a streaming response from Mistral AI
   */
  async generateStreamingResponse(
    userMessage: string,
    history: BaseMessage[],
    callbacks: StreamCallbacks,
    agent: string = 'Tzironis'
  ): Promise<void> {
    try {
      // Format conversation history for Mistral
      const formattedMessages = this.formatMessages(userMessage, history, agent);
      
      // Make the API call with streaming enabled
      const options = this.tools.length > 0 ? { 
        tools: this.tools,
        toolChoice: "auto"
      } : {};
      
      console.log(`Sending streaming request to Mistral AI with agent: ${agent}`);
      
      let fullResponse = '';
      
      // Use streaming API
      const stream = await this.client.stream(formattedMessages, options);
      
      // Process each chunk as it arrives
      for await (const chunk of stream) {
        if (chunk.content) {
          fullResponse += chunk.content;
          callbacks.onToken(chunk.content);
        }
      }
      
      // Signal completion with the full response
      callbacks.onComplete(fullResponse);
    } catch (error) {
      console.error('MistralAIService streaming error:', error);
      callbacks.onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  }
  
  /**
   * Formats the messages for the Mistral model
   */
  private formatMessages(
    userMessage: string,
    history: BaseMessage[],
    agent: string
  ): BaseMessage[] {
    try {
      const messages: BaseMessage[] = [];
      
      // Add system message
      messages.push(new SystemMessage(this.createSystemMessage(agent)));
      
      // Add conversation history
      if (Array.isArray(history)) {
        // Simply pass through valid LangChain message objects
        for (const message of history) {
          if (message instanceof HumanMessage || message instanceof AIMessage || message instanceof SystemMessage) {
            messages.push(message);
          } else if (typeof message.content === 'string') {
            // Try to determine the type from the _getType method if available
            if (typeof message._getType === 'function') {
              const type = message._getType();
              if (type === 'human') {
                messages.push(new HumanMessage(message.content));
              } else if (type === 'ai') {
                messages.push(new AIMessage(message.content));
              } else if (type === 'system') {
                messages.push(new SystemMessage(message.content));
              }
            } else {
              // If we can't determine the type, default to AI message
              console.warn('Unknown message type, defaulting to AIMessage');
              messages.push(new AIMessage(message.content));
            }
          }
        }
      }
      
      // Add current user message
      messages.push(new HumanMessage(userMessage));
      
      return messages;
    } catch (error) {
      console.error('Error formatting messages:', error);
      // Provide a minimal valid message set in case of errors
      return [
        new SystemMessage(this.createSystemMessage(agent)),
        new HumanMessage(userMessage)
      ];
    }
  }
  
  /**
   * Creates a system message based on the agent type
   */
  private createSystemMessage(agent: string): string {
    const basePrompt = `You are the Tzironis Business Suite AI Assistant named ${agent}. You are helpful, concise, and provide accurate information. You are powered by Mistral AI.`;
    
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
        return `${basePrompt} You excel at understanding user needs and providing practical solutions for business automation and productivity. You can help with complex tasks like web scraping, data analysis, and integration with business systems.`;
    }
  }
  
  /**
   * Generates a fallback response when the API is unavailable
   */
  private generateFallbackResponse(userMessage: string, agent: string): string {
    return `I apologize, but I'm currently experiencing connection issues with the Mistral AI service. This is likely a temporary problem. Please try again in a few minutes, or contact support if the issue persists.`;
  }
} 