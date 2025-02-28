/**
 * Helper utility functions for the Tzironis Business Suite
 */

/**
 * Delays execution for specified milliseconds
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Parses a possible number from a string, handling currency and formatting
 * @param value String potentially containing a number
 * @returns Parsed number or null if invalid
 */
export const parseNumber = (value: string): number | null => {
  if (!value) return null;
  
  // Remove currency symbols, commas, spaces, and other non-numeric characters
  // except decimal point and minus sign
  const cleaned = value.replace(/[^0-9.-]/g, '');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Generates a unique ID for elements
 * @returns Unique string ID
 */
export const generateId = (): string => {
  return `id-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Safely extracts text content from an HTML string
 * @param html HTML string to extract text from
 * @returns Plain text content
 */
export const extractTextFromHtml = (html: string): string => {
  if (!html) return '';
  
  // Create a temporary element to parse HTML safely
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

/**
 * Groups array items by a key
 * @param array Array to group
 * @param keyGetter Function to extract the key for grouping
 * @returns Map with grouped items
 */
export function groupBy<T, K extends PropertyKey>(array: T[], keyGetter: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  
  array.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  
  return map;
}

/**
 * Formats a date according to locale preferences
 * @param date Date to format
 * @param locale Locale string (defaults to el-GR for Greek)
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, locale: string = 'el-GR'): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Creates a debounced function that delays invoking func
 * until after wait milliseconds have elapsed since the last time it was invoked
 */
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
} 