import { generateText, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { LLMProvider, EmbeddingProvider } from '../types';

/**
 * Provider registry for language models
 */
const languageModelRegistry: Record<string, (model: string) => LanguageModel> = {
  'openai': (model: string) => openai(model),
};

/**
 * Provider registry for embedding models
 */
const embeddingModelRegistry: Record<string, (model: string) => EmbeddingModel<string>> = {
  'openai': (model: string) => openai.embedding(model),
};

/**
 * Vercel AI SDK-based LLM Provider
 */
export class VercelAILLMProvider implements LLMProvider {
  private model: LanguageModel;
  private providerName: string;
  
  constructor(provider: string = 'openai', modelName: string = 'gpt-4o-mini') {
    const modelFactory = languageModelRegistry[provider];
    if (!modelFactory) {
      throw new Error(`Provider '${provider}' is not registered. Available providers: ${Object.keys(languageModelRegistry).join(', ')}`);
    }
    this.model = modelFactory(modelName);
    this.providerName = provider;
  }

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
    return this.providerName;
  }
}

/**
 * Vercel AI SDK-based Embedding Provider
 */
export class VercelAIEmbeddingProvider implements EmbeddingProvider {
  private model: EmbeddingModel<string>;
  private providerName: string;
  private dimensions: number;
  
  constructor(provider: string = 'openai', modelName: string = 'text-embedding-3-small') {
    const modelFactory = embeddingModelRegistry[provider];
    if (!modelFactory) {
      throw new Error(`Provider '${provider}' is not registered. Available providers: ${Object.keys(embeddingModelRegistry).join(', ')}`);
    }
    this.model = modelFactory(modelName);
    this.providerName = provider;
    this.dimensions = this.getModelDimensions(provider, modelName);
  }

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
    return this.providerName;
  }
  
  private getModelDimensions(provider: string, model: string): number {
    const dimensions: Record<string, Record<string, number>> = {
      'openai': {
        'text-embedding-3-small': 1536,
        'text-embedding-3-large': 3072,
        'text-embedding-ada-002': 1536,
      },
    };
    
    return dimensions[provider]?.[model] || 1536;
  }
}

/**
 * Register a new language model provider
 */
export function registerLanguageModelProvider(
  name: string, 
  factory: (model: string) => LanguageModel
): void {
  languageModelRegistry[name] = factory;
}

/**
 * Register a new embedding model provider
 */
export function registerEmbeddingModelProvider(
  name: string,
  factory: (model: string) => EmbeddingModel<string>
): void {
  embeddingModelRegistry[name] = factory;
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): {
  llm: string[];
  embedding: string[];
} {
  return {
    llm: Object.keys(languageModelRegistry),
    embedding: Object.keys(embeddingModelRegistry),
  };
}