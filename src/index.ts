// Import types internally for use in this file
import type { DocumentMetadata, MemoryRAGConfig, RAGSearchResult, StoreStats } from './types';
import { setConfig } from './config';

// Core types
export type { 
  IVectorStore,
  DocumentMetadata,
  Document,
  SearchResult,
  StoreStats,
  RAGSearchResult,
  AddDocumentResult,
  BulkDocument,
  MemoryRAGConfig,
  EmbeddingProvider,
  LLMProvider
} from './types';

// Configuration
export { 
  getConfig, 
  setConfig, 
  resetConfig,
  defaultConfig
} from './config';

// Core components
export { InMemoryVectorStore } from './stores/in-memory';
export { RAGService } from './services/rag-service';
export { 
  getStore, 
  getSessionCount,
  clearSession,
  clearAllSessions
} from './services/store-manager';

// Provider system
export {
  ModelBasedLLMProvider,
  ModelBasedEmbeddingProvider,
  defaultModels,
  VercelAILLMProvider,
  VercelAIEmbeddingProvider,
  registerLanguageModelProvider,
  registerEmbeddingModelProvider,
  getAvailableProviders,
  LLMProviderFactory,
  EmbeddingProviderFactory
} from './providers';

// Vercel AI SDK integration
export {
  createRAGTool,
  createRAGContext,
  streamRAGResponse,
  generateRAGResponse,
  addDocumentToRAG,
  bulkAddDocumentsToRAG,
  clearRAGSession,
  searchRAG
} from './integrations/vercel-ai';

// Import required components
import { InMemoryVectorStore } from './stores/in-memory';
import { RAGService } from './services/rag-service';

// Factory functions for easy initialization
export function createInMemoryRAG(options?: {
  llmProvider?: string;
  embeddingProvider?: string;
  config?: Partial<MemoryRAGConfig>;
}): {
  store: InMemoryVectorStore;
  service: RAGService;
  addDocument: (content: string, metadata?: DocumentMetadata) => Promise<string>;
  search: (query: string, topK?: number) => Promise<RAGSearchResult>;
  clear: () => void;
  stats: () => StoreStats;
} {
  if (options?.config) {
    setConfig(options.config);
  }
  
  const store = new InMemoryVectorStore(options?.embeddingProvider);
  const service = new RAGService(options?.llmProvider);
  
  return {
    store,
    service,
    addDocument: (content: string, metadata?: DocumentMetadata) => 
      store.addDocument(content, metadata),
    search: (query: string, topK?: number) => 
      service.search(store, query, topK),
    clear: () => store.clear(),
    stats: () => store.getStats(),
  };
}

export function createSimpleRAG(): ReturnType<typeof createInMemoryRAG> {
  return createInMemoryRAG();
}