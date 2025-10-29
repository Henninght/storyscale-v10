import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
}

export interface SimilarPost {
  id: string;
  score: number; // 0-100 percentage
  preview: string;
  content: string;
}

/**
 * Generate text embedding using OpenAI text-embedding-3-small model
 * Cost: ~$0.00002 per 1K tokens (~$0.0001 per post)
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;

    return {
      embedding,
      dimensions: embedding.length,
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Convert similarity score (0-1) to percentage (0-100)
 */
export function similarityToPercentage(similarity: number): number {
  return Math.round(similarity * 100);
}

/**
 * Find similar posts by comparing embeddings
 * Returns top N most similar posts with similarity scores
 */
export function findSimilarPosts(
  newEmbedding: number[],
  existingPosts: Array<{ id: string; content: string; embedding?: number[] }>,
  topN: number = 3
): SimilarPost[] {
  const similarities: SimilarPost[] = [];

  for (const post of existingPosts) {
    // Skip posts without embeddings
    if (!post.embedding || post.embedding.length === 0) {
      continue;
    }

    try {
      const similarity = cosineSimilarity(newEmbedding, post.embedding);
      const score = similarityToPercentage(similarity);

      // Only include posts with >50% similarity
      if (score > 50) {
        similarities.push({
          id: post.id,
          score,
          preview: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          content: post.content,
        });
      }
    } catch (error) {
      console.error(`Error calculating similarity for post ${post.id}:`, error);
      // Continue with next post
    }
  }

  // Sort by score descending and return top N
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Extract key topics/keywords from content (simple implementation)
 * This can be enhanced with NLP libraries later
 */
export function extractTopics(content: string): string[] {
  // Remove emojis, special characters, and normalize text
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
  ]);

  // Split into words and filter
  const words = normalized.split(' ');
  const wordFreq = new Map<string, number>();

  for (const word of words) {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }

  // Get top 10 most frequent words
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Check if content should be regenerated due to high similarity
 */
export function shouldRegenerateContent(similarPosts: SimilarPost[]): boolean {
  // Regenerate if any post has >85% similarity
  return similarPosts.some(post => post.score > 85);
}

/**
 * Get the highest similarity score from similar posts
 */
export function getHighestSimilarity(similarPosts: SimilarPost[]): number {
  if (similarPosts.length === 0) return 0;
  return Math.max(...similarPosts.map(post => post.score));
}
