import PhiChatExample from '@/components/PhiChatExample';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata = {
  title: 'Phi-4 Mini Chat Demo | Tzironis Business Suite',
  description: 'Demo showcasing the integration of Microsoft Phi-4-mini-instruct model',
};

export default function PhiChatDemoPage() {
  return (
    <div className="container">
      <div className="demo-header">
        <h1>Phi-4 Mini Chat Demo</h1>
        <p className="subtitle">
          Experience our integration with Microsoft's Phi-4-mini-instruct model
        </p>
      </div>
      
      <div className="demo-content">
        <ErrorBoundary>
          <PhiChatExample />
        </ErrorBoundary>
      </div>
      
      <div className="demo-info">
        <h2>About This Demo</h2>
        <p>
          This demonstration showcases the integration of Microsoft's Phi-4-mini-instruct model into 
          the Tzironis Business Suite. The model provides intelligent responses while maintaining 
          efficiency and reasonable response times.
        </p>
        
        <h3>Key Features</h3>
        <ul>
          <li>Free tier access with reasonable usage limits</li>
          <li>Specialized agent personas with different expertise areas</li>
          <li>Compact model size (4B parameters) with impressive capabilities</li>
          <li>Optimized for instruction following and chat interactions</li>
        </ul>
        
        <h3>Integration Details</h3>
        <p>
          The integration uses the Hugging Face Inference API to communicate with the 
          Phi-4-mini-instruct model. This approach allows for easy deployment without the 
          need for specialized hardware or complex setups.
        </p>
        
        <div className="setup-note">
          <h3>⚠️ Configuration Note</h3>
          <p>
            To use this feature, the <code>HUGGINGFACE_API_KEY</code> environment variable 
            must be configured in your deployment environment. If you're seeing errors, 
            please verify this configuration is in place.
          </p>
          <p>
            You can get a free API key by signing up at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">Hugging Face</a>.
          </p>
        </div>
      </div>
    </div>
  );
} 