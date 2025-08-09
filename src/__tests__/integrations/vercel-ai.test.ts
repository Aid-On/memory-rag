import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  createRAGTool,
  createRAGContext,
  addDocumentToRAG,
  bulkAddDocumentsToRAG,
  clearRAGSession,
  searchRAG
} from '../../integrations/vercel-ai';
import { EmbeddingProviderFactory } from '../../providers/factory';
import { MockEmbeddingProvider } from '../mocks/providers';
import { clearAllSessions } from '../../services/store-manager';

describe('Vercel AI Integration', () => {
  beforeAll(() => {
    // Register mock provider for testing
    EmbeddingProviderFactory.register('mock', () => new MockEmbeddingProvider());
    // Set environment to use mock provider
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    // Clear all sessions before each test
    clearAllSessions();
  });

  describe('createRAGTool', () => {
    it('should create a RAG tool', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const tool = createRAGTool('test-session');
      expect(tool).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(tool.description).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(tool.inputSchema).toBeDefined();
    });
  });

  describe('createRAGContext', () => {
    it('should return empty string when no results', async () => {
      const context = await createRAGContext('test query', 'empty-session', 3);
      expect(context).toBe('');
    });

    it('should create context from search results', async () => {
      const { getStore } = await import('../../services/store-manager');
      const store = getStore('context-session', new MockEmbeddingProvider());
      await store.addDocument('Test document content', { source: 'test' });
      
      const context = await createRAGContext('test', 'context-session', 1);
      expect(context).toContain('Source 1');
      expect(context).toContain('Test document content');
    });
  });

  describe('addDocumentToRAG', () => {
    it('should add a document to the RAG store', async () => {
      const { getStore } = await import('../../services/store-manager');
      // Pre-create the store with mock provider
      getStore('add-session', new MockEmbeddingProvider());
      
      const id = await addDocumentToRAG(
        'This is a test document',
        { type: 'test' },
        'add-session'
      );
      expect(id).toBeDefined();
      expect(id).toMatch(/^doc_/);
    });

    it('should add document to global store by default', async () => {
      const { getStore } = await import('../../services/store-manager');
      // Pre-create the global store with mock provider
      getStore('global', new MockEmbeddingProvider());
      
      const id = await addDocumentToRAG('Global document');
      expect(id).toBeDefined();
    });
  });

  describe('bulkAddDocumentsToRAG', () => {
    it('should add multiple documents', async () => {
      const { getStore } = await import('../../services/store-manager');
      // Pre-create the store with mock provider
      getStore('bulk-session', new MockEmbeddingProvider());
      
      const documents = [
        { content: 'Document 1', metadata: { index: 1 } },
        { content: 'Document 2', metadata: { index: 2 } },
        { content: 'Document 3', metadata: { index: 3 } }
      ];
      
      const ids = await bulkAddDocumentsToRAG(documents, 'bulk-session');
      expect(ids).toHaveLength(3);
      ids.forEach(id => expect(id).toMatch(/^doc_/));
    });

    it('should work with global store', async () => {
      const { getStore } = await import('../../services/store-manager');
      // Pre-create the global store with mock provider
      getStore('global', new MockEmbeddingProvider());
      
      const documents = [
        { content: 'Global doc 1' },
        { content: 'Global doc 2' }
      ];
      
      const ids = await bulkAddDocumentsToRAG(documents);
      expect(ids).toHaveLength(2);
    });
  });

  describe('clearRAGSession', () => {
    it('should clear a specific session', async () => {
      const { getStore } = await import('../../services/store-manager');
      const store = getStore('clear-session', new MockEmbeddingProvider());
      
      // Add documents first
      await store.addDocument('To be cleared', {});
      
      // Clear the session
      clearRAGSession('clear-session');
      
      // Search should return empty
      const results = await searchRAG('cleared', 'clear-session');
      expect(results).toHaveLength(0);
    });

    it('should clear global store', () => {
      // This should not throw
      expect(() => clearRAGSession()).not.toThrow();
    });
  });

  describe('searchRAG', () => {
    it('should search documents in a session', async () => {
      const { getStore } = await import('../../services/store-manager');
      const store = getStore('search-session', new MockEmbeddingProvider());
      
      // Add test documents
      await store.addDocument('JavaScript is a programming language', {});
      await store.addDocument('TypeScript adds types to JavaScript', {});
      
      const results = await searchRAG('JavaScript', 'search-session', 2);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.content).toBeDefined();
      expect(results[0]?.score).toBeDefined();
    });

    it('should respect topK parameter', async () => {
      const { getStore } = await import('../../services/store-manager');
      const store = getStore('topk-session', new MockEmbeddingProvider());
      
      await store.addDocument('Document 1', {});
      await store.addDocument('Document 2', {});
      await store.addDocument('Document 3', {});
      
      const results = await searchRAG('Document', 'topk-session', 2);
      expect(results).toHaveLength(2);
    });

    it('should search in global store by default', async () => {
      const { getStore } = await import('../../services/store-manager');
      const store = getStore('global', new MockEmbeddingProvider());
      
      await store.addDocument('Global search test');
      const results = await searchRAG('Global search test');
      expect(results.length).toBeGreaterThan(0);
    });
  });
});