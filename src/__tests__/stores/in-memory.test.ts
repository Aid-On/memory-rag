import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryVectorStore } from '../../stores/in-memory';
import { MockEmbeddingProvider } from '../mocks/providers';

describe('InMemoryVectorStore', () => {
  let store: InMemoryVectorStore;
  const mockProvider = new MockEmbeddingProvider();

  beforeEach(() => {
    store = new InMemoryVectorStore(mockProvider);
  });

  describe('addDocument', () => {
    it('should add a document and return an ID', async () => {
      const content = 'This is a test document';
      const id = await store.addDocument(content);
      
      expect(id).toBeDefined();
      expect(id).toMatch(/^doc_/);
      expect(store.size()).toBe(1);
    });

    it('should add a document with metadata', async () => {
      const content = 'Test document with metadata';
      const metadata = { source: 'test', topic: 'testing' };
      const id = await store.addDocument(content, metadata);
      
      expect(id).toBeDefined();
      expect(store.hasDocument(id)).toBe(true);
    });

    it('should handle multiple documents', async () => {
      await store.addDocument('Document 1');
      await store.addDocument('Document 2');
      await store.addDocument('Document 3');
      
      expect(store.size()).toBe(3);
    });
  });

  describe('removeDocument', () => {
    it('should remove an existing document', async () => {
      const id = await store.addDocument('Test document');
      const removed = await store.removeDocument(id);
      
      expect(removed).toBe(true);
      expect(store.size()).toBe(0);
      expect(store.hasDocument(id)).toBe(false);
    });

    it('should return false for non-existent document', async () => {
      const removed = await store.removeDocument('non-existent-id');
      expect(removed).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await store.addDocument('The quick brown fox jumps over the lazy dog');
      await store.addDocument('Machine learning is a subset of artificial intelligence');
      await store.addDocument('TypeScript is a typed superset of JavaScript');
    });

    it('should find relevant documents', async () => {
      const results = await store.search('artificial intelligence', 2);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.score).toBeGreaterThan(0);
      expect(results[0]?.content).toBeDefined();
    });

    it('should respect topK parameter', async () => {
      const results = await store.search('programming', 1);
      expect(results).toHaveLength(1);
    });

    it('should return empty array for empty store', async () => {
      store.clear();
      const results = await store.search('test query');
      expect(results).toEqual([]);
    });

    it('should rank results by similarity', async () => {
      const results = await store.search('TypeScript JavaScript', 3);
      
      expect(results[0]?.content).toContain('TypeScript');
      expect(results[0]?.score).toBeGreaterThan(results[1]?.score || 0);
    });
  });

  describe('clear', () => {
    it('should remove all documents', async () => {
      await store.addDocument('Document 1');
      await store.addDocument('Document 2');
      
      store.clear();
      
      expect(store.size()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct stats for empty store', () => {
      const stats = store.getStats();
      
      expect(stats.documentCount).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.oldestDocument).toBeNull();
      expect(stats.newestDocument).toBeNull();
    });

    it('should return correct stats with documents', async () => {
      await store.addDocument('First document');
      await new Promise(resolve => setTimeout(resolve, 10));
      await store.addDocument('Second document');
      
      const stats = store.getStats();
      
      expect(stats.documentCount).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestDocument).toBeInstanceOf(Date);
      expect(stats.newestDocument).toBeInstanceOf(Date);
      expect(stats.newestDocument!.getTime()).toBeGreaterThanOrEqual(stats.oldestDocument!.getTime());
    });
  });

  describe('getProviderInfo', () => {
    it('should return provider information', () => {
      const info = store.getProviderInfo();
      
      expect(info.name).toBeDefined();
      expect(info.dimensions).toBeGreaterThan(0);
    });
  });
});