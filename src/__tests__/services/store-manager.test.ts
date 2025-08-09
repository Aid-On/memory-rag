import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getStore, 
  getSessionCount, 
  clearSession, 
  clearAllSessions 
} from '../../services/store-manager';
import { MockEmbeddingProvider } from '../mocks/providers';

describe('StoreManager', () => {
  const mockProvider = new MockEmbeddingProvider();
  
  beforeEach(() => {
    clearAllSessions();
  });

  describe('getStore', () => {
    it('should return global store for no sessionId', () => {
      const store1 = getStore(undefined, mockProvider);
      const store2 = getStore(undefined, mockProvider);
      
      expect(store1).toBe(store2);
    });

    it('should return global store for "global" sessionId', () => {
      const store1 = getStore('global', mockProvider);
      const store2 = getStore(undefined, mockProvider);
      
      expect(store1).toBe(store2);
    });

    it('should create unique stores for different sessions', () => {
      const store1 = getStore('session1', mockProvider);
      const store2 = getStore('session2', mockProvider);
      
      expect(store1).not.toBe(store2);
    });

    it('should return same store for same sessionId', () => {
      const store1 = getStore('session1', mockProvider);
      const store2 = getStore('session1', mockProvider);
      
      expect(store1).toBe(store2);
    });
  });

  describe('getSessionCount', () => {
    it('should return 1 for only global store', () => {
      expect(getSessionCount()).toBe(1);
    });

    it('should count all active sessions plus global', () => {
      getStore('session1', mockProvider);
      getStore('session2', mockProvider);
      getStore('session3', mockProvider);
      
      expect(getSessionCount()).toBe(4); // 3 sessions + 1 global
    });
  });

  describe('clearSession', () => {
    it('should clear global store', async () => {
      const store = getStore('global', mockProvider);
      await store.addDocument('Test document');
      
      const cleared = clearSession('global');
      
      expect(cleared).toBe(true);
      expect(store.size()).toBe(0);
    });

    it('should clear and remove session store', async () => {
      const store = getStore('session1', mockProvider);
      await store.addDocument('Test document');
      
      const cleared = clearSession('session1');
      
      expect(cleared).toBe(true);
      
      // Getting the store again should create a new one
      const newStore = getStore('session1', mockProvider);
      expect(newStore).not.toBe(store);
      expect(newStore.size()).toBe(0);
    });

    it('should return false for non-existent session', () => {
      const cleared = clearSession('non-existent');
      expect(cleared).toBe(false);
    });
  });

  describe('clearAllSessions', () => {
    it('should clear all session stores', async () => {
      const store1 = getStore('session1', mockProvider);
      const store2 = getStore('session2', mockProvider);
      
      await store1.addDocument('Doc 1');
      await store2.addDocument('Doc 2');
      
      clearAllSessions();
      
      // Check that sessions were cleared
      expect(getSessionCount()).toBe(1); // Only global
      
      // New stores should be created
      const newStore1 = getStore('session1', mockProvider);
      const newStore2 = getStore('session2', mockProvider);
      
      expect(newStore1).not.toBe(store1);
      expect(newStore2).not.toBe(store2);
      expect(getSessionCount()).toBe(3); // global + 2 new sessions
    });
  });
});