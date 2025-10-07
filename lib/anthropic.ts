import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

export const anthropic = new Anthropic({
  apiKey,
  // Force use of native fetch to avoid gRPC issues on Vercel
  dangerouslyAllowBrowser: false,
  fetch: globalThis.fetch ? globalThis.fetch.bind(globalThis) : undefined,
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
