import { describe, it, expect, beforeEach } from 'vitest';
import { RAGService } from '../../services/rag-service';
import { InMemoryVectorStore } from '../../stores/in-memory';
import { MockEmbeddingProvider, MockLLMProvider } from '../mocks/providers';

describe('RAGService', () => {
  let service: RAGService;
  let store: InMemoryVectorStore;
  const mockEmbeddingProvider = new MockEmbeddingProvider();
  const mockLLMProvider = new MockLLMProvider();

  beforeEach(() => {
    service = new RAGService(mockLLMProvider);
    store = new InMemoryVectorStore(mockEmbeddingProvider);
  });

  describe('search', () => {
    beforeEach(async () => {
      await store.addDocument('JavaScript is a programming language');
      await store.addDocument('TypeScript adds types to JavaScript');
      await store.addDocument('Python is popular for machine learning');
    });

    it('should search and return results without answer', async () => {
      const result = await service.search(store, 'JavaScript', 2, false);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.answer).toBeNull();
    });

    it('should search and generate answer', async () => {
      const result = await service.search(store, 'What is TypeScript?', 2, true);
      
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(typeof result.answer).toBe('string');
    });

    it('should handle empty results', async () => {
      store.clear();
      const result = await service.search(store, 'test query', 5);
      
      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.message).toContain('No documents found');
    });

    it('should include stats in response', async () => {
      const result = await service.search(store, 'programming', 2);
      
      expect(result.stats).toBeDefined();
      expect(result.stats?.documentCount).toBe(3);
    });
  });

  describe('addDocument', () => {
    it('should add a single document', async () => {
      const result = await service.addDocument(
        store,
        'Test document content',
        { source: 'test' }
      );
      
      expect(result.success).toBe(true);
      expect(result.documentIds).toHaveLength(1);
      expect(result.message).toContain('1 document');
      expect(store.size()).toBe(1);
    });

    it('should add document with chunks', async () => {
      const longContent = Array(1000).fill('word').join(' ');
      const result = await service.addDocument(
        store,
        longContent,
        { source: 'test' },
        true,
        100
      );
      
      expect(result.success).toBe(true);
      expect(result.documentIds.length).toBeGreaterThan(1);
      expect(store.size()).toBeGreaterThan(1);
    });
  });

  describe('bulkAddDocuments', () => {
    it('should add multiple documents', async () => {
      const documents = [
        { content: 'Document 1', metadata: { index: 1 } },
        { content: 'Document 2', metadata: { index: 2 } },
        { content: 'Document 3', metadata: { index: 3 } },
      ];
      
      const result = await service.bulkAddDocuments(store, documents);
      
      expect(result.success).toBe(true);
      expect(result.documentIds).toHaveLength(3);
      expect(store.size()).toBe(3);
    });

    it('should skip empty content', async () => {
      const documents = [
        { content: 'Valid document' },
        { content: '' },
        { content: 'Another valid document' },
      ];
      
      const result = await service.bulkAddDocuments(store, documents);
      
      expect(result.documentIds).toHaveLength(2);
      expect(store.size()).toBe(2);
    });
  });
});