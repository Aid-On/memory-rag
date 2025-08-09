import type { EmbeddingProvider, LLMProvider } from '../../types';

/**
 * Mock embedding provider for testing
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  createEmbedding(text: string): Promise<number[]> {
    // Create a simple mock embedding based on text length
    const dimension = 1536;
    const embedding = new Array<number>(dimension).fill(0);
    
    // Create some deterministic values based on text
    for (let i = 0; i < Math.min(text.length, dimension); i++) {
      embedding[i] = text.charCodeAt(i % text.length) / 255;
    }
    
    return Promise.resolve(embedding);
  }

  getDimensions(): number {
    return 1536;
  }

  getProviderName(): string {
    return 'mock';
  }
}

/**
 * Mock LLM provider for testing
 */
export class MockLLMProvider implements LLMProvider {
  generateText(params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const lastMessage = params.messages[params.messages.length - 1];
    return Promise.resolve(`Mock response to: ${lastMessage?.content || 'no message'}`);
  }

  getProviderName(): string {
    return 'mock';
  }
}