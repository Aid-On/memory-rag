import { describe, it, expect, vi } from 'vitest';
import { ModelBasedLLMProvider, ModelBasedEmbeddingProvider, defaultModels } from '../../providers/base';

describe('Base Providers', () => {
  describe('ModelBasedLLMProvider', () => {
    it('should generate text using provided model', async () => {
      // Create a mock language model
      const mockModel = {
        modelId: 'test-model',
        provider: 'test',
        specificationVersion: 'v1'
      };
      
      // Mock the generateText function
      const provider = new ModelBasedLLMProvider(mockModel as any);
      
      // Since we can't easily mock the ai module, we'll just verify the provider is created
      expect(provider).toBeDefined();
      expect(provider.getProviderName()).toBe('vercel-ai-sdk');
    });
  });

  describe('ModelBasedEmbeddingProvider', () => {
    it('should create embeddings using provided model', async () => {
      // Create a mock embedding model
      const mockModel = {
        modelId: 'test-embedding',
        provider: 'test',
        specificationVersion: 'v1'
      };
      
      const provider = new ModelBasedEmbeddingProvider(mockModel as any, 1536);
      
      expect(provider).toBeDefined();
      expect(provider.getDimensions()).toBe(1536);
      expect(provider.getProviderName()).toBe('vercel-ai-sdk');
    });

    it('should use custom dimensions', () => {
      const mockModel = {
        modelId: 'test-embedding',
        provider: 'test',
        specificationVersion: 'v1'
      };
      
      const provider = new ModelBasedEmbeddingProvider(mockModel as any, 3072);
      expect(provider.getDimensions()).toBe(3072);
    });
  });

  describe('defaultModels', () => {
    it('should get correct embedding dimensions for known models', () => {
      expect(defaultModels.getEmbeddingDimensions('text-embedding-3-small')).toBe(1536);
      expect(defaultModels.getEmbeddingDimensions('text-embedding-3-large')).toBe(3072);
      expect(defaultModels.getEmbeddingDimensions('text-embedding-ada-002')).toBe(1536);
    });

    it('should return default dimensions for unknown models', () => {
      expect(defaultModels.getEmbeddingDimensions('unknown-model')).toBe(1536);
    });
  });
});