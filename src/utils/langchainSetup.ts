import { ChatMistralAI } from '@langchain/mistralai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';

// Get Mistral AI configuration
function getChatModel() {
  const apiKey = process.env.MISTRAL_API_KEY || '';
  
  // Always create and return the model with the API key
  return new ChatMistralAI({
    apiKey: apiKey,
    modelName: 'mistral-small-latest', // Free tier model
    temperature: 0.7,
    maxTokens: 1024,
  });
}

// Create a conversation chain with the given history
export function createConversationChain(conversationHistory: BaseMessage[]) {
  const model = getChatModel();
  
  // Create tracers for monitoring
  const tracers = [];
  
  if (process.env.LANGCHAIN_API_KEY) {
    tracers.push(new LangChainTracer());
  }
  
  tracers.push(new ConsoleCallbackHandler());
  
  // Log for debugging purposes
  if (conversationHistory.length > 0) {
    console.log(`Processing conversation with ${conversationHistory.length} messages`);
  }
  
  // Create the prompt template
  const promptTemplate = PromptTemplate.fromTemplate(`
    You are Tzironis AI, a highly intelligent assistant for the Tzironis Business Suite.
    You provide detailed, accurate, and helpful responses. You have a friendly personality
    and aim to provide the best possible assistance to users.
    
    Current conversation:
    {chatHistory}
    
    User: {userInput}
    AI Assistant:
  `);
  
  // Create the runnable chain
  const chain = RunnableSequence.from([
    {
      chatHistory: (input: { chatHistory: BaseMessage[]; userInput: string }) => 
        input.chatHistory.map(message => 
          `${message._getType()}: ${message.content}`
        ).join("\n"),
      userInput: (input: { chatHistory: BaseMessage[]; userInput: string }) => 
        input.userInput
    },
    promptTemplate,
    model,
    new StringOutputParser()
  ]);
  
  return { chain, callbacks: tracers };
}

// Process the conversation and return the AI response
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function processConversation(userMessage: string, conversationHistory: BaseMessage[], agent?: string) {
/* eslint-enable @typescript-eslint/no-unused-vars */
  try {
    // Create the conversation chain - we don't need to store the model separately
    const conversationChain = createConversationChain(conversationHistory);
    
    if (!conversationChain) {
      throw new Error('Failed to create conversation chain');
    }
    
    const { chain, callbacks } = conversationChain;
    
    // Add timeout protection
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('API call timed out')), 15000);
    });
    
    // Race between the API call and the timeout
    const response = await Promise.race([
      chain.invoke({
        chatHistory: conversationHistory,
        userInput: userMessage
      }, { callbacks }),
      timeoutPromise
    ]) as string;
    
    return response || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Error processing conversation:', error);
    return 'I apologize for the inconvenience. There was an error processing your request. Please try again.';
  }
} 