import axios from 'axios';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type MistralConfig = {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
};

export class MistralService {
  private apiKey: string;
  private apiUrl: string;
  private config: Omit<MistralConfig, 'apiKey'>;

  constructor(config: MistralConfig) {
    this.apiKey = config.apiKey || process.env.MISTRAL_API_KEY || '';
    this.apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    this.config = {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    };
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Mistral API key is not configured');
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: unknown): void {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error?.message || error.message;
      
      console.error(`Mistral API Error (${statusCode}): ${errorMessage}`);
      
      if (statusCode === 401) {
        throw new Error('Authentication failed. Please check your Mistral API key');
      } else if (statusCode === 429) {
        throw new Error('Rate limit exceeded. Please try again later');
      }
    } else {
      console.error('Unexpected error when calling Mistral API:', error);
    }
  }
} 