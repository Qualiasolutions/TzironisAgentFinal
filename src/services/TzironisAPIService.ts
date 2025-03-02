/**
 * TzironisAPIService.ts
 * Service for interacting with tzironis.gr website and APIs
 */

interface TzironisAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vatNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  description?: string;
  category?: string;
  stock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vatNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export class TzironisAPIService {
  private baseUrl: string;
  private apiKey: string;
  
  constructor(apiKey: string, baseUrl = 'https://api.tzironis.gr') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  /**
   * Basic API request handler with authentication
   */
  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any
  ): Promise<TzironisAPIResponse<T>> {
    try {
      const url = `${this.baseUrl}/${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };
      
      const options: RequestInit = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      };
      
      console.log(`Making ${method} request to ${url}`);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('API request error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during API request',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Client methods
  async getClients(): Promise<TzironisAPIResponse<Client[]>> {
    return this.makeRequest<Client[]>('clients');
  }
  
  async getClient(id: string): Promise<TzironisAPIResponse<Client>> {
    return this.makeRequest<Client>(`clients/${id}`);
  }
  
  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<TzironisAPIResponse<Client>> {
    return this.makeRequest<Client>('clients', 'POST', client);
  }
  
  async updateClient(id: string, clientData: Partial<Client>): Promise<TzironisAPIResponse<Client>> {
    return this.makeRequest<Client>(`clients/${id}`, 'PUT', clientData);
  }
  
  async deleteClient(id: string): Promise<TzironisAPIResponse<boolean>> {
    return this.makeRequest<boolean>(`clients/${id}`, 'DELETE');
  }
  
  // Product methods
  async getProducts(): Promise<TzironisAPIResponse<Product[]>> {
    return this.makeRequest<Product[]>('products');
  }
  
  async getProduct(id: string): Promise<TzironisAPIResponse<Product>> {
    return this.makeRequest<Product>(`products/${id}`);
  }
  
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<TzironisAPIResponse<Product>> {
    return this.makeRequest<Product>('products', 'POST', product);
  }
  
  async updateProduct(id: string, productData: Partial<Product>): Promise<TzironisAPIResponse<Product>> {
    return this.makeRequest<Product>(`products/${id}`, 'PUT', productData);
  }
  
  async deleteProduct(id: string): Promise<TzironisAPIResponse<boolean>> {
    return this.makeRequest<boolean>(`products/${id}`, 'DELETE');
  }
  
  // Supplier methods
  async getSuppliers(): Promise<TzironisAPIResponse<Supplier[]>> {
    return this.makeRequest<Supplier[]>('suppliers');
  }
  
  async getSupplier(id: string): Promise<TzironisAPIResponse<Supplier>> {
    return this.makeRequest<Supplier>(`suppliers/${id}`);
  }
  
  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<TzironisAPIResponse<Supplier>> {
    return this.makeRequest<Supplier>('suppliers', 'POST', supplier);
  }
  
  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<TzironisAPIResponse<Supplier>> {
    return this.makeRequest<Supplier>(`suppliers/${id}`, 'PUT', supplierData);
  }
  
  async deleteSupplier(id: string): Promise<TzironisAPIResponse<boolean>> {
    return this.makeRequest<boolean>(`suppliers/${id}`, 'DELETE');
  }
  
  // Invoice methods
  async getInvoices(): Promise<TzironisAPIResponse<Invoice[]>> {
    return this.makeRequest<Invoice[]>('invoices');
  }
  
  async getInvoice(id: string): Promise<TzironisAPIResponse<Invoice>> {
    return this.makeRequest<Invoice>(`invoices/${id}`);
  }
  
  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<TzironisAPIResponse<Invoice>> {
    return this.makeRequest<Invoice>('invoices', 'POST', invoice);
  }
  
  async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<TzironisAPIResponse<Invoice>> {
    return this.makeRequest<Invoice>(`invoices/${id}`, 'PUT', invoiceData);
  }
  
  async deleteInvoice(id: string): Promise<TzironisAPIResponse<boolean>> {
    return this.makeRequest<boolean>(`invoices/${id}`, 'DELETE');
  }
  
  // Generate invoice PDF
  async generateInvoicePDF(id: string): Promise<TzironisAPIResponse<{ url: string }>> {
    return this.makeRequest<{ url: string }>(`invoices/${id}/pdf`, 'POST');
  }
  
  // Send invoice by email
  async sendInvoiceByEmail(id: string, email: string): Promise<TzironisAPIResponse<boolean>> {
    return this.makeRequest<boolean>(`invoices/${id}/send`, 'POST', { email });
  }
} 