import { NextRequest, NextResponse } from 'next/server';
import { WebScraper, ScrapedLead } from '@/utils/webScraper';
import { UnionAutomation } from '@/utils/seleniumAutomation';
import { TzironisKnowledgeBase } from '@/utils/knowledgeBase';

// Initialize knowledge base
let knowledgeBase: TzironisKnowledgeBase | null = null;

// Define interfaces for API parameters
interface AutomationParams {
  operation: string;
  params: LeadScrapingParams | InvoiceCreationParams | KnowledgeBaseParams | SearchParams;
}

interface LeadScrapingParams {
  url?: string;
  searchQuery?: string;
  options?: {
    pages?: number;
    [key: string]: unknown;
  };
}

interface InvoiceCreationParams {
  credentials: {
    username: string;
    password: string;
  };
  invoiceDetails: {
    clientName: string;
    invoiceNumber: string;
    [key: string]: unknown;
  };
}

interface KnowledgeBaseParams {
  options?: {
    sources?: string[];
    [key: string]: unknown;
  };
}

interface SearchParams {
  query: string;
  limit?: number;
}

interface ScrapingSelectors {
  container: string;
  name: string;
  contact: string;
  website: string;
  [key: string]: string;
}

/**
 * Web scraping operation endpoints
 */
export async function POST(request: NextRequest) {
  try {
    const { operation, params } = await request.json() as AutomationParams;
    
    switch (operation) {
      case 'scrapeLead':
        return await handleLeadScraping(params as LeadScrapingParams);
        
      case 'createInvoice':
        return await handleInvoiceCreation(params as InvoiceCreationParams);
        
      case 'buildKnowledgeBase':
        return await handleKnowledgeBaseBuilding(params as KnowledgeBaseParams);
        
      case 'searchKnowledgeBase':
        return await handleKnowledgeBaseSearch(params as SearchParams);
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in automations API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}

/**
 * Handles lead scraping requests
 */
async function handleLeadScraping(params: LeadScrapingParams) {
  try {
    const { url, searchQuery, options } = params;
    
    if (!url && !searchQuery) {
      return NextResponse.json(
        { error: 'Either url or searchQuery is required' }, 
        { status: 400 }
      );
    }
    
    const scraper = new WebScraper(options);
    let results: ScrapedLead[] = [];
    
    if (url) {
      // Determine the appropriate selectors based on the URL
      const selectors = determineScrapingSelectors(url);
      results = await scraper.scrapeBusinessDirectory(url, selectors);
    } else if (searchQuery) {
      // Use Google search scraping
      results = await scraper.scrapeGoogleBusinessResults(searchQuery, options?.pages || 1);
    }
    
    return NextResponse.json({ success: true, leads: results });
  } catch (error) {
    console.error('Lead scraping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Lead scraping failed';
    return NextResponse.json(
      { error: `Lead scraping failed: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}

/**
 * Determines the appropriate selectors for scraping based on the URL
 */
function determineScrapingSelectors(url: string): ScrapingSelectors {
  // Default selectors
  const defaultSelectors: ScrapingSelectors = {
    container: '.business-item',
    name: '.business-name',
    contact: '.contact-info',
    website: '.website-link'
  };
  
  // Apply site-specific selectors if available
  if (url.includes('xo.gr')) {
    return {
      container: '.biz-list-item',
      name: '.name a',
      contact: '.contact',
      website: '.website a'
    };
  } else if (url.includes('vres.gr')) {
    return {
      container: '.list-item',
      name: '.title',
      contact: '.phone',
      website: '.www a'
    };
  } else if (url.includes('11880.gr')) {
    return {
      container: '.business-card',
      name: '.business-name',
      contact: '.contact-details',
      website: '.website-url'
    };
  }
  
  return defaultSelectors;
}

/**
 * Handles invoice creation requests
 */
async function handleInvoiceCreation(params: InvoiceCreationParams) {
  try {
    const { credentials, invoiceDetails } = params;
    
    if (!credentials || !invoiceDetails) {
      return NextResponse.json(
        { error: 'Both credentials and invoiceDetails are required' }, 
        { status: 400 }
      );
    }
    
    const automation = new UnionAutomation(false); // Set to true for headless mode
    
    try {
      await automation.initialize();
      
      const loggedIn = await automation.login(credentials);
      if (!loggedIn) {
        return NextResponse.json(
          { error: 'Failed to log in to Union.gr' }, 
          { status: 401 }
        );
      }
      
      const invoiceCreated = await automation.createInvoice(invoiceDetails);
      if (!invoiceCreated) {
        return NextResponse.json(
          { error: 'Failed to create invoice' }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Invoice created successfully' 
      });
    } finally {
      await automation.close();
    }
  } catch (error) {
    console.error('Invoice creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Invoice creation failed';
    return NextResponse.json(
      { error: `Invoice creation failed: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}

/**
 * Handles knowledge base building requests
 */
async function handleKnowledgeBaseBuilding(params: KnowledgeBaseParams) {
  try {
    const { options } = params || {};
    
    // Create knowledge base if not exists
    if (!knowledgeBase) {
      knowledgeBase = new TzironisKnowledgeBase();
    }
    
    // Build knowledge base
    await knowledgeBase.buildKnowledgeBase(options);
    
    // Get stats on entries
    const entries = knowledgeBase.getEntries();
    const products = knowledgeBase.getProducts();
    const clients = knowledgeBase.getClients();
    const suppliers = knowledgeBase.getSuppliers();
    
    return NextResponse.json({ 
      success: true, 
      stats: {
        totalEntries: entries.length,
        productCount: products.length,
        clientCount: clients.length,
        supplierCount: suppliers.length
      }
    });
  } catch (error) {
    console.error('Knowledge base building error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Knowledge base building failed';
    return NextResponse.json(
      { error: `Knowledge base building failed: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}

/**
 * Handles knowledge base search requests
 */
async function handleKnowledgeBaseSearch(params: SearchParams) {
  try {
    const { query, limit } = params || {};
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' }, 
        { status: 400 }
      );
    }
    
    if (!knowledgeBase || knowledgeBase.getEntries().length === 0) {
      return NextResponse.json(
        { error: 'Knowledge base is not built. Call buildKnowledgeBase first.' }, 
        { status: 400 }
      );
    }
    
    const results = knowledgeBase.searchKnowledgeBase(query, limit || 5);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Knowledge base search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Knowledge base search failed';
    return NextResponse.json(
      { error: `Knowledge base search failed: ${errorMessage}` }, 
      { status: 500 }
    );
  }
} 