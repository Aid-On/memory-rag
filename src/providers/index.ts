// Core providers
export { ModelBasedLLMProvider, ModelBasedEmbeddingProvider, defaultModels } from './base';
export { 
  VercelAILLMProvider, 
  VercelAIEmbeddingProvider,
  registerLanguageModelProvider,
  registerEmbeddingModelProvider,
  getAvailableProviders
} from './vercel-ai';

// Factories
export { LLMProviderFactory, EmbeddingProviderFactory } from './factory';