import * as cheerio from 'cheerio';

export interface ScrapingResult {
  title?: string;
  content: string;
  data?: any[];
  timestamp: string;
  url: string;
  success: boolean;
  error?: string;
}

export class WebScraperService {
  /**
   * Scrapes content from a target URL
   */
  async scrapeUrl(url: string, selector?: string): Promise<ScrapingResult> {
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }
      
      console.log(`Scraping content from: ${url} ${selector ? `with selector: ${selector}` : ''}`);
      
      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Get page title
      const title = $('title').text().trim();
      
      // Extract content based on selector or default to body text
      let content: string;
      let data: any[] = [];
      
      if (selector) {
        const elements = $(selector);
        
        // If it looks like a table, parse it as structured data
        if (selector.includes('table') || elements.is('table')) {
          data = this.parseTable($, selector);
          content = `Extracted ${data.length} rows of data from table`;
        } else {
          // Extract text from all matching elements
          content = elements.map((_, el) => $(el).text().trim()).get().join('\n\n');
          if (!content) content = `No content found with selector: ${selector}`;
        }
      } else {
        // Extract all paragraph text if no selector provided
        content = $('p').map((_, el) => $(el).text().trim()).get().join('\n\n');
        if (!content) content = $('body').text().trim();
      }
      
      return {
        title,
        content: content.substring(0, 5000), // Limit content length
        data: data.length > 0 ? data : undefined,
        timestamp: new Date().toISOString(),
        url,
        success: true
      };
    } catch (error) {
      console.error('Scraping error:', error);
      
      return {
        content: '',
        timestamp: new Date().toISOString(),
        url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during scraping'
      };
    }
  }
  
  /**
   * Parse a table into structured data
   */
  private parseTable($: cheerio.CheerioAPI, selector: string): any[] {
    const results: any[] = [];
    const table = $(selector).first();
    
    // Extract headers
    const headers: string[] = [];
    table.find('thead th, tr:first-child th').each((_, el) => {
      headers.push($(el).text().trim());
    });
    
    // If no headers found in thead or first row of th, try first row of table
    if (headers.length === 0) {
      table.find('tr:first-child td').each((_, el) => {
        headers.push($(el).text().trim());
      });
    }
    
    // Generate default headers if none found
    if (headers.length === 0) {
      const columnCount = table.find('tr:first-child td').length;
      for (let i = 0; i < columnCount; i++) {
        headers.push(`Column ${i+1}`);
      }
    }
    
    // Extract rows (skip first row if it was used for headers)
    const skipFirstRow = table.find('thead').length === 0;
    const rows = table.find('tr');
    
    rows.each((rowIndex, row) => {
      // Skip header row if necessary
      if (skipFirstRow && rowIndex === 0) return;
      
      const rowData: Record<string, string> = {};
      $(row).find('td').each((colIndex, col) => {
        if (colIndex < headers.length) {
          rowData[headers[colIndex]] = $(col).text().trim();
        }
      });
      
      // Only add row if it has data
      if (Object.keys(rowData).length > 0) {
        results.push(rowData);
      }
    });
    
    return results;
  }
  
  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
} 