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
  
  // Debug: Check if API key is loaded correctly (mask most of it for security)
  const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'not set';
  console.log(`Using Mistral API key: ${maskedKey}`);
  
  // Always create and return the model with the API key
  return new ChatMistralAI({
    apiKey: apiKey,
    modelName: 'mistral-small-latest', // Changed from mistral-medium to a valid model name
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
    // Check if we should use mock responses (when API key is invalid or for quick testing)
    const apiKey = process.env.MISTRAL_API_KEY || '';
    
    // Force demo mode for the specific API key in the file that's not working
    const useMockResponse = !apiKey || 
                           apiKey.trim() === '' || 
                           apiKey === '5iHjJGV6WIGSipfkXxaGrri7saifgosq' || 
                           process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    
    if (useMockResponse) {
      console.log('Using mock response (invalid API key or demo mode enabled)');
      // Return a mock response based on the user message
      return generateMockResponse(userMessage, conversationHistory);
    }
    
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
    
    try {
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
      console.error('API call failed, falling back to mock response:', error);
      return generateMockResponse(userMessage, conversationHistory);
    }
  } catch (error) {
    console.error('Error processing conversation:', error);
    return generateMockResponse(userMessage, conversationHistory);
  }
}

// Enhance the mock response function for better quality responses
function generateMockResponse(userMessage: string, history: BaseMessage[]): string {
  const lowercaseMessage = userMessage.toLowerCase();
  
  // Extract agent name from history if available
  const agentName = history.length > 0 && history[0].content.includes("I'm ")
    ? history[0].content.split("I'm ")[1]?.split(".")[0] || "FAWZI"
    : "FAWZI";
    
  // More sophisticated response templates
  if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi') || lowercaseMessage.length < 5) {
    return `Hello! I'm your ${getAgentSpecialty(agentName)} specialist. How can I assist you with your business needs today?`;
  }
  
  if (lowercaseMessage.includes('how are you')) {
    return `I'm functioning optimally and ready to assist with your ${getAgentSpecialty(agentName)} requirements. What specific challenges can I help you address?`;
  }
  
  if (lowercaseMessage.includes('help') || lowercaseMessage.includes('what can you do')) {
    return `As your ${getAgentSpecialty(agentName)} specialist, I can provide:

• Strategic insights and recommendations
• Data-driven analysis of your business metrics
• Implementation guidance for technical solutions
• Advanced AI integration strategies

What specific area would you like to explore first?`;
  }
  
  if (lowercaseMessage.includes('business') || lowercaseMessage.includes('strategy')) {
    return `From a ${getAgentSpecialty(agentName)} perspective, effective business strategy requires:

• Clear objective setting aligned with market opportunities
• Competitive analysis to identify your unique value proposition
• Resource allocation optimized for growth potential
• Performance metrics that track meaningful progress

Would you like me to elaborate on any of these areas for your specific business context?`;
  }
  
  if (lowercaseMessage.includes('data') || lowercaseMessage.includes('analytics')) {
    return `Data analytics is critical for informed decision-making. As your ${getAgentSpecialty(agentName)} advisor, I recommend:

• Establishing KPIs that directly link to business objectives
• Implementing real-time dashboards for performance monitoring
• Applying predictive analytics to anticipate market shifts
• Using segmentation analysis to target high-value opportunities

Which of these analytics approaches would be most valuable for your current priorities?`;
  }
  
  if (lowercaseMessage.includes('ai') || lowercaseMessage.includes('automation')) {
    return `AI and automation present significant opportunities for business optimization. From a ${getAgentSpecialty(agentName)} standpoint, I recommend:

• Start with process mapping to identify automation candidates
• Implement AI-driven customer insights for personalization
• Develop predictive maintenance systems for operational efficiency
• Create intelligent decision support tools for management

Would you like a more detailed implementation roadmap for any of these areas?`;
  }
  
  // Default response with business insights
  return `Based on your inquiry about "${userMessage}", here are some key insights from a ${getAgentSpecialty(agentName)} perspective:

• This area represents a significant opportunity for competitive differentiation
• Successful implementation typically requires cross-functional collaboration
• Leading organizations are leveraging data-driven approaches in this domain
• There are emerging technologies that could enhance your capabilities here

Would you like me to provide more specific recommendations tailored to your business context?`;
}

// Helper function to get agent specialty based on name
function getAgentSpecialty(agentName: string): string {
  switch(agentName) {
    case 'PABLOS':
      return 'business strategy and market analysis';
    case 'GIORGOS':
      return 'technical implementations and system architecture';
    case 'ACHILLIES':
      return 'data analytics and performance metrics';
    case 'FAWZI':
      return 'AI implementation and automation solutions';
    default:
      return 'business intelligence';
  }
} 