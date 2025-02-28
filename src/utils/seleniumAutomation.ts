import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { delay } from './helpers';
import chrome from 'selenium-webdriver/chrome';

interface UnionGrCredentials {
  username: string;
  password: string;
}

interface InvoiceDetails {
  clientName: string;
  clientVat: string;
  clientAddress?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }[];
  invoiceDate?: Date;
  paymentMethod?: string;
  notes?: string;
}

interface InvoiceSearchResult {
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  totalAmount: number;
  status: string;
  id: string;
}

export class UnionAutomation {
  private driver: WebDriver | null = null;
  private isLoggedIn: boolean = false;
  private baseUrl: string = 'https://www.union.gr/';
  
  constructor(private headless: boolean = false) {}
  
  /**
   * Initializes the Selenium WebDriver
   */
  async initialize(): Promise<void> {
    try {
      const options = new Options();
      
      if (this.headless) {
        options.addArguments('--headless');
      }
      
      options.addArguments('--disable-gpu');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--window-size=1920,1080');
      
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
        
      console.log('Selenium WebDriver initialized');
    } catch (error) {
      console.error('Failed to initialize Selenium WebDriver:', error);
      throw new Error(`Selenium initialization error: ${error}`);
    }
  }
  
  /**
   * Logs into the Union.gr platform
   */
  async login(credentials: UnionGrCredentials): Promise<boolean> {
    if (!this.driver) {
      throw new Error('WebDriver not initialized. Call initialize() first.');
    }
    
    try {
      // Navigate to login page
      await this.driver.get(`${this.baseUrl}login`);
      
      // Wait for login form to be visible
      const usernameField = await this.driver.wait(
        until.elementLocated(By.id('username')), 
        10000
      );
      
      // Fill in login credentials
      await usernameField.sendKeys(credentials.username);
      await this.driver.findElement(By.id('password')).sendKeys(credentials.password);
      
      // Submit login form
      await this.driver.findElement(By.css('button[type="submit"]')).click();
      
      // Wait for dashboard to load - this selector might need to be adjusted
      await this.driver.wait(
        until.elementLocated(By.css('.dashboard-container')), 
        15000
      );
      
      this.isLoggedIn = true;
      console.log('Successfully logged into Union.gr');
      return true;
    } catch (error) {
      console.error('Failed to log in to Union.gr:', error);
      return false;
    }
  }
  
  /**
   * Navigates to the invoice creation page
   */
  private async navigateToInvoiceCreation(): Promise<boolean> {
    if (!this.driver || !this.isLoggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }
    
    try {
      // Navigate to invoice creation page - update selectors based on actual website structure
      await this.driver.get(`${this.baseUrl}invoices/new`);
      
      // Wait for the invoice form to load
      await this.driver.wait(
        until.elementLocated(By.css('form#invoiceForm')), 
        10000
      );
      
      return true;
    } catch (error) {
      console.error('Failed to navigate to invoice creation:', error);
      return false;
    }
  }
  
  /**
   * Creates a new invoice with the provided details
   */
  async createInvoice(details: InvoiceDetails): Promise<boolean> {
    if (!this.driver || !this.isLoggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }
    
    try {
      // Navigate to invoice creation page
      const navigated = await this.navigateToInvoiceCreation();
      if (!navigated) return false;
      
      // Fill client information - update selectors based on actual website structure
      await this.driver.findElement(By.id('clientName')).sendKeys(details.clientName);
      await this.driver.findElement(By.id('clientVat')).sendKeys(details.clientVat);
      
      if (details.clientAddress) {
        await this.driver.findElement(By.id('clientAddress')).sendKeys(details.clientAddress);
      }
      
      // Add invoice items
      for (const item of details.items) {
        // Click "Add Item" button
        await this.driver.findElement(By.id('addItemButton')).click();
        
        // Wait for the new item row
        const itemRows = await this.driver.findElements(By.css('.invoice-item-row'));
        const currentRow = itemRows[itemRows.length - 1];
        
        // Fill item details
        await currentRow.findElement(By.css('.item-description')).sendKeys(item.description);
        await currentRow.findElement(By.css('.item-quantity')).sendKeys(item.quantity.toString());
        await currentRow.findElement(By.css('.item-price')).sendKeys(item.unitPrice.toString());
        await currentRow.findElement(By.css('.item-vat')).sendKeys(item.vatRate.toString());
      }
      
      // Set invoice date if provided
      if (details.invoiceDate) {
        const dateString = details.invoiceDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        const dateInput = await this.driver.findElement(By.id('invoiceDate'));
        await this.driver.executeScript(
          `arguments[0].value = '${dateString}';`, 
          dateInput
        );
      }
      
      // Set payment method if provided
      if (details.paymentMethod) {
        const paymentSelect = await this.driver.findElement(By.id('paymentMethod'));
        await paymentSelect.click();
        await this.driver.findElement(By.xpath(`//option[text()='${details.paymentMethod}']`)).click();
      }
      
      // Add notes if provided
      if (details.notes) {
        await this.driver.findElement(By.id('invoiceNotes')).sendKeys(details.notes);
      }
      
      // Submit the form
      await this.driver.findElement(By.id('submitInvoice')).click();
      
      // Wait for success message
      await this.driver.wait(
        until.elementLocated(By.css('.success-message')), 
        20000
      );
      
      console.log('Invoice created successfully');
      return true;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      return false;
    }
  }
  
  /**
   * Searches for an existing invoice
   */
  async searchInvoice(criteria: { invoiceNumber?: string; clientName?: string; dateFrom?: Date; dateTo?: Date }): Promise<InvoiceSearchResult[]> {
    if (!this.driver || !this.isLoggedIn) {
      throw new Error('Not logged in. Call login() first.');
    }
    
    try {
      // Navigate to invoice list page
      await this.driver.get(`${this.baseUrl}invoices/list`);
      
      // Apply search criteria
      if (criteria.invoiceNumber) {
        const invoiceNumberInput = await this.driver.findElement(By.id('invoiceNumber'));
        await invoiceNumberInput.sendKeys(criteria.invoiceNumber);
      }
      
      if (criteria.clientName) {
        const clientNameInput = await this.driver.findElement(By.id('clientName'));
        await clientNameInput.sendKeys(criteria.clientName);
      }
      
      if (criteria.dateFrom) {
        const dateFromInput = await this.driver.findElement(By.id('dateFrom'));
        await dateFromInput.sendKeys(criteria.dateFrom.toISOString().split('T')[0]);
      }
      
      if (criteria.dateTo) {
        const dateToInput = await this.driver.findElement(By.id('dateTo'));
        await dateToInput.sendKeys(criteria.dateTo.toISOString().split('T')[0]);
      }
      
      // Execute search
      const searchButton = await this.driver.findElement(By.css('button[type="submit"]'));
      await searchButton.click();
      
      // Wait for results and extract them
      await this.driver.wait(until.elementLocated(By.css('table.invoice-list')), 5000);
      
      const invoiceRows = await this.driver.findElements(By.css('table.invoice-list tbody tr'));
      const results: InvoiceSearchResult[] = [];
      
      for (const row of invoiceRows) {
        const columns = await row.findElements(By.css('td'));
        if (columns.length >= 5) {
          results.push({
            invoiceNumber: await columns[0].getText(),
            clientName: await columns[1].getText(),
            issueDate: await columns[2].getText(),
            totalAmount: parseFloat((await columns[3].getText()).replace(/[^0-9.]/g, '')),
            status: await columns[4].getText(),
            id: await row.getAttribute('data-id')
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error searching for invoice:', error);
      return [];
    }
  }
  
  /**
   * Closes the WebDriver when done
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
      this.isLoggedIn = false;
      console.log('Selenium WebDriver closed');
    }
  }
} 