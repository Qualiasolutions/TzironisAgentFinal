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
          <h1 className="text-3xl font-bold">AI Dashboard</h1>
          <Link 
            href="/"
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
          >
            ← Back to Chat
          </Link>
        </div>
      </header>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Active LangChain Project</h2>
        <p className="mb-2">
          <span className="font-medium">Project Name:</span> {projectName}
        </p>
        
        <div className="mt-4">
          <a 
            href="https://smith.langchain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            View in LangSmith Dashboard
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Traces</h2>
          <p className="text-gray-600 dark:text-gray-300">
            View your recent interactions in the LangSmith dashboard to analyze prompt performance, 
            token usage, and response quality.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">API Usage</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Check your API usage metrics and manage your LangChain integration settings 
            in the LangSmith dashboard.
          </p>
        </div>
      </div>
    </div>
  );
} 