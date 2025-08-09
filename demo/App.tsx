import React, { useState, useEffect } from 'react'
import './App.css'

// In-Browser RAG Implementation
class InBrowserEmbedding {
  private vocabulary: Map<string, number>
  private nextId: number

  constructor() {
    this.vocabulary = new Map()
    this.nextId = 0
  }

  async embed(text: string): Promise<Float32Array> {
    const words = this.tokenize(text)
    const wordCounts: Record<string, number> = {}
    
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1
      if (!this.vocabulary.has(word)) {
        this.vocabulary.set(word, this.nextId++)
      }
    }
    
    const vector = new Float32Array(Math.min(this.vocabulary.size, 1000))
    for (const [word, count] of Object.entries(wordCounts)) {
      const index = this.vocabulary.get(word)! % vector.length
      vector[index] = count / words.length
    }
    
    return this.normalize(vector)
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
  }

  private normalize(vector: Float32Array): Float32Array {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    if (magnitude === 0) return vector
    return vector.map(val => val / magnitude)
  }

  cosineSimilarity(vec1: Float32Array, vec2: Float32Array): number {
    let dotProduct = 0
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
    }
    return dotProduct
  }
}

interface Document {
  id: string
  content: string
  metadata: Record<string, any>
}

interface SearchResult extends Document {
  score: number
}

class InBrowserVectorStore {
  private documents: Map<string, Document>
  private embeddings: Map<string, Float32Array>
  private embedder: InBrowserEmbedding
  private nextId: number

  constructor() {
    this.documents = new Map()
    this.embeddings = new Map()
    this.embedder = new InBrowserEmbedding()
    this.nextId = 1
  }

  async addDocument(content: string, metadata: Record<string, any> = {}): Promise<string> {
    const id = `doc_${this.nextId++}`
    const embedding = await this.embedder.embed(content)
    
    this.documents.set(id, {
      id,
      content,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        contentLength: content.length
      }
    })
    
    this.embeddings.set(id, embedding)
    return id
  }

  async search(query: string, topK: number = 3): Promise<SearchResult[]> {
    if (this.documents.size === 0) {
      return []
    }

    const queryEmbedding = await this.embedder.embed(query)
    const results: SearchResult[] = []

    for (const [id, docEmbedding] of this.embeddings) {
      const similarity = this.embedder.cosineSimilarity(queryEmbedding, docEmbedding)
      const doc = this.documents.get(id)!
      results.push({
        ...doc,
        score: similarity
      })
    }

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, topK)
  }

  clear(): void {
    this.documents.clear()
    this.embeddings.clear()
    this.embedder = new InBrowserEmbedding()
    this.nextId = 1
  }

  getStats() {
    const docs = Array.from(this.documents.values())
    const totalSize = docs.reduce((sum, doc) => sum + new Blob([doc.content]).size, 0)
    
    return {
      documentCount: this.documents.size,
      totalSize,
      documents: docs
    }
  }
}

// Sample documents
const sampleDocuments = [
  {
    content: 'RAG (Retrieval-Augmented Generation) は、知識ベースから関連情報を取得してから回答を生成することで、言語モデルの応答を強化するAI技術です。この手法は、検索ベースと生成ベースの手法の利点を組み合わせています。',
    metadata: { source: 'AI基礎', topic: 'RAG', category: '定義' }
  },
  {
    content: 'ベクトルデータベースは、データを高次元ベクトルとして保存し、効率的な類似検索を可能にします。セマンティック検索、推薦システム、RAG実装などの最新のAIアプリケーションには不可欠です。',
    metadata: { source: '技術ガイド', topic: 'vector-db', category: 'テクノロジー' }
  },
  {
    content: '埋め込み（Embeddings）は、テキストの意味をキャプチャする数値表現です。類似したテキストは類似した埋め込みを持つため、検索や比較タスクに便利です。',
    metadata: { source: 'ML概念', topic: 'embeddings', category: 'コンセプト' }
  },
  {
    content: 'Vercel AI SDKは、さまざまなAIプロバイダーと連携するための統一インターフェースを提供します。ストリーミング応答、ツール呼び出し、シームレスなプロバイダー切り替えをサポートしています。',
    metadata: { source: 'フレームワークドキュメント', topic: 'vercel-ai', category: 'フレームワーク' }
  },
  {
    content: 'インメモリストレージは高速アクセスを提供しますが、利用可能なRAMによって制限されます。パフォーマンスが重要な小規模から中規模のデータセットに最適です。',
    metadata: { source: 'システムアーキテクチャ', topic: 'storage', category: 'アーキテクチャ' }
  }
]

export default function App() {
  const [store] = useState(() => new InBrowserVectorStore())
  const [documentContent, setDocumentContent] = useState('')
  const [documentMetadata, setDocumentMetadata] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [topK, setTopK] = useState(3)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [stats, setStats] = useState({ documentCount: 0, totalSize: 0 })
  const [isSearching, setIsSearching] = useState(false)
  const [showAnswer, setShowAnswer] = useState(true)

  useEffect(() => {
    updateStats()
  }, [])

  const updateStats = () => {
    const currentStats = store.getStats()
    setStats({
      documentCount: currentStats.documentCount,
      totalSize: currentStats.totalSize
    })
  }

  const handleAddDocument = async () => {
    if (!documentContent.trim()) {
      alert('ドキュメントの内容を入力してください')
      return
    }

    const metadata: Record<string, string> = {}
    if (documentMetadata.trim()) {
      documentMetadata.split(',').forEach(pair => {
        const [key, value] = pair.split('=').map(s => s.trim())
        if (key && value) metadata[key] = value
      })
    }

    await store.addDocument(documentContent, metadata)
    setDocumentContent('')
    setDocumentMetadata('')
    updateStats()
  }

  const handleLoadSamples = async () => {
    for (const doc of sampleDocuments) {
      await store.addDocument(doc.content, doc.metadata)
    }
    updateStats()
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('検索クエリを入力してください')
      return
    }

    setIsSearching(true)
    const results = await store.search(searchQuery, topK)
    setSearchResults(results)
    setIsSearching(false)
  }

  const handleClear = () => {
    if (confirm('すべてのドキュメントを削除してもよろしいですか？')) {
      store.clear()
      setSearchResults([])
      updateStats()
    }
  }

  const handleExport = () => {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      stats: store.getStats(),
      searchResults: searchResults
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memory-rag-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateAnswer = (results: SearchResult[]): string => {
    if (results.length === 0) {
      return '関連する情報が見つかりませんでした。'
    }

    const topResult = results[0]
    let answer = `検索クエリ「${searchQuery}」に基づいて、以下の情報が見つかりました：\n\n`
    answer += topResult.content

    if (results.length > 1) {
      answer += '\n\n追加の関連情報：\n'
      results.slice(1).forEach(r => {
        answer += `\n• ${r.content.substring(0, 150)}${r.content.length > 150 ? '...' : ''}`
      })
    }

    return answer
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🧠 @aid-on/memory-rag</h1>
        <p>ブラウザ完結型インメモリRAG実装</p>
      </header>

      <div className="demo-container">
        <div className="demo-header">
          <h2>ドキュメント管理</h2>
          <p>知識ベースにドキュメントを追加して検索可能にします</p>
        </div>
        <div className="demo-content">
          <div className="form-group">
            <label htmlFor="document-content">ドキュメント内容:</label>
            <textarea
              id="document-content"
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="追加するドキュメントの内容を入力してください..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="document-metadata">メタデータ (オプション):</label>
            <input
              id="document-metadata"
              type="text"
              value={documentMetadata}
              onChange={(e) => setDocumentMetadata(e.target.value)}
              placeholder="例: source=記事, topic=AI"
            />
          </div>

          <div className="button-group">
            <button className="btn btn-primary" onClick={handleAddDocument}>
              ドキュメント追加
            </button>
            <button className="btn btn-secondary" onClick={handleLoadSamples}>
              サンプルデータ読み込み
            </button>
          </div>
        </div>
      </div>

      <div className="demo-container">
        <div className="demo-header">
          <h2>検索 & 質問</h2>
          <p>知識ベースから関連情報を検索します</p>
        </div>
        <div className="demo-content">
          <div className="form-group">
            <label htmlFor="search-query">検索クエリ:</label>
            <input
              id="search-query"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="質問や検索キーワードを入力..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="form-group">
            <label htmlFor="top-k">検索結果数:</label>
            <select id="top-k" value={topK} onChange={(e) => setTopK(Number(e.target.value))}>
              <option value="1">1件</option>
              <option value="3">3件</option>
              <option value="5">5件</option>
              <option value="10">10件</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={showAnswer}
                onChange={(e) => setShowAnswer(e.target.checked)}
              />
              {' '}AI回答を生成
            </label>
          </div>

          <button className="btn btn-primary" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '検索中...' : '検索実行'}
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="result-section">
          <div className="result-header">
            <h3>検索結果</h3>
          </div>
          
          {showAnswer && (
            <div className="ai-answer">
              <h4>🤖 AI回答</h4>
              <div className="ai-answer-content">
                {generateAnswer(searchResults).split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          <div className="search-results">
            {searchResults.map((result, index) => (
              <div key={result.id} className="result-item">
                <div className="result-score">
                  #{index + 1} • スコア: {(result.score * 100).toFixed(1)}%
                </div>
                <div className="result-content">{result.content}</div>
                {Object.keys(result.metadata).filter(k => k !== 'timestamp' && k !== 'contentLength').length > 0 && (
                  <div className="result-metadata">
                    {Object.entries(result.metadata)
                      .filter(([k]) => k !== 'timestamp' && k !== 'contentLength')
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' | ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="result-section">
        <div className="result-header">
          <h3>統計情報</h3>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">ドキュメント数</div>
            <div className="stat-value">{stats.documentCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">総サイズ</div>
            <div className="stat-value">{(stats.totalSize / 1024).toFixed(2)} KB</div>
          </div>
        </div>
        
        <div className="button-group">
          <button className="btn btn-danger" onClick={handleClear}>
            すべて削除
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            データエクスポート
          </button>
        </div>
      </div>
    </div>
  )
}