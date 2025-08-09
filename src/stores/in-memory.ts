import type { 
  IVectorStore, 
  Document, 
  DocumentMetadata, 
  SearchResult, 
  StoreStats,
  EmbeddingProvider 
} from '../types';
import { EmbeddingProviderFactory } from '../providers/factory';
import { ModelBasedEmbeddingProvider } from '../providers/base';
import type { EmbeddingModel } from 'ai';

/**
 * In-memory implementation of the vector store
 */
export class InMemoryVectorStore implements IVectorStore {
  private documents: Map<string, Document> = new Map();
  private index: {
    embeddings: number[][];
    ids: string[];
  } = { embeddings: [], ids: [] };
  
  private embeddingProvider: EmbeddingProvider;

  constructor(embeddingProvider?: EmbeddingProvider | EmbeddingModel<string> | string) {
    if (!embeddingProvider) {
      this.embeddingProvider = EmbeddingProviderFactory.create();
    } else if (typeof embeddingProvider === 'string') {
      this.embeddingProvider = EmbeddingProviderFactory.create(embeddingProvider);
    } else if ('createEmbedding' in embeddingProvider) {
      this.embeddingProvider = embeddingProvider;
    } else {
      const model = embeddingProvider as EmbeddingModel<string>;
      const dimensions = 1536; // Default
      this.embeddingProvider = new ModelBasedEmbeddingProvider(model, dimensions);
    }
  }

  async addDocument(content: string, metadata: DocumentMetadata = {}): Promise<string> {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const embedding = await this.embeddingProvider.createEmbedding(content);
    
    const document: Document = {
      id,
      content,
      embedding,
      metadata,
      timestamp: new Date(),
    };
    
    this.documents.set(id, document);
    this.index.embeddings.push(embedding);
    this.index.ids.push(id);
    
    return id;
  }

  removeDocument(id: string): Promise<boolean> {
    return Promise.resolve(this.removeDocumentSync(id));
  }

  private removeDocumentSync(id: string): boolean {
    const doc = this.documents.get(id);
    if (!doc) return false;
    
    this.documents.delete(id);
    
    const indexPosition = this.index.ids.indexOf(id);
    if (indexPosition !== -1) {
      this.index.embeddings.splice(indexPosition, 1);
      this.index.ids.splice(indexPosition, 1);
    }
    
    return true;
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (this.documents.size === 0) {
      return [];
    }

    const queryEmbedding = await this.embeddingProvider.createEmbedding(query);
    
    const scores = this.index.embeddings.map((embedding, index) => {
      const id = this.index.ids[index];
      if (!id) {
        throw new Error(`Missing ID at index ${index}`);
      }
      return {
        id,
        score: this.cosineSimilarity(queryEmbedding, embedding),
      };
    });
    
    scores.sort((a, b) => b.score - a.score);
    const topResults = scores.slice(0, topK);
    
    return topResults.map(result => {
      const doc = this.documents.get(result.id);
      if (!doc) {
        throw new Error(`Document not found for ID: ${result.id}`);
      }
      return {
        id: doc.id,
        content: doc.content,
        score: result.score,
        metadata: doc.metadata,
      };
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
  }

  clear(): void {
    this.documents.clear();
    this.index.embeddings = [];
    this.index.ids = [];
  }

  size(): number {
    return this.documents.size;
  }

  hasDocument(id: string): boolean {
    return this.documents.has(id);
  }

  getStats(): StoreStats {
    const timestamps = Array.from(this.documents.values()).map(doc => doc.timestamp);
    const totalSize = Array.from(this.documents.values())
      .reduce((sum, doc) => sum + new Blob([doc.content]).size, 0);
    
    return {
      documentCount: this.documents.size,
      totalSize,
      oldestDocument: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : null,
      newestDocument: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : null,
    };
  }

  getProviderInfo(): { name: string; dimensions: number } {
    const providerName = this.embeddingProvider.getProviderName?.() || 'Unknown';
    return {
      name: providerName,
      dimensions: this.embeddingProvider.getDimensions(),
    };
  }
}