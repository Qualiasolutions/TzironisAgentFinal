import axios from 'axios';
import * as cheerio from 'cheerio';
import { delay } from './helpers';

export interface ScrapedLead {
  name: string;
  contactInfo: string;
  website?: string;
  source: string;
  scrapedDate: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface ScrapingOptions {
  maxRetries?: number;
  delayBetweenRequests?: number;
  userAgent?: string;
  timeout?: number;
}

export class WebScraper {
  private options: Required<ScrapingOptions>;
  
  constructor(options: ScrapingOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      delayBetweenRequests: options.delayBetweenRequests || 2000,
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      timeout: options.timeout || 30000,
    };
  }

  /**
   * Fetches HTML content from a URL with retries and error handling
   */
  async fetchPage(url: string): Promise<string> {
    let retries = 0;
    
    while (retries < this.options.maxRetries) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.options.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: this.options.timeout,
        });
        
        // Rate limiting - wait before next request
        await delay(this.options.delayBetweenRequests);
        
        return response.data;
      } catch (error: any) {
        retries++;
        console.error(`Error fetching ${url} (attempt ${retries}/${this.options.maxRetries}):`, error.message);
        
        if (retries < this.options.maxRetries) {
          // Exponential backoff
          await delay(this.options.delayBetweenRequests * Math.pow(2, retries));
        } else {
          throw new Error(`Failed to fetch ${url} after ${this.options.maxRetries} attempts: ${error.message}`);
        }
      }
    }
    
    throw new Error(`Failed to fetch ${url}`);
  }

  /**
   * Scrapes business directory websites for leads
   */
  async scrapeBusinessDirectory(url: string, selectors: {
    container: string;
    name: string;
    contact: string;
    website?: string;
  }): Promise<ScrapedLead[]> {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      const leads: ScrapedLead[] = [];

      $(selectors.container).each((_, element) => {
        try {
          const name = $(element).find(selectors.name).text().trim();
          const contactInfo = $(element).find(selectors.contact).text().trim();
          
          if (!name || !contactInfo) return; // Skip incomplete entries
          
          const lead: ScrapedLead = {
            name,
            contactInfo,
            source: url,
            scrapedDate: new Date(),
          };
          
          if (selectors.website) {
            lead.website = $(element).find(selectors.website).attr('href')?.trim();
          }
          
          leads.push(lead);
        } catch (error) {
          console.error('Error parsing lead element:', error);
        }
      });

      return leads;
    } catch (error) {
      console.error(`Error scraping business directory ${url}:`, error);
      return [];
    }
  }

  /**
   * Scrapes LinkedIn for business leads
   * Note: LinkedIn has strict anti-scraping measures
   */
  async scrapeLinkedInLeads(query: string): Promise<ScrapedLead[]> {
    console.warn('LinkedIn scraping requires careful implementation due to legal and technical restrictions');
    
    // This is a placeholder - actual LinkedIn scraping would require:
    // 1. Authentication
    // 2. Navigation through dynamic content
    // 3. Handling of anti-scraping measures
    
    console.log(`Scraping LinkedIn for query: ${query}`);
    return [];
  }

  /**
   * Scrapes Google search results for potential leads
   */
  async scrapeGoogleBusinessResults(query: string, pages: number = 1): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    try {
      for (let page = 0; page < pages; page++) {
        const start = page * 10;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
        
        const html = await this.fetchPage(searchUrl);
        const $ = cheerio.load(html);
        
        // Extract business results
        $('.g').each((_, element) => {
          try {
            const titleEl = $(element).find('h3');
            if (!titleEl.length) return;
            
            const name = titleEl.text().trim();
            const link = $(element).find('a').attr('href');
            const snippet = $(element).find('.VwiC3b').text().trim();
            
            // Only include if it appears to be a business
            if (name && (snippet.includes('Ltd') || 
                         snippet.includes('Inc') || 
                         snippet.includes('GmbH') ||
                         snippet.includes('business') ||
                         snippet.includes('company'))) {
              leads.push({
                name,
                contactInfo: snippet,
                website: link,
                source: 'Google Search',
                scrapedDate: new Date(),
                metadata: { searchQuery: query }
              });
            }
          } catch (error) {
            console.error('Error parsing Google search result:', error);
          }
        });
        
        // Rate limiting between pages
        if (page < pages - 1) {
          await delay(this.options.delayBetweenRequests * 2);
        }
      }
      
      return leads;
    } catch (error) {
      console.error(`Error scraping Google search results for "${query}":`, error);
      return leads;
    }
  }
} 