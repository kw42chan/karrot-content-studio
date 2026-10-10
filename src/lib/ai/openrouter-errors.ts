/** User-safe OpenRouter failure messages; raw provider bodies stay server-side only. */

export function userMessageForOpenRouterStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "AI service authentication failed. Check OPENROUTER_API_KEY on the server.";
  }
  if (status === 404) {
    return "The configured AI model is unavailable. Update OPENROUTER_MODEL or use the app default.";
  }
  if (status === 429) {
    return "AI service rate limit reached. Wait a moment and try again.";
  }
  if (status >= 500) {
    return "AI service is temporarily unavailable. Try again in a few minutes.";
  }
  return "AI request failed. Try again or check server logs.";
}

export function logOpenRouterFailure(context: string, status: number, body: string): void {
  console.error(`[OpenRouter] ${context} HTTP ${status}`, body.slice(0, 4000));
}

export class OpenRouterRequestError extends Error {
  readonly status: number;

  constructor(context: string, status: number, body: string) {
    logOpenRouterFailure(context, status, body);
    super(userMessageForOpenRouterStatus(status));
    this.name = "OpenRouterRequestError";
    this.status = status;
  }
}
