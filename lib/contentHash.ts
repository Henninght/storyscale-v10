import crypto from 'crypto';

export interface HashableContent {
  input: string;
  settings: {
    tone: string;
    style: string;
    length: string;
    language: string;
    purpose: string;
    audience: string;
    emojiUsage: string;
    includeCTA: boolean;
    customInstructions?: string;
  };
  referenceContent: Array<{ url: string; content?: string; error?: string }>;
}

/**
 * Server-side hash function using Node.js crypto module
 * Creates a deterministic SHA-256 hash of content and settings
 */
export function getContentHash(data: HashableContent): string {
  // Create deterministic string representation with sorted keys
  const normalized = JSON.stringify(
    {
      input: data.input.trim(),
      settings: {
        tone: data.settings.tone,
        style: data.settings.style,
        length: data.settings.length,
        language: data.settings.language,
        purpose: data.settings.purpose,
        audience: data.settings.audience,
        emojiUsage: data.settings.emojiUsage,
        includeCTA: data.settings.includeCTA,
        customInstructions: data.settings.customInstructions?.trim() || '',
      },
      // Use first 1000 chars of content to avoid huge hashes
      referenceContent: data.referenceContent.map(r => ({
        url: r.url,
        content: r.content?.substring(0, 1000) || '',
        error: r.error,
      })),
    },
    Object.keys({}).sort() // Sort keys for determinism
  );

  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Client-side hash function using Web Crypto API
 * Creates a deterministic SHA-256 hash of content and settings
 */
export async function getContentHashClient(data: HashableContent): Promise<string> {
  // Create deterministic string representation with sorted keys
  const normalized = JSON.stringify(
    {
      input: data.input.trim(),
      settings: {
        tone: data.settings.tone,
        style: data.settings.style,
        length: data.settings.length,
        language: data.settings.language,
        purpose: data.settings.purpose,
        audience: data.settings.audience,
        emojiUsage: data.settings.emojiUsage,
        includeCTA: data.settings.includeCTA,
        customInstructions: data.settings.customInstructions?.trim() || '',
      },
      // Use first 1000 chars of content to avoid huge hashes
      referenceContent: data.referenceContent.map(r => ({
        url: r.url,
        content: r.content?.substring(0, 1000) || '',
        error: r.error,
      })),
    },
    Object.keys({}).sort() // Sort keys for determinism
  );

  // Use globalThis.crypto to ensure we get the Web Crypto API, not Node.js crypto
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
