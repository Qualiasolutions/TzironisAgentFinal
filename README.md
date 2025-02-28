# Tzironis Business Suite - AI Chatbot

A modern AI chatbot assistant for business operations, powered by Mistral AI.

## Features

- Modern, responsive chat interface
- Multi-language support with automatic language detection
- Powered by Mistral AI for intelligent responses
- Real-time communication
- Error handling and smooth user experience

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Mistral AI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/tzironis-agent-final.git
   cd tzironis-agent-final
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Rename `.env.local.example` to `.env.local`
   - Add your Mistral AI API key to the `.env.local` file:
     ```
     MISTRAL_API_KEY=your_mistral_api_key_here
     ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

```bash
npm run build
npm run start
```

## Technology Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Mistral AI API
- Axios for API communication
- Language detection

## Customization

You can customize the AI behavior by modifying the parameters in the `src/app/api/chat/route.ts` file:

```typescript
// Adjust model, temperature, and other parameters for different AI behavior
{
  model: 'mistral-medium',  // Change to a different Mistral model if needed
  messages,
  temperature: 0.7,  // Higher = more creative, Lower = more deterministic
  max_tokens: 2000,  // Maximum response length
}
```

## License

[MIT License](LICENSE)

## Acknowledgements

- Mistral AI for the powerful language model
- Next.js team for the application framework
