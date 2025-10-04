import * as cheerio from 'cheerio';

interface FetchResult {
  url: string;
  content: string;
  error?: string;
}

/**
 * Fetches and extracts text content from a URL
 * @param url - The URL to fetch
 * @param maxLength - Maximum characters to extract (default: 3000)
 * @param timeoutMs - Request timeout in milliseconds (default: 5000)
 * @returns Extracted text content or error message
 */
export async function fetchUrlContent(
  url: string,
  maxLength: number = 3000,
  timeoutMs: number = 5000
): Promise<FetchResult> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { url, content: '', error: 'Invalid URL protocol' };
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Storyscale/1.0)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        url,
        content: '',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Parse HTML and extract text
    const $ = cheerio.load(html);

    // Remove script, style, nav, footer, and other non-content elements
    $('script, style, nav, footer, header, iframe, noscript').remove();

    // Try to find main content areas (common patterns)
    let content = '';
    const mainSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.content',
      'body',
    ];

    for (const selector of mainSelectors) {
      const element = $(selector).first();
      if (element.length) {
        content = element.text();
        break;
      }
    }

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove excessive line breaks
      .trim();

    // Limit length
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }

    if (!content || content.length < 50) {
      return {
        url,
        content: '',
        error: 'Could not extract meaningful content from page',
      };
    }

    return { url, content };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { url, content: '', error: 'Request timeout' };
      }
      return { url, content: '', error: error.message };
    }
    return { url, content: '', error: 'Unknown error occurred' };
  }
}

/**
 * Fetches content from multiple URLs in parallel
 * @param urls - Array of URLs to fetch
 * @param maxLength - Maximum characters per URL
 * @returns Array of fetch results
 */
export async function fetchMultipleUrls(
  urls: string[],
  maxLength: number = 3000
): Promise<FetchResult[]> {
  const validUrls = urls.filter((url) => url && url.trim());

  if (validUrls.length === 0) {
    return [];
  }

  // Fetch all URLs in parallel
  const results = await Promise.all(
    validUrls.map((url) => fetchUrlContent(url.trim(), maxLength))
  );

  return results;
}
