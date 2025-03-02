import { MistralAIService } from '@/services/MistralAIService';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';

// Define web scraping tool
const webScrapingTool = {
  name: "web_scraper",
  description: "Scrape data from a specified URL",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to scrape data from"
      },
      selector: {
        type: "string",
        description: "CSS selector to find specific elements (optional)"
      }
    },
    required: ["url"]
  }
};

// Define invoice generation tool
const invoiceGenerationTool = {
  name: "generate_invoice",
  description: "Generate an invoice for a specified client",
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "The ID of the client"
      },
      items: {
        type: "array",
        description: "List of items for the invoice",
        items: {
          type: "object",
          properties: {
            product_id: { type: "string" },
            quantity: { type: "number" },
            price: { type: "number" }
          }
        }
      },
      date: {
        type: "string",
        description: "Invoice date (YYYY-MM-DD)"
      }
    },
    required: ["client_id", "items"]
  }
};

// Define tzironis.gr API tool
const tzironisApiTool = {
  name: "tzironis_api",
  description: "Interact with the Tzironis.gr API",
  parameters: {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        description: "API endpoint to call (clients, products, suppliers)",
        enum: ["clients", "products", "suppliers", "invoices"]
      },
      action: {
        type: "string",
        description: "Action to perform",
        enum: ["get", "list", "create", "update", "delete"]
      },
      data: {
        type: "object",
        description: "Data for the API call"
      }
    },
    required: ["endpoint", "action"]
  }
};

// Get Mistral AI model instance
function getChatModel() {
  const apiKey = process.env.MISTRAL_API_KEY || '';
  
  // Debug: Check if API key is loaded correctly (mask most of it for security)
  const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'not set';
  console.log(`Using Mistral AI API key: ${maskedKey}`);
  
  if (!apiKey) {
    console.error('MISTRAL_API_KEY is not set in environment variables');
    throw new Error('Missing Mistral API key');
  }
  
  // Create MistralAIService instance with tools
  return new MistralAIService(apiKey)
    .registerTools([
      webScrapingTool,
      invoiceGenerationTool,
      tzironisApiTool
    ]);
}

// Create a conversation chain with the given history
export function createConversationChain(conversationHistory: BaseMessage[]) {
  const mistralService = getChatModel();
  
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
  
  // Create a function that uses MistralAIService to generate responses
  const generateMistralResponse = async (input: { chatHistory: BaseMessage[]; userInput: string }) => {
    try {
      console.log('Input to generateMistralResponse:', {
        userInput: input.userInput,
        historyLength: input.chatHistory?.length || 0
      });
      
      // Validate and sanitize chat history
      let validHistory: BaseMessage[] = [];
      
      if (Array.isArray(input.chatHistory)) {
        // Only include valid message objects
        validHistory = input.chatHistory.filter(msg => 
          msg instanceof HumanMessage || 
          msg instanceof AIMessage || 
          msg instanceof SystemMessage ||
          (typeof msg._getType === 'function' && ['human', 'ai', 'system'].includes(msg._getType()))
        );
      }
      
      const agent = extractAgentFromHistory(input.chatHistory);
      console.log(`Using agent: ${agent} for response generation`);
      
      const response = await mistralService.generateResponse(
        input.userInput, 
        validHistory,
        agent
      );
      return response;
    } catch (error) {
      console.error('Error generating Mistral response:', error);
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`);
        if (error.stack) {
          console.error(`Stack trace: ${error.stack}`);
        }
      }
      
      // Return a graceful fallback message
      return "I apologize, but I'm having trouble connecting to my knowledge system right now. This is likely temporary - please try again in a moment.";
    }
  };
  
  // Create the runnable chain
  const chain = RunnableSequence.from([
    {
      chatHistory: (input: { chatHistory: BaseMessage[]; userInput: string }) => input.chatHistory,
      userInput: (input: { chatHistory: BaseMessage[]; userInput: string }) => input.userInput
    },
    generateMistralResponse,
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
export async function processConversation(
  userMessage: string, 
  conversationHistory: BaseMessage[],
  agent?: string
) {
  try {
    // Check if API key is present
    const apiKey = process.env.MISTRAL_API_KEY || '';
    
    if (!apiKey || apiKey.trim() === '') {
      console.error('Missing Mistral API key. Please set a valid API key in your environment variables.');
      return 'I apologize, but I cannot process your request at the moment due to a configuration issue. Please contact the administrator to set up the AI service properly.';
    }
    
    // Create the conversation chain
    const conversationChain = createConversationChain(conversationHistory);
    
    if (!conversationChain) {
      throw new Error('Failed to create conversation chain');
    }
    
    const { chain, callbacks } = conversationChain;
    
    // Add timeout protection - reduced for Vercel compatibility
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('API call timed out')), 25000); // Increased timeout to handle tool calls
    });
    
    try {
      // Race between the API call and the timeout
      const response = await Promise.race([
        chain.invoke({
          chatHistory: conversationHistory,
          userInput: userMessage,
          agent: agent || extractAgentFromHistory(conversationHistory)
        }, { callbacks }),
        timeoutPromise
      ]) as string;
      
      // Check if response contains a tool call marker
      if (response.includes('I need to use a tool:')) {
        console.log('Tool call detected in response');
        return await handleToolCall(response, userMessage, conversationHistory, agent);
      }
      
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

// Handle tool calls from the Mistral response
async function handleToolCall(
  response: string,
  userMessage: string,
  conversationHistory: BaseMessage[],
  agent?: string
): Promise<string> {
  try {
    console.log('Processing tool call');
    
    // Extract the tool call information
    const toolNameMatch = response.match(/I need to use a tool: ([a-z_]+)/i);
    if (!toolNameMatch || !toolNameMatch[1]) {
      console.error('Could not parse tool name from response');
      return 'I tried to use a tool to help answer your question, but encountered an error.';
    }
    
    const toolName = toolNameMatch[1];
    console.log(`Tool requested: ${toolName}`);
    
    // Extract parameters from response
    let params: Record<string, any> = {};
    try {
      const paramsMatch = response.match(/Parameters: ({.+})$/ms);
      if (paramsMatch && paramsMatch[1]) {
        params = JSON.parse(paramsMatch[1]);
      }
    } catch (e) {
      console.error('Error parsing tool parameters:', e);
    }
    
    let toolResult = '';
    
    // Execute the appropriate tool
    switch(toolName) {
      case 'web_scraper':
        toolResult = await executeWebScraper(params);
        break;
      case 'generate_invoice':
        toolResult = await executeInvoiceGenerator(params);
        break;
      case 'tzironis_api':
        toolResult = await executeTzironisApi(params);
        break;
      default:
        toolResult = `The tool '${toolName}' is not implemented yet.`;
    }
    
    // Add the tool call and result to conversation history
    const updatedHistory = [
      ...conversationHistory,
      new HumanMessage(userMessage),
      new AIMessage(`I need to use the ${toolName} tool.`),
      new SystemMessage(`Tool ${toolName} returned: ${toolResult}`)
    ];
    
    // Get a new response with the tool output included
    const mistralService = getChatModel();
    const finalResponse = await mistralService.generateResponse(
      `Based on the results from the ${toolName} tool, please provide a complete answer to my question: "${userMessage}"`,
      updatedHistory,
      agent || 'Tzironis'
    );
    
    return finalResponse;
  } catch (error) {
    console.error('Error handling tool call:', error);
    return 'I tried to use a tool to help answer your question, but encountered an error. Let me try to answer without it.';
  }
}

// Implement the web scraper tool
async function executeWebScraper(params: { url: string, selector?: string }): Promise<string> {
  try {
    console.log(`WebScraper called with URL: ${params.url}`);
    
    // Here you would implement actual web scraping
    // For now, return a placeholder
    
    return `Sample data scraped from ${params.url}. This is a simulated response as the actual scraping functionality would require server-side implementation or a browser extension.`;
  } catch (error) {
    console.error('Web scraper error:', error);
    return `Error scraping data: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Implement the invoice generation tool
async function executeInvoiceGenerator(params: { client_id: string, items: any[], date?: string }): Promise<string> {
  try {
    console.log(`Invoice generator called for client: ${params.client_id}`);
    
    // Here you would implement actual invoice generation
    // For now, return a placeholder
    
    const itemCount = params.items?.length || 0;
    const date = params.date || new Date().toISOString().split('T')[0];
    
    return `Generated invoice for client ${params.client_id} with ${itemCount} items on ${date}. Invoice ID: INV-${Date.now().toString(36).toUpperCase()}`;
  } catch (error) {
    console.error('Invoice generator error:', error);
    return `Error generating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Implement the Tzironis API tool
async function executeTzironisApi(params: { endpoint: string, action: string, data?: any }): Promise<string> {
  try {
    console.log(`Tzironis API called: ${params.endpoint}/${params.action}`);
    
    // Here you would implement actual API calls
    // For now, return a placeholder
    
    const endpoints = {
      clients: ["Client1", "Client2", "TechCorp", "GlobalSolutions"],
      products: ["Product A", "Service B", "Enterprise Plan", "Support Package"],
      suppliers: ["Supplier X", "Manufacturer Y", "Warehouse Z"],
      invoices: ["INV-001", "INV-002", "INV-003"]
    };
    
    const endpointData = endpoints[params.endpoint as keyof typeof endpoints] || [];
    
    switch(params.action) {
      case 'list':
        return `Retrieved ${endpointData.length} items from ${params.endpoint}: ${endpointData.join(', ')}`;
      case 'get':
        return `Retrieved details for ${params.endpoint} item: ${endpointData[0]}`;
      case 'create':
        return `Created new ${params.endpoint} item with ID: ${Date.now().toString(36).toUpperCase()}`;
      case 'update':
        return `Updated ${params.endpoint} item successfully`;
      case 'delete':
        return `Deleted ${params.endpoint} item successfully`;
      default:
        return `Unknown action: ${params.action}`;
    }
  } catch (error) {
    console.error('Tzironis API error:', error);
    return `Error calling Tzironis API: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
} 