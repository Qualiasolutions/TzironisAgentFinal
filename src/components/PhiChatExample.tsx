import { useState } from 'react';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PhiChatExample = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState('Tzironis');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert messages to LangChain format for the API
      const history = messages.map((msg) => 
        msg.role === 'user' 
          ? new HumanMessage(msg.content) 
          : new AIMessage(msg.content)
      );

      // Call the Phi-4 API route
      const response = await fetch('/api/chat/phi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          history,
          agent 
        }),
      });

      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: ChatMessage = { 
        role: 'assistant', 
        content: data.message 
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAgent(e.target.value);
  };

  return (
    <div className="phi-chat-container">
      <div className="phi-chat-header">
        <h2>Chat with Phi-4 Mini</h2>
        <div className="agent-selector">
          <label htmlFor="agent-select">Select Agent: </label>
          <select 
            id="agent-select"
            value={agent} 
            onChange={handleAgentChange}
          >
            <option value="Tzironis">Tzironis (General)</option>
            <option value="Pablos">Pablos (Technical)</option>
            <option value="Giorgos">Giorgos (Business)</option>
            <option value="Achillies">Achillies (Creative)</option>
            <option value="Fawzi">Fawzi (Data Analysis)</option>
          </select>
        </div>
      </div>

      <div className="phi-messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Start a conversation with the Phi-4 Mini model</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-content loading">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="phi-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default PhiChatExample; 