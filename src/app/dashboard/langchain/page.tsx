'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IconArrowLeft, IconExternalLink, IconChartBar, IconApi, IconBrain } from '@tabler/icons-react';

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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 fade-in">
      <header className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Tzironis Logo" 
              width={32}
              height={32}
              className="h-8 w-auto mr-3"
            />
            <h1 className="text-3xl font-bold text-primary">AI Dashboard</h1>
          </div>
          <Link 
            href="/"
            className="btn btn-outline flex items-center"
          >
            <IconArrowLeft size={18} strokeWidth={1.5} className="mr-2" />
            Back to Home
          </Link>
        </div>
      </header>
      
      <div className="automation-card mb-6 p-6 slide-up">
        <h2 className="text-xl font-semibold mb-4 text-primary">Active LangChain Project</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-accent p-4 rounded-lg">
          <div>
            <p className="mb-2">
              <span className="font-medium">Project Name:</span> {projectName}
            </p>
            <p className="text-sm text-gray-600">
              Connected to LangSmith for monitoring and visualization of AI chains and agents.
            </p>
          </div>
          
          <a 
            href="https://smith.langchain.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary mt-4 md:mt-0 inline-flex items-center"
          >
            View in LangSmith
            <IconExternalLink size={18} strokeWidth={1.5} className="ml-2" />
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card-icon">
            <IconChartBar size={24} strokeWidth={1.5} />
          </div>
          <div className="stat-card-value">28</div>
          <div className="stat-card-label">Traced Runs Today</div>
        </div>
        
        <div className="stat-card slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="stat-card-icon">
            <IconApi size={24} strokeWidth={1.5} />
          </div>
          <div className="stat-card-value">543</div>
          <div className="stat-card-label">API Calls This Week</div>
        </div>
        
        <div className="stat-card slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="stat-card-icon">
            <IconBrain size={24} strokeWidth={1.5} />
          </div>
          <div className="stat-card-value">12</div>
          <div className="stat-card-label">Active AI Agents</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="automation-card p-6 slide-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl font-semibold mb-4 text-primary">Recent Traces</h2>
          <div className="space-y-4">
            <div className="bg-accent p-4 rounded-lg">
              <div className="text-sm font-medium mb-1">Agent Session #28943</div>
              <div className="text-xs text-gray-500 mb-2">Today at 14:32</div>
              <div className="flex items-center text-sm">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Success - Completed in 2.4s
              </div>
            </div>
            
            <div className="bg-accent p-4 rounded-lg">
              <div className="text-sm font-medium mb-1">Knowledge Search #28942</div>
              <div className="text-xs text-gray-500 mb-2">Today at 13:15</div>
              <div className="flex items-center text-sm">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Success - Completed in 1.8s
              </div>
            </div>
            
            <div className="bg-accent p-4 rounded-lg">
              <div className="text-sm font-medium mb-1">Invoice Generation #28941</div>
              <div className="text-xs text-gray-500 mb-2">Today at 11:42</div>
              <div className="flex items-center text-sm">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                Warning - Completed in 4.2s
              </div>
            </div>
          </div>
          
          <a 
            href="https://smith.langchain.com/traces" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline w-full mt-4 inline-flex items-center justify-center"
          >
            View All Traces
            <IconExternalLink size={16} strokeWidth={1.5} className="ml-2" />
          </a>
        </div>
        
        <div className="automation-card p-6 slide-up" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-xl font-semibold mb-4 text-primary">API Usage</h2>
          <div className="bg-accent p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Current Usage</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>GPT-4 Tokens</span>
                  <span>48,932 / 100,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '48.9%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>GPT-3.5 Tokens</span>
                  <span>124,532 / 500,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '24.9%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Embedding Tokens</span>
                  <span>832,412 / 1,000,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '83.2%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <a 
              href="https://smith.langchain.com/settings" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline inline-flex items-center justify-center"
            >
              API Settings
            </a>
            <a 
              href="https://smith.langchain.com/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline inline-flex items-center justify-center"
            >
              Billing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 