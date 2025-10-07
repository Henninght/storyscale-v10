import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

// For Vercel Edge/Serverless compatibility
export const anthropic = new Anthropic({
  apiKey,
  maxRetries: 2,
  timeout: 60000, // 60 seconds
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
