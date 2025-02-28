import axios from 'axios';
import * as cheerio from 'cheerio';
import { delay, extractTextFromHtml, generateId } from './helpers';

interface KnowledgeBaseEntry {
  id: string;
  url: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: Date;
}

interface CrawlOptions {
  maxDepth?: number;
  delayBetweenRequests?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxPages?: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price?: number;
  description?: string;
}

interface Client {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  industry?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact?: string;
  category?: string;
  reliability?: number;
}

export class TzironisKnowledgeBase {
  private entries: KnowledgeBaseEntry[] = [];
  private crawledUrls: Set<string> = new Set();
  private baseUrl: string = 'https://tzironis.gr';
  
  /**
   * Builds the knowledge base by crawling the website
   */
  async buildKnowledgeBase(options: CrawlOptions = {}): Promise<void> {
    const defaultOptions: Required<CrawlOptions> = {
      maxDepth: 3,
      delayBetweenRequests: 1000,
      includePatterns: ['^https?://tzironis\\.gr'],
      excludePatterns: ['\\.pdf$', '\\.zip$', '\\.jpg$', '\\.png$', '\\.gif$'],
      maxPages: 100
    };
    
    const mergedOptions: Required<CrawlOptions> = {
      ...defaultOptions,
      ...options
    };
    
    // Reset data if rebuilding
    this.entries = [];
    this.crawledUrls.clear();
    
    // Start crawling from the homepage
    await this.crawlPage(this.baseUrl, 0, mergedOptions);
    
    console.log(`Knowledge base built with ${this.entries.length} entries`);
  }
  
  /**
   * Crawls a page recursively
   */
  private async crawlPage(url: string, depth: number, options: Required<CrawlOptions>): Promise<void> {
    // Check if we've already crawled this URL or reached the max depth
    if (this.crawledUrls.has(url) || depth > options.maxDepth || this.crawledUrls.size >= options.maxPages) {
      return;
    }
    
    // Mark as crawled
    this.crawledUrls.add(url);
    
    // Check if URL matches include patterns and doesn't match exclude patterns
    const includeRegexes = options.includePatterns.map(pattern => new RegExp(pattern));
    const excludeRegexes = options.excludePatterns.map(pattern => new RegExp(pattern));
    
    const shouldInclude = includeRegexes.some(regex => regex.test(url));
    const shouldExclude = excludeRegexes.some(regex => regex.test(url));
    
    if (!shouldInclude || shouldExclude) {
      return;
    }
    
    try {
      // Delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, options.delayBetweenRequests));
      
      // Fetch the page
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      // Extract page info
      const title = $('title').text().trim();
      const content = this.extractContent($);
      const category = this.extractCategory($, url);
      const tags = this.extractTags($);
      
      // Add to knowledge base
      if (title && content) {
        this.entries.push({
          id: generateId(),
          url,
          title,
          content,
          category,
          tags,
          lastUpdated: new Date()
        });
      }
      
      // Extract links and crawl them
      if (depth < options.maxDepth) {
        const links = this.extractLinks($, url);
        
        for (const link of links) {
          await this.crawlPage(link, depth + 1, options);
          
          if (this.crawledUrls.size >= options.maxPages) {
            break;
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error crawling ${url}:`, errorMessage);
    }
  }
  
  /**
   * Extracts the category from the page
   */
  private extractCategory($: cheerio.CheerioAPI, url: string): string {
    // Try to extract from breadcrumbs
    const breadcrumbs = $('.breadcrumbs').first().text().trim();
    if (breadcrumbs) {
      const parts = breadcrumbs.split(/[>\/]/).map(part => part.trim());
      if (parts.length > 1) {
        return parts[1];
      }
    }
    
    // Try to extract from URL
    const urlParts = url.replace(this.baseUrl, '').split('/').filter(Boolean);
    if (urlParts.length > 0) {
      return urlParts[0];
    }
    
    return 'General';
  }
  
  /**
   * Extracts the main content from the page
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Try to find the main content area
    const mainContent = $('main, .content, .main-content, article, .post-content').first();
    
    if (mainContent.length) {
      // Remove unnecessary elements
      mainContent.find('script, style, nav, footer, header, .comments, .sidebar').remove();
      
      return mainContent.text().trim()
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n');
    }
    
    // Fallback to body content
    const bodyText = $('body').text().trim()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n');
    
    return bodyText;
  }
  
  /**
   * Extracts tags from the page
   */
  private extractTags($: cheerio.CheerioAPI): string[] {
    const tags: string[] = [];
    
    // Look for meta keywords
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      tags.push(...metaKeywords.split(',').map(tag => tag.trim()));
    }
    
    // Look for tag elements
    $('.tags a, .tag, .category a').each((_, element) => {
      const tag = $(element).text().trim();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    
    return tags;
  }
  
  /**
   * Extracts links from the page
   */
  private extractLinks($: cheerio.CheerioAPI, currentUrl: string): string[] {
    const links: string[] = [];
    const baseUrl = new URL(this.baseUrl);
    const currentUrlObj = new URL(currentUrl);
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')?.trim() || '';
      
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return;
      }
      
      try {
        let url: URL;
        
        if (href.startsWith('http')) {
          url = new URL(href);
        } else if (href.startsWith('/')) {
          url = new URL(href, this.baseUrl);
        } else {
          url = new URL(href, currentUrl);
        }
        
        // Only include links to the same domain
        if (url.hostname === baseUrl.hostname && !links.includes(url.href)) {
          links.push(url.href);
        }
      } catch (error) {
        console.error(`Error parsing URL ${href}:`, error);
      }
    });
    
    return links;
  }
  
  /**
   * Searches the knowledge base for the given query
   */
  searchKnowledgeBase(query: string, limit: number = 5): KnowledgeBaseEntry[] {
    if (!query || this.entries.length === 0) {
      return [];
    }
    
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    // Calculate relevance scores for each entry
    const scoredEntries = this.entries.map(entry => {
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      const tagsLower = entry.tags.map(tag => tag.toLowerCase());
      
      let score = 0;
      
      // Score based on title matches
      queryTerms.forEach(term => {
        if (titleLower.includes(term)) {
          score += 10;
        }
        if (tagsLower.some(tag => tag.includes(term))) {
          score += 5;
        }
        if (contentLower.includes(term)) {
          score += 1;
        }
      });
      
      return { entry, score };
    });
    
    // Sort by score (descending) and return top results
    return scoredEntries
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.entry);
  }
  
  /**
   * Gets all products from the knowledge base
   */
  getProducts(): Product[] {
    // In a real app, this would filter entries by product category and process them
    return this.entries
      .filter(entry => entry.category.toLowerCase() === 'products')
      .map(entry => ({
        id: entry.id,
        name: entry.title,
        category: entry.category,
        description: entry.content.substring(0, 200)
      }));
  }
  
  /**
   * Gets all clients from the knowledge base
   */
  getClients(): Client[] {
    // In a real app, this would filter entries by client category and process them
    return this.entries
      .filter(entry => entry.category.toLowerCase() === 'clients')
      .map(entry => ({
        id: entry.id,
        name: entry.title,
        industry: entry.tags[0]
      }));
  }
  
  /**
   * Gets all suppliers from the knowledge base
   */
  getSuppliers(): Supplier[] {
    // In a real app, this would filter entries by supplier category and process them
    return this.entries
      .filter(entry => entry.category.toLowerCase() === 'suppliers')
      .map(entry => ({
        id: entry.id,
        name: entry.title,
        category: entry.tags[0]
      }));
  }
  
  /**
   * Gets all entries in the knowledge base
   */
  getEntries(): KnowledgeBaseEntry[] {
    return [...this.entries];
  }
  
  /**
   * Saves the knowledge base to local storage
   */
  saveToStorage(): void {
    try {
      localStorage.setItem('tzironis_knowledge_base', JSON.stringify(this.entries));
      console.log('Knowledge base saved to storage');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error saving knowledge base to storage:', errorMessage);
    }
  }
  
  /**
   * Loads the knowledge base from local storage
   */
  loadFromStorage(): boolean {
    try {
      const data = localStorage.getItem('tzironis_knowledge_base');
      if (data) {
        this.entries = JSON.parse(data);
        console.log(`Loaded ${this.entries.length} entries from storage`);
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error loading knowledge base from storage:', errorMessage);
    }
    return false;
  }
} 