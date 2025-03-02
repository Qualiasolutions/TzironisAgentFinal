import MistralChatExample from '@/components/MistralChatExample';

export default function MistralChatPage() {
  return (
    <div className="container">
      <h1 className="page-title">Tzironis Business Suite - Mistral AI</h1>
      <p className="subtitle">
        Intelligent assistant with automation capabilities powered by Mistral AI
      </p>
      
      <div className="feature-list">
        <div className="feature-item">
          <h3>Web Scraping</h3>
          <p>Extract data from websites automatically</p>
        </div>
        <div className="feature-item">
          <h3>Invoice Generation</h3>
          <p>Create and manage invoices for your clients</p>
        </div>
        <div className="feature-item">
          <h3>Business Data</h3>
          <p>Access and analyze your business information</p>
        </div>
        <div className="feature-item">
          <h3>Automation</h3>
          <p>Streamline repetitive tasks and workflows</p>
        </div>
      </div>
      
      <div className="chat-wrapper">
        <MistralChatExample />
      </div>
      
      <div className="info-section">
        <h2>About Mistral AI Integration</h2>
        <p>
          This chat interface leverages Mistral's advanced large language model capabilities 
          combined with custom tools for automating business tasks. You can ask the assistant 
          to perform actions like web scraping, invoice generation, and data retrieval from 
          your business systems.
        </p>
        <p>
          The assistant can understand complex requests and break them down into actionable 
          steps. Try asking it to scrape information from a website, generate an invoice for 
          a client, or analyze your business data.
        </p>
      </div>
    </div>
  );
} 