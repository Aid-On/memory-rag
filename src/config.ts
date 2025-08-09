import type { MemoryRAGConfig } from './types';

// Default configuration
export const defaultConfig: MemoryRAGConfig = {
  defaultProvider: {
    llm: process.env.MEMORY_RAG_LLM_PROVIDER || (process.env.NODE_ENV === 'test' ? 'mock' : 'vercel-ai'),
    embedding: process.env.MEMORY_RAG_EMBEDDING_PROVIDER || (process.env.NODE_ENV === 'test' ? 'mock' : 'vercel-ai'),
  },
  providers: {
    'vercel-ai': {
      model: process.env.MEMORY_RAG_MODEL || 'gpt-4o-mini',
      embeddingModel: process.env.MEMORY_RAG_EMBEDDING_MODEL || 'text-embedding-3-small',
    },
  },
  vectorStore: {
    maxDocuments: 1000,
    chunkSize: 500,
    chunkOverlap: 50,
  },
  search: {
    defaultTopK: 5,
    minScore: 0.5,
  },
};

// Configuration singleton
let config: MemoryRAGConfig = defaultConfig;

export function setConfig(newConfig: Partial<MemoryRAGConfig>): void {
  config = { ...config, ...newConfig };
}

export function getConfig(): MemoryRAGConfig {
  return config;
}

export function resetConfig(): void {
  config = defaultConfig;
}