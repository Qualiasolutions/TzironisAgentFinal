'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LangChainDashboard() {
  const [projectName, setProjectName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Fetch project name from environment variable or config
    const fetchProjectInfo = async () => {
      try {
        setProjectName('tzironis-business-suite');
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching project info:', error);
        setIsLoading(false);
      }
    };
    
    fetchProjectInfo();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-indicator">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Tzironis Logo" 
              className="h-8 w-auto mr-3" 
            />
            <h1 className="text-3xl font-bold text-primary">AI Dashboard</h1>
          </div>
          <Link 
            href="/"
            className="text-primary hover:text-primary/80 font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Chat
          </Link>
        </div>
      </header>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-primary">Active LangChain Project</h2>
        <p className="mb-2">
          <span className="font-medium">Project Name:</span> {projectName}
        </p>
        
        <div className="mt-4">
          <a 
            href="https://smith.langchain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
          >
            View in LangSmith Dashboard
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-primary">Recent Traces</h2>
          <p className="text-gray-600">
            View your recent interactions in the LangSmith dashboard to analyze prompt performance, 
            token usage, and response quality.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-primary">API Usage</h2>
          <p className="text-gray-600">
            Check your API usage metrics and manage your LangChain integration settings 
            in the LangSmith dashboard.
          </p>
        </div>
      </div>
    </div>
  );
} 