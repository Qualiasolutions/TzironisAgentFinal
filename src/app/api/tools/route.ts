import { NextRequest, NextResponse } from 'next/server';
import { WebScraperService } from '@/services/WebScraperService';
import { InvoiceGenerationService } from '@/services/InvoiceGenerationService';
import { TzironisAPIService } from '@/services/TzironisAPIService';

// Create service instances
const getWebScraper = () => new WebScraperService();
const getInvoiceGenerator = () => {
  const apiKey = process.env.TZIRONIS_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing TZIRONIS_API_KEY environment variable');
  }
  return new InvoiceGenerationService(apiKey);
};
const getTzironisAPI = () => {
  const apiKey = process.env.TZIRONIS_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing TZIRONIS_API_KEY environment variable');
  }
  return new TzironisAPIService(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, params } = body;
    
    if (!tool) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }
    
    // Execute the requested tool
    switch (tool) {
      case 'web_scraper':
        return handleWebScraper(params);
        
      case 'generate_invoice':
        return handleInvoiceGeneration(params);
        
      case 'tzironis_api':
        return handleTzironisAPI(params);
        
      default:
        return NextResponse.json({ error: `Unsupported tool: ${tool}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in tools API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error in tools API'
    }, { status: 500 });
  }
}

/**
 * Handle web scraping requests
 */
async function handleWebScraper(params: any) {
  try {
    const { url, selector } = params || {};
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required for web scraping' }, { status: 400 });
    }
    
    const scraper = getWebScraper();
    const result = await scraper.scrapeUrl(url, selector);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Web scraping error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error during web scraping',
      success: false
    }, { status: 500 });
  }
}

/**
 * Handle invoice generation requests
 */
async function handleInvoiceGeneration(params: any) {
  try {
    const { client_id, items, date, due_date, notes } = params || {};
    
    if (!client_id) {
      return NextResponse.json({ error: 'client_id is required for invoice generation' }, { status: 400 });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required for invoice generation' }, { status: 400 });
    }
    
    const invoiceParams = {
      clientId: client_id,
      items: items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price
      })),
      date: date,
      dueDate: due_date,
      notes: notes
    };
    
    const invoiceGenerator = getInvoiceGenerator();
    const result = await invoiceGenerator.generateInvoice(invoiceParams);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error during invoice generation',
      success: false
    }, { status: 500 });
  }
}

/**
 * Handle Tzironis API requests
 */
async function handleTzironisAPI(params: any) {
  try {
    const { endpoint, action, data } = params || {};
    
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required for Tzironis API' }, { status: 400 });
    }
    
    if (!action) {
      return NextResponse.json({ error: 'action is required for Tzironis API' }, { status: 400 });
    }
    
    const api = getTzironisAPI();
    
    // Map the API requests to the appropriate service methods
    switch (endpoint) {
      case 'clients':
        return handleClientEndpoint(api, action, data);
        
      case 'products':
        return handleProductEndpoint(api, action, data);
        
      case 'suppliers':
        return handleSupplierEndpoint(api, action, data);
        
      case 'invoices':
        return handleInvoiceEndpoint(api, action, data);
        
      default:
        return NextResponse.json({ error: `Unsupported endpoint: ${endpoint}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Tzironis API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error during Tzironis API operation',
      success: false
    }, { status: 500 });
  }
}

/**
 * Handle client-related API operations
 */
async function handleClientEndpoint(api: TzironisAPIService, action: string, data: any) {
  switch (action) {
    case 'list':
      return NextResponse.json(await api.getClients());
      
    case 'get':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for get action' }, { status: 400 });
      }
      return NextResponse.json(await api.getClient(data.id));
      
    case 'create':
      return NextResponse.json(await api.createClient(data));
      
    case 'update':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for update action' }, { status: 400 });
      }
      return NextResponse.json(await api.updateClient(data.id, data));
      
    case 'delete':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for delete action' }, { status: 400 });
      }
      return NextResponse.json(await api.deleteClient(data.id));
      
    default:
      return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  }
}

/**
 * Handle product-related API operations
 */
async function handleProductEndpoint(api: TzironisAPIService, action: string, data: any) {
  switch (action) {
    case 'list':
      return NextResponse.json(await api.getProducts());
      
    case 'get':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for get action' }, { status: 400 });
      }
      return NextResponse.json(await api.getProduct(data.id));
      
    case 'create':
      return NextResponse.json(await api.createProduct(data));
      
    case 'update':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for update action' }, { status: 400 });
      }
      return NextResponse.json(await api.updateProduct(data.id, data));
      
    case 'delete':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for delete action' }, { status: 400 });
      }
      return NextResponse.json(await api.deleteProduct(data.id));
      
    default:
      return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  }
}

/**
 * Handle supplier-related API operations
 */
async function handleSupplierEndpoint(api: TzironisAPIService, action: string, data: any) {
  switch (action) {
    case 'list':
      return NextResponse.json(await api.getSuppliers());
      
    case 'get':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for get action' }, { status: 400 });
      }
      return NextResponse.json(await api.getSupplier(data.id));
      
    case 'create':
      return NextResponse.json(await api.createSupplier(data));
      
    case 'update':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for update action' }, { status: 400 });
      }
      return NextResponse.json(await api.updateSupplier(data.id, data));
      
    case 'delete':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for delete action' }, { status: 400 });
      }
      return NextResponse.json(await api.deleteSupplier(data.id));
      
    default:
      return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  }
}

/**
 * Handle invoice-related API operations
 */
async function handleInvoiceEndpoint(api: TzironisAPIService, action: string, data: any) {
  switch (action) {
    case 'list':
      return NextResponse.json(await api.getInvoices());
      
    case 'get':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for get action' }, { status: 400 });
      }
      return NextResponse.json(await api.getInvoice(data.id));
      
    case 'create':
      return NextResponse.json(await api.createInvoice(data));
      
    case 'update':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for update action' }, { status: 400 });
      }
      return NextResponse.json(await api.updateInvoice(data.id, data));
      
    case 'delete':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for delete action' }, { status: 400 });
      }
      return NextResponse.json(await api.deleteInvoice(data.id));
      
    case 'generate_pdf':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for generate_pdf action' }, { status: 400 });
      }
      return NextResponse.json(await api.generateInvoicePDF(data.id));
      
    case 'send_email':
      if (!data?.id) {
        return NextResponse.json({ error: 'id is required for send_email action' }, { status: 400 });
      }
      return NextResponse.json(await api.sendInvoiceByEmail(data.id, data.email));
      
    default:
      return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  }
} 