import { PhiAIService } from '@/services/PhiAIService';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';

// Get Phi-4 AI model instance
function getChatModel() {
  const apiKey = process.env.HUGGINGFACE_API_KEY || '';
  
  // Debug: Check if API key is loaded correctly (mask most of it for security)
  const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'not set';
  console.log(`Using Hugging Face API key: ${maskedKey}`);
  
  if (!apiKey) {
    console.error('HUGGINGFACE_API_KEY is not set in environment variables');
  }
  
  // Create and return PhiAIService instance
  return new PhiAIService(apiKey);
}

// Create a conversation chain with the given history
export function createConversationChain(conversationHistory: BaseMessage[]) {
  const phiService = getChatModel();
  
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
  
  // Create the prompt template with enhanced domain knowledge
  const promptTemplate = PromptTemplate.fromTemplate(`
    You are Tzironis AI, a sophisticated business intelligence assistant for the Tzironis Business Suite.
    
    PERSONA INFORMATION:
    - You are knowledgeable about business strategy, analytics, technical solutions, and AI implementation
    - You provide concise yet comprehensive answers
    - You maintain a professional, confident tone while being approachable
    - You prioritize actionable insights over general information
    
    DOMAIN EXPERTISE:
    - Business process automation and optimization
    - Financial planning and analysis
    - Digital transformation strategies
    - Modern software architecture and development practices
    - Data analytics and business intelligence
    - AI implementation in enterprise environments
    - Market analysis and competitive intelligence
    
    USER PREFERENCES:
    - If the user has selected PABLOS, focus on business strategy, market analysis, growth opportunities, and financial planning
    - If the user has selected GIORGOS, focus on technical implementations, coding solutions, system architecture, and IT infrastructure
    - If the user has selected ACHILLIES, focus on data analytics, metrics, KPIs, performance insights, and business intelligence
    - If the user has selected FAWZI, focus on AI implementation, machine learning solutions, automation, and digital transformation
    
    RESPONSE GUIDELINES:
    - Begin responses with direct answers before elaborating
    - Use bullet points for lists and steps
    - Provide specific examples when applicable
    - Mention relevant tools or methodologies when appropriate
    - End with a follow-up prompt or suggestion when helpful
    - For technical topics, provide implementation details and best practices
    - For business topics, offer strategic frameworks and actionable insights
    - For analytical topics, suggest relevant metrics and visualization approaches
    
    Current conversation:
    {chatHistory}
    
    User: {userInput}
    AI Assistant:
  `);
  
  // Create a function that uses PhiAIService to generate responses
  const generatePhiResponse = async (input: { chatHistory: BaseMessage[]; userInput: string }) => {
    try {
      const response = await phiService.generateResponse(
        input.userInput, 
        input.chatHistory,
        extractAgentFromHistory(input.chatHistory)
      );
      return response;
    } catch (error) {
      console.error('Error generating Phi response:', error);
      throw error;
    }
  };
  
  // Create the runnable chain
  const chain = RunnableSequence.from([
    {
      chatHistory: (input: { chatHistory: BaseMessage[]; userInput: string }) => input.chatHistory,
      userInput: (input: { chatHistory: BaseMessage[]; userInput: string }) => input.userInput
    },
    generatePhiResponse,
    new StringOutputParser()
  ]);
  
  return { chain, callbacks: tracers };
}

// Extract agent name from conversation history
function extractAgentFromHistory(history: BaseMessage[]): string {
  if (history.length > 0) {
    const firstMessage = history[0].content as string;
    if (firstMessage.includes("I'm ")) {
      const agentName = firstMessage.split("I'm ")[1]?.split(".")[0]?.trim();
      if (agentName) {
        return agentName;
      }
    }
  }
  return 'Tzironis';
}

// Process the conversation and return the AI response
export async function processConversation(userMessage: string, conversationHistory: BaseMessage[]) {
  try {
    // Check if API key is present
    const apiKey = process.env.HUGGINGFACE_API_KEY || '';
    
    if (!apiKey || apiKey.trim() === '') {
      console.error('Missing Hugging Face API key. Please set a valid API key in your environment variables.');
      return 'I apologize, but I cannot process your request at the moment due to a configuration issue. Please contact the administrator to set up the AI service properly.';
    }
    
    // Create the conversation chain
    const conversationChain = createConversationChain(conversationHistory);
    
    if (!conversationChain) {
      throw new Error('Failed to create conversation chain');
    }
    
    const { chain, callbacks } = conversationChain;
    
    // Add timeout protection - reducing to 8 seconds for Vercel compatibility
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('API call timed out')), 8000);
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
      console.error('API call failed:', error);
      // Provide a more helpful error message based on the error type
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          return 'I apologize for the delay. Our systems are currently busy processing your complex request. Please try asking a more specific question or try again in a moment.';
        } else if (error.message.includes('401') || error.message.includes('authentication')) {
          return 'I apologize, but there seems to be an authentication issue with our AI service. Please contact the administrator to verify the API key configuration.';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          return 'I apologize, but we\'ve reached our usage limit for the AI service. Please try again in a few minutes when our quota resets.';
        }
      }
      
      return 'I apologize, but I encountered an unexpected error processing your request. Please try again or contact support if the issue persists.';
    }
  } catch (error) {
    console.error('Error processing conversation:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.';
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