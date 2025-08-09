import { describe, it, expect, beforeAll } from 'vitest';
import { 
  createInMemoryRAG, 
  createSimpleRAG,
  resetConfig
} from '../index';
import { EmbeddingProviderFactory, LLMProviderFactory } from '../providers/factory';
import { MockEmbeddingProvider, MockLLMProvider } from './mocks/providers';

describe('Factory Functions', () => {
  beforeAll(() => {
    // Register mock providers for testing
    EmbeddingProviderFactory.register('mock', () => new MockEmbeddingProvider());
    LLMProviderFactory.register('mock', () => new MockLLMProvider());
  });

  describe('createInMemoryRAG', () => {
    it('should create a RAG instance with default settings', () => {
      const rag = createInMemoryRAG({
        llmProvider: 'mock',
        embeddingProvider: 'mock'
      });
      
      expect(rag.store).toBeDefined();
      expect(rag.service).toBeDefined();
      expect(rag.addDocument).toBeDefined();
      expect(rag.search).toBeDefined();
      expect(rag.clear).toBeDefined();
      expect(rag.stats).toBeDefined();
    });

    it('should allow adding and searching documents', async () => {
      const rag = createInMemoryRAG({
        llmProvider: 'mock',
        embeddingProvider: 'mock'
      });
      
      await rag.addDocument('Test document about TypeScript');
      await rag.addDocument('Another document about JavaScript');
      
      const results = await rag.search('TypeScript', 2);
      
      expect(results.success).toBe(true);
      expect(results.results).toBeDefined();
      expect(results.results!.length).toBeGreaterThan(0);
    });

    it('should apply custom configuration', () => {
      const rag = createInMemoryRAG({
        llmProvider: 'mock',
        embeddingProvider: 'mock',
        config: {
          search: {
            defaultTopK: 10,
            minScore: 0.8
          }
        }
      });
      
      expect(rag).toBeDefined();
      resetConfig(); // Clean up
    });

    it('should clear documents', async () => {
      const rag = createInMemoryRAG({
        llmProvider: 'mock',
        embeddingProvider: 'mock'
      });
      
      await rag.addDocument('Document 1');
      await rag.addDocument('Document 2');
      
      expect(rag.stats().documentCount).toBe(2);
      
      rag.clear();
      
      expect(rag.stats().documentCount).toBe(0);
    });

    it('should provide statistics', async () => {
      const rag = createInMemoryRAG({
        llmProvider: 'mock',
        embeddingProvider: 'mock'
      });
      
      await rag.addDocument('Test document');
      
      const stats = rag.stats();
      
      expect(stats.documentCount).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.newestDocument).toBeInstanceOf(Date);
    });
  });

  describe('createSimpleRAG', () => {
    it('should create a RAG instance with defaults', () => {
      // Set NODE_ENV to test to use mock providers
      process.env.NODE_ENV = 'test';
      resetConfig(); // Reset config to pick up new environment
      
      const rag = createSimpleRAG();
      
      expect(rag.store).toBeDefined();
      expect(rag.service).toBeDefined();
      expect(rag.addDocument).toBeDefined();
      expect(rag.search).toBeDefined();
    });

    it('should work the same as createInMemoryRAG with no options', async () => {
      // Set NODE_ENV to test to use mock providers
      process.env.NODE_ENV = 'test';
      resetConfig(); // Reset config to pick up new environment
      
      const rag1 = createSimpleRAG();
      const rag2 = createInMemoryRAG({
        llmProvider: 'mock',
        embeddingProvider: 'mock'
      });
      
      await rag1.addDocument('Test');
      await rag2.addDocument('Test');
      
      expect(rag1.stats().documentCount).toBe(1);
      expect(rag2.stats().documentCount).toBe(1);
    });
  });
});