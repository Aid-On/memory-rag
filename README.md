# @aid-on/memory-rag

🚀 A lightweight, provider-agnostic in-memory RAG (Retrieval-Augmented Generation) library with seamless Vercel AI SDK integration.

## ✨ Features

- 🧠 **In-Memory Vector Store**: Lightning-fast similarity search without external dependencies
- 🔌 **Multi-Provider Support**: Works with OpenAI, Anthropic, Google, Cohere, and more via Vercel AI SDK
- ⚡ **Zero Configuration**: Get started with sensible defaults, customize when needed
- 📦 **Modular Architecture**: Clean separation between vector storage, RAG service, and providers
- 🎯 **TypeScript First**: Complete type safety with full IntelliSense support
- 🔄 **Session Isolation**: Manage multiple independent knowledge bases per user/session
- 🤖 **Vercel AI SDK Native**: Built-in streaming, tools, and edge runtime support
- 📏 **Smart Chunking**: Automatic document chunking with configurable size and overlap
- 🎨 **Flexible API**: Use high-level helpers or low-level components directly

## 📦 Installation

```bash
npm install @aid-on/memory-rag

# Install optional peer dependencies based on your needs:
npm install @ai-sdk/anthropic  # For Claude models
npm install @ai-sdk/google     # For Gemini models
npm install @ai-sdk/cohere     # For Cohere models
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { createSimpleRAG } from '@aid-on/memory-rag';

// Create a RAG instance with OpenAI (default)
const rag = createSimpleRAG();

// Add documents to the knowledge base
await rag.addDocument('RAG combines retrieval and generation for better AI responses.');
await rag.addDocument('Vector embeddings capture semantic meaning of text.');

// Search and generate an answer
const response = await rag.search('What is RAG?', 3);
console.log(response.answer);
// Output: RAG (Retrieval-Augmented Generation) combines retrieval and generation...
```

### Using Specific Providers

```typescript
import { InMemoryVectorStore, RAGService } from '@aid-on/memory-rag';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Mix and match providers for embeddings and LLM
const store = new InMemoryVectorStore(
  openai.embedding('text-embedding-3-large')
);
const service = new RAGService(
  anthropic('claude-3-haiku-20240307')
);

// Add documents with metadata
await store.addDocument(
  'Advanced RAG techniques include hybrid search and reranking.',
  { source: 'docs', topic: 'rag-advanced' }
);

// Search with answer generation
const results = await service.search(store, 'advanced RAG', 5, true);
console.log(results.answer);
```

### Session-Based Knowledge Isolation

```typescript
import { getStore, RAGService } from '@aid-on/memory-rag';

// Create isolated stores for different users/sessions
const userStore = getStore('user-123');
const adminStore = getStore('admin-456');

// Each session maintains its own knowledge base
await userStore.addDocument('User dashboard shows personal metrics.');
await adminStore.addDocument('Admin panel includes system monitoring.');

// Queries only search within the session's knowledge
const service = new RAGService();
const userResults = await service.search(userStore, 'dashboard features');
// Returns only user-specific results
```

## 🛠️ Core API

### Factory Functions

#### `createInMemoryRAG(options?)`
Factory function for creating a complete RAG system.

```typescript
const rag = createInMemoryRAG({
  llmProvider: 'openai',        // or 'anthropic', 'google', 'cohere'
  embeddingProvider: 'openai',   // or any supported provider
  llmModel: 'gpt-4o-mini',      // optional: specific model
  embeddingModel: 'text-embedding-3-small', // optional
  config: {
    vectorStore: {
      maxDocuments: 1000,        // max documents to store
      chunkSize: 500,            // characters per chunk
      chunkOverlap: 50           // overlap between chunks
    },
    search: {
      defaultTopK: 5,            // default results to return
      minScore: 0.5              // minimum similarity score
    }
  }
});
```

#### `createSimpleRAG()`
Quick start function with OpenAI defaults.

### Core Classes

#### `InMemoryVectorStore`
In-memory vector storage with similarity search.

```typescript
class InMemoryVectorStore {
  constructor(embeddingProvider?: EmbeddingProvider | EmbeddingModel | string);
  
  async addDocument(content: string, metadata?: DocumentMetadata): Promise<string>;
  async removeDocument(id: string): Promise<boolean>;
  async search(query: string, topK?: number): Promise<SearchResult[]>;
  clear(): void;
  size(): number;
  getStats(): StoreStats;
}
```

#### `RAGService`
Orchestrates RAG operations with LLM integration.

```typescript
class RAGService {
  constructor(llmProvider?: LLMProvider | LanguageModel | string);
  
  async search(
    store: IVectorStore,
    query: string,
    topK?: number,
    generateAnswer?: boolean
  ): Promise<RAGSearchResult>;
  
  async addDocument(
    store: IVectorStore,
    content: string,
    metadata?: DocumentMetadata,
    useChunks?: boolean,
    chunkSize?: number
  ): Promise<AddDocumentResult>;
}
```

## 🔗 Vercel AI SDK Integration

### Stream RAG Responses

Perfect for chat applications with real-time streaming:

```typescript
import { streamRAGResponse } from '@aid-on/memory-rag';

// In your API route or server action
const stream = await streamRAGResponse({
  messages: [
    { role: 'user', content: 'Explain vector embeddings' }
  ],
  sessionId: 'user-123',
  enableRAG: true,           // Enable RAG context
  topK: 3,                   // Number of documents to retrieve
  model: 'gpt-4o-mini',      // LLM model
  temperature: 0.7           // Response creativity
});

// Return stream to client
return new Response(stream);
```

### RAG as AI Tool

Integrate RAG with Vercel AI SDK's tool system:

```typescript
import { createRAGTool } from '@aid-on/memory-rag';
import { generateText } from 'ai';

const ragTool = createRAGTool('session-123');

const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    searchKnowledge: ragTool.search,
    addKnowledge: ragTool.add
  },
  prompt: 'Help me understand our documentation'
});
```

## ⚙️ Configuration

### Environment Variables

Configure defaults via environment variables:

```env
# Provider selection
MEMORY_RAG_LLM_PROVIDER=openai
MEMORY_RAG_EMBEDDING_PROVIDER=openai

# Model selection
MEMORY_RAG_MODEL=gpt-4o-mini
MEMORY_RAG_EMBEDDING_MODEL=text-embedding-3-small

# API Keys (if not set elsewhere)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Runtime Configuration

```typescript
import { setConfig } from '@aid-on/memory-rag';

setConfig({
  defaultProvider: {
    llm: 'anthropic',
    embedding: 'openai',  // Mix providers
  },
  vectorStore: {
    maxDocuments: 10000,   // Increase capacity
    chunkSize: 1000,       // Larger chunks
    chunkOverlap: 100      // More context overlap
  },
  search: {
    defaultTopK: 10,       // Return more results
    minScore: 0.7          // Higher quality threshold
  },
});
```

## 🔧 Advanced Features

### Smart Document Chunking

```typescript
const service = new RAGService();

// Automatically chunks large documents
const result = await service.addDocument(
  store,
  longArticle,  // 10,000+ characters
  { source: 'blog', author: 'John' },
  true,         // Enable auto-chunking
  1000          // Characters per chunk
);

console.log(`Added ${result.documentIds.length} chunks`);
```

### Bulk Document Import

```typescript
const documents = [
  { content: 'Getting started guide...', metadata: { type: 'tutorial' } },
  { content: 'API reference...', metadata: { type: 'reference' } },
  { content: 'Best practices...', metadata: { type: 'guide' } },
];

// Efficiently add multiple documents
const results = await service.bulkAddDocuments(store, documents);
console.log(`Imported ${results.documentIds.length} documents`);
```

### Custom Provider Registration

```typescript
import { 
  registerLanguageModelProvider, 
  registerEmbeddingModelProvider 
} from '@aid-on/memory-rag';

// Register a custom provider
registerLanguageModelProvider('custom-llm', (model) => {
  return {
    async generateText({ messages }) {
      // Your custom implementation
      return 'Generated response';
    }
  };
});

// Use the custom provider
const service = new RAGService('custom-llm');
```

### Metadata Filtering

```typescript
// Add documents with rich metadata
await store.addDocument('Python tutorial', {
  language: 'python',
  level: 'beginner',
  updated: '2024-01'
});

// Future: Query with metadata filters
// const results = await store.search('tutorial', {
//   filter: { language: 'python', level: 'beginner' }
// });
```

## 🎯 Real-World Use Cases

### 💬 **Conversational AI**
Build chatbots that remember context and provide accurate, grounded responses.

### 📚 **Documentation Assistant**
Create an AI that can answer questions about your codebase, API, or product docs.

### 🔍 **Semantic Search Engine**
Implement intelligent search that understands intent, not just keywords.

### 🤖 **Customer Support Bot**
Deploy AI agents that can access your knowledge base to resolve customer queries.

### 📝 **Content Generation**
Generate articles, summaries, or reports augmented with factual information.

### 🎓 **Educational Tutor**
Build personalized learning assistants with access to course materials.

## 🏗️ Architecture

```
@aid-on/memory-rag
├── 📁 types/          # TypeScript interfaces & types
├── 📁 providers/      # Provider abstraction layer
│   ├── factory.ts     # Provider factory pattern
│   ├── base.ts        # Base provider classes
│   └── vercel-ai.ts   # Vercel AI SDK adapter
├── 📁 stores/         # Vector storage layer
│   └── in-memory.ts   # In-memory vector store
├── 📁 services/       # Business logic
│   ├── rag-service.ts # RAG orchestration
│   └── store-manager.ts # Session management
├── 📁 integrations/   # Framework integrations
│   └── vercel-ai.ts   # Vercel AI SDK tools
└── 📄 index.ts        # Public API exports
```

### Design Principles

- **Provider Agnostic**: Swap LLM/embedding providers without changing code
- **Memory Efficient**: Optimized for in-memory operations
- **Type Safe**: Full TypeScript with strict typing
- **Modular**: Use only what you need
- **Edge Ready**: Works in serverless and edge environments

## 🧪 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Build the library
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Performance

- **Fast Embedding**: ~50ms per document (varies by provider)
- **Instant Search**: <10ms for 1000 documents
- **Low Memory**: ~1MB per 100 documents
- **Zero Cold Start**: No external services to initialize

## 🔒 Security

- No data persistence by default
- Session isolation for multi-tenant apps
- Provider API keys stay on your server
- Works in secure edge environments

## 📄 License

MIT © [Aid-On](https://github.com/Aid-On)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Aid-On/memory-rag/blob/main/CONTRIBUTING.md) for details.

## 🔗 Resources

- [GitHub Repository](https://github.com/Aid-On/memory-rag)
- [NPM Package](https://www.npmjs.com/package/@aid-on/memory-rag)
- [API Documentation](https://Aid-On.github.io/memory-rag/)
- [Examples & Demos](https://github.com/Aid-On/memory-rag/tree/main/examples)
- [Report Issues](https://github.com/Aid-On/memory-rag/issues)
- [Discussions](https://github.com/Aid-On/memory-rag/discussions)

---

Built with ❤️ by the Aid-On team