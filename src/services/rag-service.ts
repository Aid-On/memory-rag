import type { 
  IVectorStore, 
  RAGSearchResult, 
  AddDocumentResult, 
  BulkDocument,
  DocumentMetadata,
  LLMProvider 
} from '../types';
import { LLMProviderFactory } from '../providers/factory';
import { ModelBasedLLMProvider } from '../providers/base';
import type { LanguageModel } from 'ai';

export class RAGService {
  private llmProvider: LLMProvider;

  constructor(llmProvider?: LLMProvider | LanguageModel | string) {
    if (!llmProvider) {
      this.llmProvider = LLMProviderFactory.create();
    } else if (typeof llmProvider === 'string') {
      this.llmProvider = LLMProviderFactory.create(llmProvider);
    } else if ('generateText' in llmProvider) {
      this.llmProvider = llmProvider;
    } else {
      this.llmProvider = new ModelBasedLLMProvider(llmProvider as LanguageModel);
    }
  }

  async search(
    store: IVectorStore,
    query: string,
    topK: number = 5,
    generateAnswer: boolean = true
  ): Promise<RAGSearchResult> {
    try {
      const results = await store.search(query, topK);

      if (results.length === 0) {
        return {
          success: true,
          message: 'No documents found',
          results: [],
          answer: null,
        };
      }

      let answer = null;
      if (generateAnswer) {
        const context = results
          .map((doc, i) => `[Source ${i + 1}]: ${doc.content}`)
          .join('\n\n');

        answer = await this.llmProvider.generateText({
          messages: [
            {
              role: 'system',
              content: `Use the following context information to answer the question. Answer based on the context provided.

Context:
${context}`
            },
            { role: 'user', content: query }
          ],
          temperature: 0.7,
          maxTokens: 500,
        });
      }

      return {
        success: true,
        results: results.map(r => ({
          id: r.id,
          content: r.content,
          score: r.score,
          metadata: r.metadata,
        })),
        answer,
        stats: store.getStats(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error during search: ' + (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  async addDocument(
    store: IVectorStore,
    content: string,
    metadata: DocumentMetadata = {},
    useChunks: boolean = false,
    chunkSize: number = 500
  ): Promise<AddDocumentResult> {
    const addedIds: string[] = [];

    if (useChunks) {
      const words = content.split(' ');
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        const id = await store.addDocument(chunk, {
          ...metadata,
          chunkIndex: Math.floor(i / chunkSize),
          totalChunks: Math.ceil(words.length / chunkSize),
        });
        addedIds.push(id);
      }
    } else {
      const id = await store.addDocument(content, metadata);
      addedIds.push(id);
    }

    return {
      success: true,
      documentIds: addedIds,
      message: `Added ${addedIds.length} document(s)`,
      stats: store.getStats(),
    };
  }

  async bulkAddDocuments(
    store: IVectorStore,
    documents: BulkDocument[]
  ): Promise<AddDocumentResult> {
    const addedIds: string[] = [];
    
    for (const doc of documents) {
      if (doc.content) {
        const id = await store.addDocument(doc.content, doc.metadata || {});
        addedIds.push(id);
      }
    }

    return {
      success: true,
      documentIds: addedIds,
      message: `Added ${addedIds.length} document(s)`,
      stats: store.getStats(),
    };
  }
}