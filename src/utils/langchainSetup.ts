import { ChatMistralAI } from '@langchain/mistralai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';

// Get Mistral AI configuration
function getChatModel() {
  const apiKey = process.env.MISTRAL_API_KEY || '';
  
  if (!apiKey || apiKey === 'demo') {
    console.log('No Mistral API key found, using demo mode');
    return null;
  }
  
  // Using Mistral's small model for free tier users
  return new ChatMistralAI({
    apiKey: apiKey,
    modelName: 'mistral-small-latest', // Free tier model
    temperature: 0.7,
    maxTokens: 1024,
    timeout: 30000,  // 30 second timeout
  });
}

// Create a conversation chain with the given history
export function createConversationChain(history: BaseMessage[]) {
  const model = getChatModel();
  
  if (!model) {
    // Return null to indicate demo mode
    return null;
  }
  
  // Create tracers for monitoring
  const tracers = [];
  
  if (process.env.LANGCHAIN_API_KEY) {
    tracers.push(new LangChainTracer());
  }
  
  tracers.push(new ConsoleCallbackHandler());
  
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
export async function processConversation(userMessage: string, conversationHistory: BaseMessage[]) {
  try {
    // Create the user message for potential later use
    const userMsg = new HumanMessage(userMessage);
    
    // Use demo mode responses immediately if no API key or for quick fallback
    const demoResponse = getDemoResponse(userMessage);
    
    // Get the conversation model
    const model = getChatModel();
    
    // If no model available or in demo mode, return demo response
    if (!model) {
      return demoResponse;
    }
    
    try {
      // Create the conversation chain
      const { chain, callbacks } = createConversationChain(conversationHistory);
      
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
      
      return response || demoResponse;
    } catch (error) {
      console.error('Error with Mistral API call:', error);
      // Fall back to demo response on error
      return demoResponse;
    }
  } catch (error) {
    console.error('Error processing conversation:', error);
    return 'Sorry, there was an error processing your request. Please try again.';
  }
}

// Helper function to get demo responses
function getDemoResponse(userMessage: string): string {
  // Simple logic for demo responses
  const message = userMessage.toLowerCase();
  
  if (message.includes('hello') || message.includes('hi')) {
    return 'Hello! I\'m your intelligent Tzironis Business Suite assistant. How can I help you today?';
  } else if (message.includes('thank')) {
    return "You're welcome! I'm always here to assist with the Tzironis Business Suite.";
  } else if (message.includes('help')) {
    return 'I can help you with a wide range of tasks in the Tzironis Business Suite, including business analytics, workflow automation, data processing, and more. What specific area would you like assistance with?';
  } else if (message.includes('intelligent') || message.includes('smart')) {
    return "To make me more intelligent, you'll need to add your Mistral AI API key to the .env.local file. Mistral offers a free tier with surprisingly smart AI models!";
  } else {
    return "I'm currently in demo mode. To unlock my full capabilities, please add your Mistral AI API key to the .env.local file. Mistral offers a free tier that provides high-quality AI responses without any cost.";
  }
} 