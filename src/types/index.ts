// Document types
export interface DocumentMetadata {
  fileName?: string;
  originalName?: string;
  uploadedAt?: string;
  fileType?: string;
  fileSize?: number;
  source?: string;
  chunkIndex?: number;
  totalChunks?: number;
  topic?: string;
  timestamp?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Document {
  id: string;
  content: string;
  embedding: number[];
  metadata: DocumentMetadata;
  timestamp: Date;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: DocumentMetadata;
}

// Store types
export interface StoreStats {
  documentCount: number;
  totalSize: number;
  oldestDocument: Date | null;
  newestDocument: Date | null;
}

// Service types
export interface RAGSearchResult {
  success: boolean;
  results?: SearchResult[];
  answer?: string | null;
  stats?: StoreStats;
  message?: string;
}

export interface AddDocumentResult {
  success: boolean;
  documentIds: string[];
  message: string;
  stats: StoreStats;
}

export interface BulkDocument {
  content: string;
  metadata?: DocumentMetadata;
}

// Configuration types
export interface MemoryRAGConfig {
  defaultProvider: {
    llm: string;
    embedding: string;
  };
  providers: {
    [key: string]: {
      apiKey?: string;
      baseUrl?: string;
      model?: string;
      embeddingModel?: string;
      options?: Record<string, unknown>;
    };
  };
  vectorStore: {
    maxDocuments?: number;
    chunkSize?: number;
    chunkOverlap?: number;
  };
  search: {
    defaultTopK?: number;
    minScore?: number;
  };
}

// Vector Store Interface
export interface IVectorStore {
  addDocument(content: string, metadata?: DocumentMetadata): Promise<string>;
  removeDocument(id: string): Promise<boolean>;
  search(query: string, topK?: number): Promise<SearchResult[]>;
  clear(): void;
  size(): number;
  getStats(): StoreStats;
  hasDocument(id: string): boolean;
  getProviderInfo?(): { name: string; dimensions: number };
}

// Provider Interfaces
export interface EmbeddingProvider {
  createEmbedding(text: string): Promise<number[]>;
  getDimensions(): number;
  getProviderName?(): string;
}

export interface LLMProvider {
  generateText(params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;
  getProviderName?(): string;
}