// Demo application for @aid-on/memory-rag
// This demonstrates the library's capabilities in a browser environment

// Note: In a real application, you would import from the npm package:
// import { createSimpleRAG } from '@aid-on/memory-rag';

// For demo purposes, we'll create a mock implementation
class DemoRAG {
  constructor() {
    this.documents = new Map();
    this.nextId = 1;
  }

  async addDocument(content, metadata = {}) {
    const id = `doc_${this.nextId++}`;
    this.documents.set(id, { id, content, metadata, timestamp: new Date() });
    return id;
  }

  async search(query, topK = 3) {
    // Simple keyword-based search for demo
    const results = [];
    const queryWords = query.toLowerCase().split(' ');
    
    for (const [id, doc] of this.documents) {
      const contentLower = doc.content.toLowerCase();
      let score = 0;
      
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += (contentLower.match(new RegExp(word, 'g')) || []).length;
        }
      }
      
      if (score > 0) {
        results.push({
          id: doc.id,
          content: doc.content,
          score: score / queryWords.length,
          metadata: doc.metadata
        });
      }
    }
    
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  generateAnswer(query, results) {
    if (results.length === 0) {
      return 'No relevant information found in the knowledge base.';
    }
    
    // Simple demo answer generation
    const context = results.map(r => r.content).join(' ');
    return `Based on the knowledge base:\n\n${results[0].content}\n\nThis information is relevant to your query about "${query}".`;
  }

  clear() {
    this.documents.clear();
    this.nextId = 1;
  }

  getStats() {
    const docs = Array.from(this.documents.values());
    const totalSize = docs.reduce((sum, doc) => sum + new Blob([doc.content]).size, 0);
    const timestamps = docs.map(d => d.timestamp);
    
    return {
      documentCount: this.documents.size,
      totalSize,
      oldestDocument: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : null,
      newestDocument: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : null
    };
  }
}

// Sample documents
const sampleDocuments = [
  {
    content: 'RAG (Retrieval-Augmented Generation) is an AI technique that enhances language model responses by retrieving relevant information from a knowledge base before generating answers.',
    metadata: { source: 'definition', topic: 'RAG' }
  },
  {
    content: 'Vector databases store data as high-dimensional vectors, enabling efficient similarity search. They are essential for modern AI applications like semantic search and recommendation systems.',
    metadata: { source: 'technical', topic: 'vector-db' }
  },
  {
    content: 'Embeddings are numerical representations of text that capture semantic meaning. Similar texts have similar embeddings, making them useful for search and comparison tasks.',
    metadata: { source: 'concept', topic: 'embeddings' }
  },
  {
    content: 'The Vercel AI SDK provides a unified interface for working with different AI providers. It supports streaming responses, tool calling, and seamless provider switching.',
    metadata: { source: 'framework', topic: 'vercel-ai' }
  },
  {
    content: 'In-memory storage offers fast access times but is limited by available RAM. It is ideal for small to medium datasets where performance is critical.',
    metadata: { source: 'architecture', topic: 'storage' }
  }
];

// Initialize the demo
const rag = new DemoRAG();

// DOM elements
const docContent = document.getElementById('document-content');
const docMetadata = document.getElementById('document-metadata');
const addDocBtn = document.getElementById('add-document');
const loadSamplesBtn = document.getElementById('load-samples');
const searchQuery = document.getElementById('search-query');
const topK = document.getElementById('top-k');
const generateAnswer = document.getElementById('generate-answer');
const searchBtn = document.getElementById('search-btn');
const resultsDisplay = document.getElementById('results-display');
const aiAnswerSection = document.getElementById('ai-answer-section');
const aiAnswerDisplay = document.getElementById('ai-answer-display');
const docCount = document.getElementById('doc-count');
const totalSize = document.getElementById('total-size');
const clearBtn = document.getElementById('clear-store');
const exportBtn = document.getElementById('export-data');

// Update statistics
function updateStats() {
  const stats = rag.getStats();
  docCount.textContent = stats.documentCount;
  totalSize.textContent = `${(stats.totalSize / 1024).toFixed(2)} KB`;
}

// Add document
addDocBtn.addEventListener('click', async () => {
  const content = docContent.value.trim();
  if (!content) {
    alert('Please enter document content');
    return;
  }
  
  const metadata = {};
  const metadataStr = docMetadata.value.trim();
  if (metadataStr) {
    metadataStr.split(',').forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim());
      if (key && value) metadata[key] = value;
    });
  }
  
  await rag.addDocument(content, metadata);
  docContent.value = '';
  docMetadata.value = '';
  updateStats();
  
  // Show success message
  const btn = addDocBtn;
  const originalText = btn.textContent;
  btn.textContent = '✓ Added!';
  btn.style.background = '#28a745';
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 2000);
});

// Load sample documents
loadSamplesBtn.addEventListener('click', async () => {
  for (const doc of sampleDocuments) {
    await rag.addDocument(doc.content, doc.metadata);
  }
  updateStats();
  
  const btn = loadSamplesBtn;
  const originalText = btn.textContent;
  btn.textContent = '✓ Loaded!';
  setTimeout(() => {
    btn.textContent = originalText;
  }, 2000);
});

// Search
searchBtn.addEventListener('click', async () => {
  const query = searchQuery.value.trim();
  if (!query) {
    alert('Please enter a search query');
    return;
  }
  
  const k = parseInt(topK.value) || 3;
  const shouldGenerateAnswer = generateAnswer.checked;
  
  // Show loading state
  resultsDisplay.innerHTML = '<div class="loading"></div> Searching...';
  resultsDisplay.classList.remove('empty');
  
  // Perform search
  const results = await rag.search(query, k);
  
  // Display results
  if (results.length === 0) {
    resultsDisplay.innerHTML = '<p style="color: var(--text-muted);">No matching documents found</p>';
    resultsDisplay.classList.add('empty');
    aiAnswerSection.style.display = 'none';
  } else {
    resultsDisplay.classList.remove('empty');
    resultsDisplay.innerHTML = results.map(r => `
      <div class="result-item">
        <span class="score">Score: ${r.score.toFixed(2)}</span>
        <div class="content">${r.content}</div>
        ${Object.keys(r.metadata).length > 0 ? `
          <div class="metadata">
            ${Object.entries(r.metadata).map(([k, v]) => `${k}: ${v}`).join(' | ')}
          </div>
        ` : ''}
      </div>
    `).join('');
    
    // Generate and display answer if requested
    if (shouldGenerateAnswer) {
      const answer = rag.generateAnswer(query, results);
      aiAnswerDisplay.innerHTML = answer.replace(/\n/g, '<br>');
      aiAnswerSection.style.display = 'block';
    } else {
      aiAnswerSection.style.display = 'none';
    }
  }
});

// Clear store
clearBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all documents?')) {
    rag.clear();
    updateStats();
    resultsDisplay.innerHTML = '<p>No search performed yet</p>';
    resultsDisplay.classList.add('empty');
    aiAnswerSection.style.display = 'none';
  }
});

// Export data
exportBtn.addEventListener('click', () => {
  const data = {
    documents: Array.from(rag.documents.values()),
    stats: rag.getStats(),
    exportedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rag-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Enter key support for search
searchQuery.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

// Initialize stats
updateStats();