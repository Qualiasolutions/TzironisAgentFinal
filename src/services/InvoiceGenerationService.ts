import { TzironisAPIService, Invoice, InvoiceItem, Client, Product } from './TzironisAPIService';

export interface GenerateInvoiceParams {
  clientId: string;
  items: {
    productId: string;
    quantity: number;
    price?: number; // Optional override price
  }[];
  date?: string;
  dueDate?: string;
  notes?: string;
}

export interface InvoiceGenerationResult {
  success: boolean;
  invoice?: Invoice;
  pdfUrl?: string;
  error?: string;
}

export class InvoiceGenerationService {
  private apiService: TzironisAPIService;
  
  constructor(apiKey: string) {
    this.apiService = new TzironisAPIService(apiKey);
  }
  
  /**
   * Generate a new invoice and return the result
   */
  async generateInvoice(params: GenerateInvoiceParams): Promise<InvoiceGenerationResult> {
    try {
      // 1. Validate input parameters
      if (!params.clientId) {
        throw new Error('Client ID is required');
      }
      
      if (!params.items || params.items.length === 0) {
        throw new Error('At least one item is required');
      }
      
      // 2. Get client information
      const clientResponse = await this.apiService.getClient(params.clientId);
      if (!clientResponse.success || !clientResponse.data) {
        throw new Error(`Failed to retrieve client: ${clientResponse.error || 'Unknown error'}`);
      }
      
      const client = clientResponse.data;
      
      // 3. Get product information for each item
      const invoiceItems: InvoiceItem[] = [];
      let total = 0;
      
      for (const item of params.items) {
        const productResponse = await this.apiService.getProduct(item.productId);
        if (!productResponse.success || !productResponse.data) {
          throw new Error(`Failed to retrieve product ${item.productId}: ${productResponse.error || 'Unknown error'}`);
        }
        
        const product = productResponse.data;
        const unitPrice = item.price !== undefined ? item.price : product.price;
        const itemTotal = unitPrice * item.quantity;
        
        invoiceItems.push({
          id: '', // Will be assigned by the API
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          total: itemTotal
        });
        
        total += itemTotal;
      }
      
      // 4. Create invoice object
      const newInvoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: client.id,
        clientName: client.name,
        date: params.date || new Date().toISOString().split('T')[0],
        dueDate: params.dueDate,
        items: invoiceItems,
        total,
        status: 'draft',
        notes: params.notes
      };
      
      // 5. Create the invoice through the API
      const invoiceResponse = await this.apiService.createInvoice(newInvoice);
      if (!invoiceResponse.success || !invoiceResponse.data) {
        throw new Error(`Failed to create invoice: ${invoiceResponse.error || 'Unknown error'}`);
      }
      
      const createdInvoice = invoiceResponse.data;
      
      // 6. Generate PDF (optional)
      let pdfUrl: string | undefined;
      try {
        const pdfResponse = await this.apiService.generateInvoicePDF(createdInvoice.id);
        if (pdfResponse.success && pdfResponse.data) {
          pdfUrl = pdfResponse.data.url;
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        // Continue without PDF if generation fails
      }
      
      return {
        success: true,
        invoice: createdInvoice,
        pdfUrl
      };
    } catch (error) {
      console.error('Invoice generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during invoice generation'
      };
    }
  }
  
  /**
   * Calculate invoice totals based on items
   */
  calculateInvoiceTotals(items: { quantity: number; price: number }[]): { 
    subtotal: number; 
    tax: number; 
    total: number 
  } {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.24; // 24% VAT in Greece
    const total = subtotal + tax;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }
  
  /**
   * List recent invoices for a client
   */
  async getClientInvoices(clientId: string): Promise<Invoice[]> {
    const response = await this.apiService.getInvoices();
    if (!response.success || !response.data) {
      return [];
    }
    
    return response.data.filter(invoice => invoice.clientId === clientId);
  }
  
  /**
   * Send an invoice to client by email
   */
  async sendInvoiceByEmail(invoiceId: string, email?: string): Promise<boolean> {
    try {
      // If no email provided, get client email from invoice
      let recipientEmail = email;
      
      if (!recipientEmail) {
        const invoiceResponse = await this.apiService.getInvoice(invoiceId);
        if (!invoiceResponse.success || !invoiceResponse.data) {
          throw new Error(`Failed to retrieve invoice ${invoiceId}`);
        }
        
        const invoice = invoiceResponse.data;
        const clientResponse = await this.apiService.getClient(invoice.clientId);
        
        if (!clientResponse.success || !clientResponse.data || !clientResponse.data.email) {
          throw new Error(`Client email not found for invoice ${invoiceId}`);
        }
        
        recipientEmail = clientResponse.data.email;
      }
      
      const response = await this.apiService.sendInvoiceByEmail(invoiceId, recipientEmail);
      return response.success === true;
    } catch (error) {
      console.error('Error sending invoice by email:', error);
      return false;
    }
  }
} 