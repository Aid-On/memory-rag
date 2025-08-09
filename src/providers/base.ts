import { generateText, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { LLMProvider, EmbeddingProvider } from '../types';

/**
 * Generic LLM Provider that works with any Vercel AI SDK language model
 */
export class ModelBasedLLMProvider implements LLMProvider {
  constructor(private model: LanguageModel) {}

  async generateText(params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const result = await generateText({
      model: this.model,
      messages: params.messages,
      temperature: params.temperature,
    });

    return result.text;
  }

  getProviderName(): string {
    return 'vercel-ai-sdk';
  }
}

/**
 * Generic Embedding Provider that works with any Vercel AI SDK embedding model
 */
export class ModelBasedEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private model: EmbeddingModel<string>,
    private dimensions: number = 1536
  ) {}

  async createEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: this.model,
      value: text,
    });
    return embedding;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getProviderName(): string {
    return 'vercel-ai-sdk';
  }
}

/**
 * Helper to create default models
 */
export const defaultModels = {
  llm: (modelName: string = 'gpt-4o-mini'): LanguageModel => {
    return openai(modelName);
  },
  embedding: (modelName: string = 'text-embedding-3-small'): EmbeddingModel<string> => {
    return openai.embedding(modelName);
  },
  getEmbeddingDimensions: (modelName: string): number => {
    const dimensions: Record<string, number> = {
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'text-embedding-ada-002': 1536,
    };
    return dimensions[modelName] || 1536;
  }
};