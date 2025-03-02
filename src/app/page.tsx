'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  IconChartBar, 
  IconCode, 
  IconBrain, 
  IconBuildingSkyscraper,
  IconBriefcase,
  IconRobot,
  IconArrowRight,
  IconSearch,
  IconFileInvoice,
  IconDatabase,
  IconMenu2,
  IconX,
  IconDashboard,
  IconBrandOpenai,
  IconTool
} from '@tabler/icons-react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Define the agent options
  const agents = [
    { name: 'PABLOS', icon: <IconChartBar size={48} strokeWidth={1.5} />, role: 'Business Strategy Specialist', path: '/chat/pablos' },
    { name: 'GIORGOS', icon: <IconCode size={48} strokeWidth={1.5} />, role: 'Technical Solutions Architect', path: '/chat/giorgos' },
    { name: 'ACHILLIES', icon: <IconBuildingSkyscraper size={48} strokeWidth={1.5} />, role: 'Analytics & Business Intelligence', path: '/chat/achillies' },
    { name: 'FAWZI', icon: <IconBrain size={48} strokeWidth={1.5} />, role: 'AI Implementation Expert', path: '/chat/fawzi' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br">
      {/* Main Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <IconBriefcase className="mr-3" size={28} strokeWidth={1.5} />
            <span>Tzironis Business Suite</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex navbar-links">
            <Link href="/" className="navbar-link">Dashboard</Link>
            <Link href="/automation" className="navbar-link">Automation</Link>
            <Link href="/analytics" className="navbar-link">Analytics</Link>
            <Link href="/settings" className="navbar-link">Settings</Link>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-white/10 mt-2">
            <div className="flex flex-col space-y-1 px-2">
              <Link href="/" className="navbar-link py-3">Dashboard</Link>
              <Link href="/automation" className="navbar-link py-3">Automation</Link>
              <Link href="/analytics" className="navbar-link py-3">Analytics</Link>
              <Link href="/settings" className="navbar-link py-3">Settings</Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow flex flex-col">
        {/* Hero section */}
        <section className="pt-20 pb-16 px-4 text-center relative fade-in">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <IconBriefcase size={84} strokeWidth={1} className="text-primary inline-block" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
              Welcome to Tzironis Business Suite
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
              Intelligent business automation powered by Mistral AI
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/automation" className="bg-primary hover:bg-primary-light text-white px-8 py-3 rounded-lg text-lg font-medium transition-all duration-300 shadow-md hover:shadow-hover flex items-center">
                <IconRobot className="mr-3" size={20} strokeWidth={1.5} />
                Explore Automation
              </Link>
              <Link href="/analytics" className="bg-white hover:bg-gray-50 text-primary px-8 py-3 rounded-lg text-lg font-medium border border-primary transition-all duration-300 shadow-md hover:shadow-hover flex items-center">
                <IconDashboard className="mr-3" size={20} strokeWidth={1.5} />
                View Analytics
              </Link>
            </div>
          </div>
        </section>

        {/* AI Assistants Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">AI Business Assistants</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">Choose a specialized AI assistant to help with your specific business needs</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {agents.map((agent, index) => (
                <Link
                  key={agent.name}
                  href={agent.path}
                  className={`group agent-card slide-up`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="agent-icon">
                    {agent.icon}
                  </div>
                  <h2 className="agent-name">{agent.name}</h2>
                  <p className="agent-role">{agent.role}</p>
                  <div className="mt-auto pt-4 w-full">
                    <span className="agent-button">
                      Chat Now <IconArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* Business Automation Platform */}
        <section className="py-12 sm:py-16 px-4 md:px-6 lg:px-8 bg-accent">
          <div className="max-w-7xl mx-auto">
            <div className="business-platform-container">
              <div className="business-platform-header">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Business Automation Platform</h2>
                <p className="text-blue-100 opacity-90">Streamline operations and boost productivity with our suite of automation tools</p>
              </div>
              <div className="business-platform-content">
                <div className="business-platform-grid">
                  <div className="platform-card">
                    <IconSearch className="text-primary mb-4" size={38} strokeWidth={1.5} />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Lead Generation</h3>
                    <p className="text-gray-600 text-sm">Discover potential clients with our AI-powered lead finder</p>
                  </div>
                  <div className="platform-card">
                    <IconFileInvoice className="text-primary mb-4" size={38} strokeWidth={1.5} />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Invoice Automation</h3>
                    <p className="text-gray-600 text-sm">Create and manage invoices with our union.gr integration</p>
                  </div>
                  <div className="platform-card">
                    <IconDatabase className="text-primary mb-4" size={38} strokeWidth={1.5} />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Knowledge Base</h3>
                    <p className="text-gray-600 text-sm">Access company information, products, and client data</p>
                  </div>
                </div>
                <Link href="/automation" className="business-platform-cta">
                  <IconRobot className="mr-2" size={22} strokeWidth={1.5} />
                  <span>Access Business Automation Tools</span>
                  <IconArrowRight size={18} className="ml-2 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">New Features</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">Discover the latest additions to our suite</p>
            </div>
            
            <div className="card-grid">
              <Link href="/chat/mistral" className="card">
                <div className="card-content">
                  <IconBrain className="card-icon" size={48} />
                  <h2>Mistral AI Chat</h2>
                  <p>
                    Chat with our advanced Mistral-powered assistant that can automate business tasks.
                  </p>
                </div>
              </Link>

              <Link href="/dashboard" className="card">
                <div className="card-content">
                  <IconDashboard className="card-icon" size={48} />
                  <h2>Business Dashboard</h2>
                  <p>Monitor key metrics and analytics for your business growth.</p>
                </div>
              </Link>

              <Link href="/tools" className="card">
                <div className="card-content">
                  <IconTool className="card-icon" size={48} />
                  <h2>Business Tools</h2>
                  <p>Access specialized tools for web scraping, invoicing, and data management.</p>
                </div>
              </Link>

              <Link href="/automations" className="card">
                <div className="card-content">
                  <IconRobot className="card-icon" size={48} />
                  <h2>Automations</h2>
                  <p>Set up automated workflows to streamline your business processes.</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Powered by Mistral AI</h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Our business suite now integrates Mistral AI technology to provide intelligent 
                automation capabilities for your business needs. The system can scrape data from websites,
                generate invoices, interact with your business data, and more.
              </p>
            </div>
            
            <div className="info-section">
              <h3>Key Features</h3>
              <ul>
                <li>Web Scraping: Extract structured data from any website automatically</li>
                <li>Invoice Generation: Create and manage professional invoices with ease</li>
                <li>Business Data Integration: Connect directly with tzironis.gr systems</li>
                <li>Automated Reporting: Generate insights from your business data</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <IconBriefcase className="mr-2 text-primary" size={24} strokeWidth={1.5} />
              <span className="text-primary font-semibold">Tzironis Business Suite</span>
            </div>
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link href="/about" className="text-gray-500 hover:text-primary transition-colors">About</Link>
              <Link href="/contact" className="text-gray-500 hover:text-primary transition-colors">Contact</Link>
              <Link href="/privacy" className="text-gray-500 hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-500 hover:text-primary transition-colors">Terms</Link>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Tzironis Business Suite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
