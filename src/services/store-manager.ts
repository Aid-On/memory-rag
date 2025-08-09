import type { IVectorStore, EmbeddingProvider } from '../types';
import { InMemoryVectorStore } from '../stores/in-memory';
import type { EmbeddingModel } from 'ai';

// Global store (persists during server runtime)
let globalStore: IVectorStore | null = null;

// Session-based stores
const sessionStores = new Map<string, IVectorStore>();

/**
 * Get or create a store for a session
 */
export function getStore(
  sessionId?: string, 
  embeddingProvider?: EmbeddingProvider | EmbeddingModel<string> | string
): IVectorStore {
  if (!sessionId || sessionId === 'global') {
    if (!globalStore) {
      globalStore = new InMemoryVectorStore(embeddingProvider);
    }
    return globalStore;
  }
  
  if (!sessionStores.has(sessionId)) {
    sessionStores.set(sessionId, new InMemoryVectorStore(embeddingProvider));
  }
  
  return sessionStores.get(sessionId)!;
}

/**
 * Get the number of active sessions
 */
export function getSessionCount(): number {
  return sessionStores.size + 1; // +1 for global
}

/**
 * Clear a specific session's store
 */
export function clearSession(sessionId: string): boolean {
  if (sessionId === 'global') {
    if (globalStore) {
      globalStore.clear();
    }
    return true;
  }
  
  const store = sessionStores.get(sessionId);
  if (store) {
    store.clear();
    sessionStores.delete(sessionId);
    return true;
  }
  
  return false;
}

/**
 * Clear all session stores
 */
export function clearAllSessions(): void {
  sessionStores.forEach(store => store.clear());
  sessionStores.clear();
  // Also reset global store to ensure clean state
  if (globalStore) {
    globalStore.clear();
    globalStore = null;
  }
}