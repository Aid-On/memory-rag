import { describe, it, expect } from 'vitest';
import {
  VercelAILLMProvider,
  VercelAIEmbeddingProvider,
  registerLanguageModelProvider,
  registerEmbeddingModelProvider,
  getAvailableProviders
} from '../../providers/vercel-ai';

describe('Vercel AI Providers', () => {
  describe('VercelAILLMProvider', () => {
    it('should create provider with default model', () => {
      const provider = new VercelAILLMProvider();
      expect(provider).toBeDefined();
      expect(provider.getProviderName()).toBe('openai');
    });

    it('should create provider with custom model', () => {
      const provider = new VercelAILLMProvider('openai', 'gpt-4');
      expect(provider).toBeDefined();
      expect(provider.getProviderName()).toBe('openai');
    });

    it('should throw error for unregistered provider', () => {
      expect(() => {
        new VercelAILLMProvider('unknown-provider', 'model');
      }).toThrow("Provider 'unknown-provider' is not registered");
    });
  });

  describe('VercelAIEmbeddingProvider', () => {
    it('should create provider with default model', () => {
      const provider = new VercelAIEmbeddingProvider();
      expect(provider).toBeDefined();
      expect(provider.getProviderName()).toBe('openai');
      expect(provider.getDimensions()).toBe(1536);
    });

    it('should create provider with custom model', () => {
      const provider = new VercelAIEmbeddingProvider('openai', 'text-embedding-3-large');
      expect(provider).toBeDefined();
      expect(provider.getDimensions()).toBe(3072);
    });

    it('should throw error for unregistered provider', () => {
      expect(() => {
        new VercelAIEmbeddingProvider('unknown-provider', 'model');
      }).toThrow("Provider 'unknown-provider' is not registered");
    });

    it('should return default dimensions for unknown model', () => {
      const provider = new VercelAIEmbeddingProvider('openai', 'unknown-model');
      expect(provider.getDimensions()).toBe(1536);
    });
  });

  describe('Provider Registration', () => {
    it('should register language model provider', () => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      const mockFactory = (model: string) => ({
        modelId: model,
        provider: 'test',
        specificationVersion: 'v1'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      registerLanguageModelProvider('test-llm', mockFactory as any);
      
      const providers = getAvailableProviders();
      expect(providers.llm).toContain('test-llm');
    });

    it('should register embedding model provider', () => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      const mockFactory = (model: string) => ({
        modelId: model,
        provider: 'test',
        specificationVersion: 'v1'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      registerEmbeddingModelProvider('test-embed', mockFactory as any);
      
      const providers = getAvailableProviders();
      expect(providers.embedding).toContain('test-embed');
    });

    it('should get available providers', () => {
      const providers = getAvailableProviders();
      
      expect(providers).toBeDefined();
      expect(providers.llm).toContain('openai');
      expect(providers.embedding).toContain('openai');
    });
  });
});