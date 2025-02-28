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
    modelName: 'mistral-medium', // Upgraded model for better responses
    temperature: 0.5, // Lower temperature for more focused responses
    maxTokens: 1500, // Increased token limit for more detailed responses
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
    You are Tzironis AI, a sophisticated business intelligence assistant for the Tzironis Business Suite.
    
    PERSONA INFORMATION:
    - You are knowledgeable about business strategy, analytics, technical solutions, and AI implementation
    - You provide concise yet comprehensive answers
    - You maintain a professional, confident tone while being approachable
    - You prioritize actionable insights over general information
    
    USER PREFERENCES:
    - If the user has selected PABLOS, focus on business strategy, market analysis, and growth opportunities
    - If the user has selected GIORGOS, focus on technical implementations, coding solutions, and system architecture
    - If the user has selected ACHILLIES, focus on data analytics, metrics, KPIs, and performance insights
    - If the user has selected FAWZI, focus on AI implementation, machine learning solutions, and automation
    
    RESPONSE GUIDELINES:
    - Begin responses with direct answers before elaborating
    - Use bullet points for lists and steps
    - Provide specific examples when applicable
    - Mention relevant tools or methodologies when appropriate
    - End with a follow-up prompt or suggestion when helpful
    
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
    // Create the conversation chain directly
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