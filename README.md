# TZIRONIS AGENT

A fully intelligent bilingual chatbot with voice capabilities, designed to work in both Greek and English.

## Features

- Voice input/output with support for both Greek and English
- Automatic language detection
- Responsive UI that works well on mobile devices
- Persistent conversation history
- Proper error handling and fallback mechanisms

## Technical Stack

- **Frontend**: Next.js with React 18, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes
- **Language Models**: LangChain with browser automation via Selenium
- **Voice**: Web Speech API for recognition and synthesis
- **Internationalization**: i18next for bilingual support (Greek/English)

## Prerequisites

- Node.js 18 or higher
- Chrome browser (for Selenium automation)
- Chrome WebDriver (for Selenium)

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/Qualiasolutions/TzironisAgentFinal.git
   cd TzironisAgentFinal
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following content:
   ```
   NEXT_PUBLIC_DEFAULT_LANGUAGE=el
   NEXT_PUBLIC_FALLBACK_LANGUAGE=en
   LANGCHAIN_TRACING_V2=false
   SELENIUM_DRIVER_PATH=./selenium-drivers/chromedriver
   LANGCHAIN_API_KEY=your-langchain-api-key-here
   ```

4. Download Chrome WebDriver:
   - Visit the [Chrome WebDriver download page](https://chromedriver.chromium.org/downloads)
   - Download the version that matches your Chrome browser
   - Create a `selenium-drivers` folder in the root of the project
   - Extract the WebDriver executable into the `selenium-drivers` folder
   - Make sure the path in `.env.local` matches your WebDriver location

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Create a Vercel account if you don't have one
2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

3. Deploy to Vercel:
   ```
   vercel
   ```

4. Set environment variables in the Vercel dashboard.

### GitHub Actions Setup

This project includes GitHub Actions workflows for continuous integration. To use it:

1. Push the repository to GitHub
2. Go to Settings > Secrets and add the following repository secrets:
   - `LANGCHAIN_API_KEY`: Your LangChain API key

## Browser Support

The application works best in modern browsers that support the Web Speech API:
- Chrome (recommended)
- Edge
- Firefox
- Safari

## Mobile Support

The application is designed to be fully responsive and works well on mobile devices. Voice input and output capabilities are supported on mobile browsers that implement the Web Speech API.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [LangChain](https://js.langchain.com/) - Framework for LLM applications
- [Selenium](https://www.selenium.dev/) - Browser automation
- [i18next](https://www.i18next.com/) - Internationalization framework
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - Speech recognition and synthesis
