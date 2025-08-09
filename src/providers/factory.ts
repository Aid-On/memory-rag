import { getConfig } from '../config';
import { VercelAILLMProvider, VercelAIEmbeddingProvider } from './vercel-ai';
import type { LLMProvider, EmbeddingProvider } from '../types';

export class LLMProviderFactory {
  private static providers: Map<string, () => LLMProvider> = new Map();
  
  static {
    // Register default providers
    LLMProviderFactory.register('vercel-ai', () => {
      const config = getConfig();
      const providerConfig = config.providers['vercel-ai'];
      return new VercelAILLMProvider('openai', providerConfig?.model || 'gpt-4o-mini');
    });
    
    // Alias for backward compatibility
    LLMProviderFactory.register('openai', () => {
      return new VercelAILLMProvider('openai', 'gpt-4o-mini');
    });
  }
  
  static register(name: string, factory: () => LLMProvider): void {
    LLMProviderFactory.providers.set(name, factory);
  }
  
  static create(provider?: string, modelName?: string): LLMProvider {
    const config = getConfig();
    const providerName = provider || config.defaultProvider.llm;
    
    const factory = LLMProviderFactory.providers.get(providerName);
    if (!factory) {
      // Fallback to Vercel AI provider with custom model
      if (modelName) {
        return new VercelAILLMProvider('openai', modelName);
      }
      throw new Error(`Unsupported LLM provider: ${providerName}. Available: ${Array.from(LLMProviderFactory.providers.keys()).join(', ')}`);
    }
    
    return factory();
  }
  
  static getAvailableProviders(): string[] {
    return Array.from(LLMProviderFactory.providers.keys());
  }
}

export class EmbeddingProviderFactory {
  private static providers: Map<string, () => EmbeddingProvider> = new Map();
  
  static {
    // Register default providers
    EmbeddingProviderFactory.register('vercel-ai', () => {
      const config = getConfig();
      const providerConfig = config.providers['vercel-ai'];
      return new VercelAIEmbeddingProvider('openai', providerConfig?.embeddingModel || 'text-embedding-3-small');
    });
    
    // Alias for backward compatibility
    EmbeddingProviderFactory.register('openai', () => {
      return new VercelAIEmbeddingProvider('openai', 'text-embedding-3-small');
    });
  }
  
  static register(name: string, factory: () => EmbeddingProvider): void {
    EmbeddingProviderFactory.providers.set(name, factory);
  }
  
  static create(provider?: string, modelName?: string): EmbeddingProvider {
    const config = getConfig();
    const providerName = provider || config.defaultProvider.embedding;
    
    const factory = EmbeddingProviderFactory.providers.get(providerName);
    if (!factory) {
      // Fallback to Vercel AI provider with custom model
      if (modelName) {
        return new VercelAIEmbeddingProvider('openai', modelName);
      }
      throw new Error(`Unsupported embedding provider: ${providerName}. Available: ${Array.from(EmbeddingProviderFactory.providers.keys()).join(', ')}`);
    }
    
    return factory();
  }
  
  static getAvailableProviders(): string[] {
    return Array.from(EmbeddingProviderFactory.providers.keys());
  }
}