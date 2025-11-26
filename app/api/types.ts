// This file defines the TypeScript types for our translation API
// Having shared types ensures consistency across all API routes

export interface TranslationRequest {
  text: string;           // The text to translate
  sourceLang: string;     // Source language code (e.g., "en", "es")
  targetLang: string;     // Target language code
  isJson?: boolean;       // Optional: is this JSON data?
}

export interface TranslationResponse {
  translatedText: string; // The translated result
  provider: string;       // Which AI provider was used (openai/anthropic)
  model: string;          // Which specific model was used
}

export interface ErrorResponse {
  error: string;          // Error message
  details?: string;       // Optional additional details
}