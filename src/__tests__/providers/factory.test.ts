import { describe, it, expect, beforeEach } from 'vitest';
import { LLMProviderFactory, EmbeddingProviderFactory } from '../../providers/factory';
import { MockLLMProvider, MockEmbeddingProvider } from '../mocks/providers';
import { resetConfig } from '../../config';

describe('Provider Factories', () => {
  beforeEach(() => {
    resetConfig();
  });

  describe('LLMProviderFactory', () => {
    it('should register and create custom providers', () => {
      LLMProviderFactory.register('test-llm', () => new MockLLMProvider());
      const provider = LLMProviderFactory.create('test-llm');
      
      expect(provider).toBeDefined();
      expect((provider as MockLLMProvider).getProviderName()).toBe('mock');
    });

    it('should list available providers', () => {
      LLMProviderFactory.register('custom-llm', () => new MockLLMProvider());
      const providers = LLMProviderFactory.getAvailableProviders();
      
      expect(providers).toContain('custom-llm');
    });

    it('should throw error for unknown provider without model name', () => {
      expect(() => {
        LLMProviderFactory.create('non-existent-provider');
      }).toThrow('Unsupported LLM provider');
    });

    it('should create default provider when no arguments', () => {
      // Set NODE_ENV to test to use mock provider
      process.env.NODE_ENV = 'test';
      resetConfig();
      
      LLMProviderFactory.register('mock', () => new MockLLMProvider());
      const provider = LLMProviderFactory.create();
      
      expect(provider).toBeDefined();
    });
  });

  describe('EmbeddingProviderFactory', () => {
    it('should register and create custom providers', () => {
      EmbeddingProviderFactory.register('test-embed', () => new MockEmbeddingProvider());
      const provider = EmbeddingProviderFactory.create('test-embed');
      
      expect(provider).toBeDefined();
      expect((provider as MockEmbeddingProvider).getProviderName()).toBe('mock');
      expect((provider as MockEmbeddingProvider).getDimensions()).toBe(1536);
    });

    it('should list available providers', () => {
      EmbeddingProviderFactory.register('custom-embed', () => new MockEmbeddingProvider());
      const providers = EmbeddingProviderFactory.getAvailableProviders();
      
      expect(providers).toContain('custom-embed');
    });

    it('should throw error for unknown provider without model name', () => {
      expect(() => {
        EmbeddingProviderFactory.create('non-existent-provider');
      }).toThrow('Unsupported embedding provider');
    });

    it('should create default provider when no arguments', () => {
      // Set NODE_ENV to test to use mock provider
      process.env.NODE_ENV = 'test';
      resetConfig();
      
      EmbeddingProviderFactory.register('mock', () => new MockEmbeddingProvider());
      const provider = EmbeddingProviderFactory.create();
      
      expect(provider).toBeDefined();
    });
  });
});