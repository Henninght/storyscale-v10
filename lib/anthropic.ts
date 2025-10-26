import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// Lazy initialization to avoid build-time errors
let _anthropic: Anthropic | null = null;

export const anthropic = new Proxy({} as Anthropic, {
  get(target, prop) {
    if (!_anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not set");
      }
      _anthropic = new Anthropic({
        apiKey,
        maxRetries: 2,
        timeout: 60000, // 60 seconds
      });
    }
    return (_anthropic as any)[prop];
  }
});
