import { streamText, generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getStore } from '../services/store-manager';
import type { SearchResult } from '../types';

/**
 * Create a RAG tool for Vercel AI SDK
 */
export function createRAGTool(sessionId: string = 'global') {
  // @ts-expect-error - Tool function type issue with Vercel AI SDK
  return tool({
    description: 'Search for relevant information from the knowledge base',
    parameters: z.object({
      query: z.string().describe('The search query'),
      topK: z.number().optional().describe('Number of top results to retrieve'),
    }),
    execute: async (args: { query: string; topK?: number }) => {
      const { query, topK = 3 } = args;
      const store = getStore(sessionId);
      const results = await store.search(query, topK);
      
      return {
        results: results.map(r => ({
          content: r.content,
          score: r.score,
          metadata: r.metadata,
        })),
        totalDocuments: store.size(),
      };
    },
  });
}

/**
 * Create RAG context for messages
 */
export async function createRAGContext(
  query: string,
  sessionId: string = 'global',
  topK: number = 3
): Promise<string> {
  const store = getStore(sessionId);
  const results = await store.search(query, topK);
  
  if (results.length === 0) {
    return '';
  }
  
  return `Based on the following relevant information from the knowledge base:\n\n${
    results.map((r, i) => `[Source ${i + 1}]: ${r.content}`).join('\n\n')
  }\n\nPlease answer the following question:`;
}

/**
 * Stream RAG-enhanced responses
 */
export async function streamRAGResponse({
  messages,
  sessionId = 'global',
  enableRAG = true,
  topK = 3,
  model = 'gpt-4o-mini',
}: {
  messages: Parameters<typeof streamText>[0]['messages'];
  sessionId?: string;
  enableRAG?: boolean;
  topK?: number;
  model?: string;
}) {
  if (!messages) {
    throw new Error('Messages are required');
  }
  
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
  if (enableRAG && lastUserMessage && typeof lastUserMessage.content === 'string') {
    const context = await createRAGContext(lastUserMessage.content, sessionId, topK);
    
    if (context) {
      const systemMessage = {
        role: 'system' as const,
        content: context,
      };
      
      messages = [systemMessage, ...messages];
    }
  }
  
  return streamText({
    model: openai(model),
    messages,
    tools: enableRAG ? { searchKnowledge: createRAGTool(sessionId) } : undefined,
  });
}

/**
 * Generate RAG-enhanced responses
 */
export async function generateRAGResponse({
  messages,
  sessionId = 'global',
  enableRAG = true,
  topK = 3,
  model = 'gpt-4o-mini',
}: {
  messages: Parameters<typeof generateText>[0]['messages'];
  sessionId?: string;
  enableRAG?: boolean;
  topK?: number;
  model?: string;
}) {
  if (!messages) {
    throw new Error('Messages are required');
  }
  
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  
  if (enableRAG && lastUserMessage && typeof lastUserMessage.content === 'string') {
    const context = await createRAGContext(lastUserMessage.content, sessionId, topK);
    
    if (context) {
      const systemMessage = {
        role: 'system' as const,
        content: context,
      };
      
      messages = [systemMessage, ...messages];
    }
  }
  
  return generateText({
    model: openai(model),
    messages,
    tools: enableRAG ? { searchKnowledge: createRAGTool(sessionId) } : undefined,
  });
}

/**
 * Add document to RAG
 */
export async function addDocumentToRAG(
  content: string,
  metadata: Record<string, string | number | boolean | undefined> = {},
  sessionId: string = 'global'
): Promise<string> {
  const store = getStore(sessionId);
  return await store.addDocument(content, metadata);
}

/**
 * Bulk add documents to RAG
 */
export async function bulkAddDocumentsToRAG(
  documents: Array<{ content: string; metadata?: Record<string, string | number | boolean | undefined> }>,
  sessionId: string = 'global'
): Promise<string[]> {
  const store = getStore(sessionId);
  const ids: string[] = [];
  
  for (const doc of documents) {
    const id = await store.addDocument(doc.content, doc.metadata || {});
    ids.push(id);
  }
  
  return ids;
}

/**
 * Clear RAG session
 */
export function clearRAGSession(sessionId: string = 'global'): void {
  const store = getStore(sessionId);
  store.clear();
}

/**
 * Search RAG directly
 */
export async function searchRAG(
  query: string,
  sessionId: string = 'global',
  topK: number = 5
): Promise<SearchResult[]> {
  const store = getStore(sessionId);
  return await store.search(query, topK);
}