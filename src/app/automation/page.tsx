'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  IconSearch, 
  IconFileInvoice, 
  IconArrowLeft,
  IconPlus,
  IconLoader2,
  IconBrandLinkedin,
  IconCheck,
  IconX,
  IconExternalLink,
  IconBrain,
  IconTrash
} from '@tabler/icons-react';

interface Lead {
  name: string;
  company: string;
  position: string;
  email: string;
  linkedin: string;
}

interface KnowledgeBaseEntry {
  title: string;
  content: string;
  url?: string;
  dateAdded: string;
}

interface InvoiceDetails {
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
}

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<'leads' | 'invoices' | 'knowledge'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<KnowledgeBaseEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [linkedinProfile, setLinkedinProfile] = useState<string>('');
  const [knowledgeUrl, setKnowledgeUrl] = useState<string>('');
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    clientName: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    notes: ''
  });

  useEffect(() => {
    // Load sample data
    setLeads([
      { 
        name: 'Alex Johnson', 
        company: 'TechCorp', 
        position: 'CTO', 
        email: 'alex@techcorp.com',
        linkedin: 'https://linkedin.com/in/alexjohnson'
      },
      { 
        name: 'Sara Williams', 
        company: 'DataSystems', 
        position: 'Head of AI', 
        email: 'sara@datasystems.ai',
        linkedin: 'https://linkedin.com/in/sarawilliams'
      }
    ]);

    setKnowledgeBase([
      {
        title: 'Introduction to LangChain',
        content: 'LangChain is a framework for developing applications powered by language models...',
        url: 'https://docs.langchain.com/docs/',
        dateAdded: '2023-09-15'
      },
      {
        title: 'Mistral AI Documentation',
        content: 'Mistral AI offers powerful language models with efficient performance...',
        url: 'https://docs.mistral.ai/',
        dateAdded: '2023-10-02'
      }
    ]);

    setInvoices([
      {
        clientName: 'Acme Corp',
        invoiceNumber: 'INV-2023-001',
        issueDate: '2023-10-10',
        dueDate: '2023-11-10',
        items: [
          { description: 'AI Implementation Services', quantity: 1, unitPrice: 5000 },
          { description: 'Custom Model Training', quantity: 1, unitPrice: 3000 }
        ],
        notes: 'Payment due within 30 days'
      }
    ]);
  }, []);

  const handleLeadScraping = async () => {
    if (!linkedinProfile) {
      setError('Please enter a LinkedIn profile URL');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newLead: Lead = {
        name: 'Jordan Smith',
        company: 'AI Innovations',
        position: 'Product Manager',
        email: 'jordan@aiinnovations.tech',
        linkedin: linkedinProfile
      };
      
      setLeads([newLead, ...leads]);
      setLinkedinProfile('');
      setSuccess('Lead successfully scraped!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to scrape lead information');
      console.error('Lead scraping error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvoiceCreation = async () => {
    if (!invoiceDetails.clientName || !invoiceDetails.invoiceNumber) {
      setError('Please fill in all required invoice fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setInvoices([invoiceDetails, ...invoices]);
      setInvoiceDetails({
        clientName: '',
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: ''
      });
      setSuccess('Invoice successfully created!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create invoice');
      console.error('Invoice creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKnowledgeBaseAdd = async () => {
    if (!knowledgeUrl) {
      setError('Please enter a valid URL');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const newEntry: KnowledgeBaseEntry = {
        title: 'New Knowledge Base Document',
        content: 'This document was automatically parsed and added to your knowledge base...',
        url: knowledgeUrl,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      
      setKnowledgeBase([newEntry, ...knowledgeBase]);
      setKnowledgeUrl('');
      setSuccess('Document successfully added to knowledge base!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add document to knowledge base');
      console.error('Knowledge base addition error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKnowledgeSearch = async () => {
    if (!searchTerm) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple search simulation
      const results = knowledgeBase.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setSuccess('No matching documents found');
      } else {
        setSuccess(`Found ${results.length} matching document(s)`);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Search failed');
      console.error('Knowledge search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceDetails({
      ...invoiceDetails,
      items: [
        ...invoiceDetails.items,
        { description: '', quantity: 1, unitPrice: 0 }
      ]
    });
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceDetails.items.length <= 1) return;
    
    const updatedItems = [...invoiceDetails.items];
    updatedItems.splice(index, 1);
    
    setInvoiceDetails({
      ...invoiceDetails,
      items: updatedItems
    });
  };

  const updateInvoiceItem = (index: number, field: string, value: string | number) => {
    const updatedItems = [...invoiceDetails.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'description' ? value : Number(value)
    };
    
    setInvoiceDetails({
      ...invoiceDetails,
      items: updatedItems
    });
  };

  const calculateTotal = () => {
    return invoiceDetails.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    <div className="container mx-auto p-6 fade-in">
      <header className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Business Automation</h1>
          <Link href="/" className="btn btn-outline flex items-center">
            <IconArrowLeft size={18} strokeWidth={1.5} className="mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      {error && (
        <div className="alert alert-error mb-6 slide-up">
          <IconX size={20} strokeWidth={1.5} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-6 slide-up">
          <IconCheck size={20} strokeWidth={1.5} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`tab-button ${activeTab === 'leads' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <IconBrandLinkedin size={20} strokeWidth={1.5} className="mr-2" />
            Lead Generation
          </button>
          <button
            className={`tab-button ${activeTab === 'invoices' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <IconFileInvoice size={20} strokeWidth={1.5} className="mr-2" />
            Invoice Creation
          </button>
          <button
            className={`tab-button ${activeTab === 'knowledge' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            <IconBrain size={20} strokeWidth={1.5} className="mr-2" />
            Knowledge Base
          </button>
        </div>
      </div>

      {activeTab === 'leads' && (
        <div className="slide-up">
          <div className="automation-card mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">LinkedIn Lead Scraper</h2>
            <div className="mb-4">
              <label htmlFor="linkedin-url" className="form-label">LinkedIn Profile URL</label>
              <div className="flex">
                <input
                  id="linkedin-url"
                  type="url"
                  className="form-input flex-grow mr-4"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinProfile}
                  onChange={(e) => setLinkedinProfile(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  className="btn btn-primary flex items-center" 
                  onClick={handleLeadScraping}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <IconLoader2 size={20} strokeWidth={1.5} className="animate-spin mr-2" />
                      Processing
                    </>
                  ) : (
                    'Extract Contact'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="automation-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Leads ({leads.length})</h2>
            
            {leads.length === 0 ? (
              <p className="text-gray-500">No leads found. Start by scraping a LinkedIn profile.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Position</th>
                      <th>Email</th>
                      <th>LinkedIn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, index) => (
                      <tr key={index}>
                        <td>{lead.name}</td>
                        <td>{lead.company}</td>
                        <td>{lead.position}</td>
                        <td>{lead.email}</td>
                        <td>
                          <a 
                            href={lead.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-dark flex items-center"
                          >
                            View <IconExternalLink size={16} strokeWidth={1.5} className="ml-1" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="slide-up">
          <div className="automation-card mb-6 p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Create Invoice</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="client-name" className="form-label">Client Name</label>
                <input
                  id="client-name"
                  type="text"
                  className="form-input"
                  placeholder="Client name"
                  value={invoiceDetails.clientName}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, clientName: e.target.value})}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="invoice-number" className="form-label">Invoice Number</label>
                <input
                  id="invoice-number"
                  type="text"
                  className="form-input"
                  placeholder="e.g. INV-2023-001"
                  value={invoiceDetails.invoiceNumber}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="issue-date" className="form-label">Issue Date</label>
                <input
                  id="issue-date"
                  type="date"
                  className="form-input"
                  value={invoiceDetails.issueDate}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, issueDate: e.target.value})}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="due-date" className="form-label">Due Date</label>
                <input
                  id="due-date"
                  type="date"
                  className="form-input"
                  value={invoiceDetails.dueDate}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, dueDate: e.target.value})}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-3 text-primary">Invoice Items</h3>
            
            {invoiceDetails.items.map((item, index) => (
              <div key={index} className="flex flex-wrap items-end mb-4 bg-accent p-4 rounded-lg">
                <div className="w-full md:w-1/2 mb-3 md:mb-0 md:pr-2">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Service description"
                    value={item.description}
                    onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="w-1/4 md:w-1/6 mb-3 md:mb-0 md:px-2">
                  <label className="form-label">Qty</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="w-2/4 md:w-1/4 mb-3 md:mb-0 md:px-2">
                  <label className="form-label">Unit Price</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateInvoiceItem(index, 'unitPrice', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="w-1/4 md:w-1/12 flex justify-center">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeInvoiceItem(index)}
                    disabled={isLoading || invoiceDetails.items.length <= 1}
                  >
                    <IconTrash size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center mb-6">
              <button
                type="button"
                className="btn btn-outline flex items-center"
                onClick={addInvoiceItem}
                disabled={isLoading}
              >
                <IconPlus size={18} strokeWidth={1.5} className="mr-2" />
                Add Item
              </button>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-primary">
                  Total: ${calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea
                id="notes"
                className="form-input h-24"
                placeholder="Additional notes or payment instructions"
                value={invoiceDetails.notes}
                onChange={(e) => setInvoiceDetails({...invoiceDetails, notes: e.target.value})}
                disabled={isLoading}
              ></textarea>
            </div>
            
            <div className="mt-6">
              <button
                className="btn btn-primary w-full flex items-center justify-center"
                onClick={handleInvoiceCreation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <IconLoader2 size={20} strokeWidth={1.5} className="animate-spin mr-2" />
                    Processing
                  </>
                ) : (
                  'Generate Invoice'
                )}
              </button>
            </div>
          </div>
          
          <div className="automation-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Recent Invoices ({invoices.length})</h2>
            
            {invoices.length === 0 ? (
              <p className="text-gray-500">No invoices found. Create your first invoice using the form above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Client</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, index) => (
                      <tr key={index}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{invoice.clientName}</td>
                        <td>{invoice.issueDate}</td>
                        <td>{invoice.dueDate}</td>
                        <td>${invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="automation-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Add to Knowledge Base</h2>
              <div className="mb-4">
                <label htmlFor="document-url" className="form-label">Document URL</label>
                <input
                  id="document-url"
                  type="url"
                  className="form-input mb-4"
                  placeholder="https://example.com/document.pdf"
                  value={knowledgeUrl}
                  onChange={(e) => setKnowledgeUrl(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  className="btn btn-primary w-full flex items-center justify-center"
                  onClick={handleKnowledgeBaseAdd}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <IconLoader2 size={20} strokeWidth={1.5} className="animate-spin mr-2" />
                      Processing
                    </>
                  ) : (
                    'Extract & Add to Knowledge Base'
                  )}
                </button>
              </div>
            </div>
            
            <div className="automation-card p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Search Knowledge Base</h2>
              <div className="mb-4">
                <label htmlFor="search-term" className="form-label">Search Term</label>
                <div className="flex">
                  <input
                    id="search-term"
                    type="text"
                    className="form-input flex-grow mr-4"
                    placeholder="Enter keywords to search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    className="btn btn-primary flex items-center"
                    onClick={handleKnowledgeSearch}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <IconLoader2 size={20} strokeWidth={1.5} className="animate-spin mr-2" />
                        Searching
                      </>
                    ) : (
                      <>
                        <IconSearch size={20} strokeWidth={1.5} className="mr-2" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3 text-primary">Search Results</h3>
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div key={index} className="kb-result-card">
                        <div className="font-medium mb-1">{result.title}</div>
                        <p className="text-sm text-gray-600 mb-2">
                          {result.content.substring(0, 120)}...
                        </p>
                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-dark text-sm flex items-center"
                          >
                            View Source <IconExternalLink size={16} strokeWidth={1.5} className="ml-1" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="automation-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary">Knowledge Base Entries ({knowledgeBase.length})</h2>
            
            {knowledgeBase.length === 0 ? (
              <p className="text-gray-500">No documents in knowledge base. Add your first document using the form above.</p>
            ) : (
              <div className="space-y-4">
                {knowledgeBase.map((entry, index) => (
                  <div key={index} className="kb-result-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium mb-1">{entry.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {entry.content.substring(0, 160)}...
                        </p>
                        <div className="flex items-center">
                          {entry.url && (
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary-dark text-sm flex items-center mr-4"
                            >
                              View Source <IconExternalLink size={16} strokeWidth={1.5} className="ml-1" />
                            </a>
                          )}
                          <span className="text-xs text-gray-500">Added: {entry.dateAdded}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 