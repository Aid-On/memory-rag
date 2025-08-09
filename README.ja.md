# @aid-on/memory-rag

🚀 Vercel AI SDK とシームレスに統合された、軽量でプロバイダー非依存のインメモリ RAG（検索拡張生成）ライブラリ。

## ✨ 機能

- 🧠 **インメモリベクトルストア**: 外部依存なしの超高速類似性検索
- 🔌 **マルチプロバイダー対応**: Vercel AI SDK 経由で OpenAI、Anthropic、Google、Cohere などに対応
- ⚡ **ゼロ設定**: 合理的なデフォルト設定ですぐに開始、必要に応じてカスタマイズ可能
- 📦 **モジュラーアーキテクチャ**: ベクトルストレージ、RAG サービス、プロバイダー間のクリーンな分離
- 🎯 **TypeScript ファースト**: 完全な型安全性と IntelliSense サポート
- 🔄 **セッション分離**: ユーザー/セッションごとに独立した複数のナレッジベースを管理
- 🤖 **Vercel AI SDK ネイティブ**: ストリーミング、ツール、エッジランタイムの組み込みサポート
- 📏 **スマートチャンキング**: 設定可能なサイズとオーバーラップによる自動ドキュメント分割
- 🎨 **柔軟な API**: 高レベルヘルパーまたは低レベルコンポーネントを直接使用

## 📦 インストール

```bash
npm install @aid-on/memory-rag

# 必要に応じてオプションのピア依存関係をインストール：
npm install @ai-sdk/anthropic  # Claude モデル用
npm install @ai-sdk/google     # Gemini モデル用
npm install @ai-sdk/cohere     # Cohere モデル用
```

## 🚀 クイックスタート

### 基本的な使用方法

```typescript
import { createSimpleRAG } from '@aid-on/memory-rag';

// OpenAI（デフォルト）で RAG インスタンスを作成
const rag = createSimpleRAG();

// ナレッジベースにドキュメントを追加
await rag.addDocument('RAG は検索と生成を組み合わせて、より良い AI レスポンスを実現します。');
await rag.addDocument('ベクトル埋め込みはテキストの意味的な意味を捉えます。');

// 検索して回答を生成
const response = await rag.search('RAG とは何ですか？', 3);
console.log(response.answer);
// 出力: RAG（検索拡張生成）は検索と生成を組み合わせて...
```

### 特定のプロバイダーの使用

```typescript
import { InMemoryVectorStore, RAGService } from '@aid-on/memory-rag';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// 埋め込みと LLM に異なるプロバイダーを組み合わせて使用
const store = new InMemoryVectorStore(
  openai.embedding('text-embedding-3-large')
);
const service = new RAGService(
  anthropic('claude-3-haiku-20240307')
);

// メタデータ付きでドキュメントを追加
await store.addDocument(
  '高度な RAG 技術にはハイブリッド検索と再ランキングが含まれます。',
  { source: 'docs', topic: 'rag-advanced' }
);

// 回答生成付きで検索
const results = await service.search(store, '高度な RAG', 5, true);
console.log(results.answer);
```

### セッションベースのナレッジ分離

```typescript
import { getStore, RAGService } from '@aid-on/memory-rag';

// 異なるユーザー/セッション用に分離されたストアを作成
const userStore = getStore('user-123');
const adminStore = getStore('admin-456');

// 各セッションは独自のナレッジベースを維持
await userStore.addDocument('ユーザーダッシュボードは個人のメトリクスを表示します。');
await adminStore.addDocument('管理パネルにはシステム監視が含まれます。');

// クエリはセッションのナレッジ内でのみ検索
const service = new RAGService();
const userResults = await service.search(userStore, 'ダッシュボードの機能');
// ユーザー固有の結果のみを返す
```

## 🛠️ コア API

### ファクトリ関数

#### `createInMemoryRAG(options?)`
完全な RAG システムを作成するファクトリ関数。

```typescript
const rag = createInMemoryRAG({
  llmProvider: 'openai',        // または 'anthropic', 'google', 'cohere'
  embeddingProvider: 'openai',   // サポートされている任意のプロバイダー
  llmModel: 'gpt-4o-mini',      // オプション：特定のモデル
  embeddingModel: 'text-embedding-3-small', // オプション
  config: {
    vectorStore: {
      maxDocuments: 1000,        // 保存する最大ドキュメント数
      chunkSize: 500,            // チャンクあたりの文字数
      chunkOverlap: 50           // チャンク間のオーバーラップ
    },
    search: {
      defaultTopK: 5,            // デフォルトで返す結果数
      minScore: 0.5              // 最小類似度スコア
    }
  }
});
```

#### `createSimpleRAG()`
OpenAI デフォルト設定でのクイックスタート関数。

### コアクラス

#### `InMemoryVectorStore`
類似性検索を備えたインメモリベクトルストレージ。

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
LLM 統合で RAG 操作を調整。

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

## 🔗 Vercel AI SDK 統合

### RAG レスポンスのストリーミング

リアルタイムストリーミングを備えたチャットアプリケーションに最適：

```typescript
import { streamRAGResponse } from '@aid-on/memory-rag';

// API ルートまたはサーバーアクション内で
const stream = await streamRAGResponse({
  messages: [
    { role: 'user', content: 'ベクトル埋め込みについて説明してください' }
  ],
  sessionId: 'user-123',
  enableRAG: true,           // RAG コンテキストを有効化
  topK: 3,                   // 取得するドキュメント数
  model: 'gpt-4o-mini',      // LLM モデル
  temperature: 0.7           // レスポンスの創造性
});

// クライアントにストリームを返す
return new Response(stream);
```

### AI ツールとしての RAG

Vercel AI SDK のツールシステムと RAG を統合：

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
  prompt: 'ドキュメントの理解を手伝ってください'
});
```

## ⚙️ 設定

### 環境変数

環境変数でデフォルトを設定：

```env
# プロバイダー選択
MEMORY_RAG_LLM_PROVIDER=openai
MEMORY_RAG_EMBEDDING_PROVIDER=openai

# モデル選択
MEMORY_RAG_MODEL=gpt-4o-mini
MEMORY_RAG_EMBEDDING_MODEL=text-embedding-3-small

# API キー（他で設定されていない場合）
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### ランタイム設定

```typescript
import { setConfig } from '@aid-on/memory-rag';

setConfig({
  defaultProvider: {
    llm: 'anthropic',
    embedding: 'openai',  // プロバイダーを混在
  },
  vectorStore: {
    maxDocuments: 10000,   // 容量を増やす
    chunkSize: 1000,       // より大きなチャンク
    chunkOverlap: 100      // より多くのコンテキストオーバーラップ
  },
  search: {
    defaultTopK: 10,       // より多くの結果を返す
    minScore: 0.7          // より高い品質しきい値
  },
});
```

## 🔧 高度な機能

### スマートドキュメントチャンキング

```typescript
const service = new RAGService();

// 大きなドキュメントを自動的にチャンク化
const result = await service.addDocument(
  store,
  longArticle,  // 10,000 文字以上
  { source: 'blog', author: 'John' },
  true,         // 自動チャンキングを有効化
  1000          // チャンクあたりの文字数
);

console.log(`${result.documentIds.length} チャンクを追加しました`);
```

### 一括ドキュメントインポート

```typescript
const documents = [
  { content: 'はじめに...', metadata: { type: 'tutorial' } },
  { content: 'API リファレンス...', metadata: { type: 'reference' } },
  { content: 'ベストプラクティス...', metadata: { type: 'guide' } },
];

// 複数のドキュメントを効率的に追加
const results = await service.bulkAddDocuments(store, documents);
console.log(`${results.documentIds.length} ドキュメントをインポートしました`);
```

### カスタムプロバイダー登録

```typescript
import { 
  registerLanguageModelProvider, 
  registerEmbeddingModelProvider 
} from '@aid-on/memory-rag';

// カスタムプロバイダーを登録
registerLanguageModelProvider('custom-llm', (model) => {
  return {
    async generateText({ messages }) {
      // カスタム実装
      return '生成されたレスポンス';
    }
  };
});

// カスタムプロバイダーを使用
const service = new RAGService('custom-llm');
```

### メタデータフィルタリング

```typescript
// リッチメタデータ付きでドキュメントを追加
await store.addDocument('Python チュートリアル', {
  language: 'python',
  level: 'beginner',
  updated: '2024-01'
});

// 将来: メタデータフィルターでクエリ
// const results = await store.search('tutorial', {
//   filter: { language: 'python', level: 'beginner' }
// });
```

## 🎯 実用的なユースケース

### 💬 **会話型 AI**
コンテキストを記憶し、正確で根拠のあるレスポンスを提供するチャットボットを構築。

### 📚 **ドキュメントアシスタント**
コードベース、API、または製品ドキュメントに関する質問に答える AI を作成。

### 🔍 **セマンティック検索エンジン**
キーワードだけでなく、意図を理解するインテリジェントな検索を実装。

### 🤖 **カスタマーサポートボット**
ナレッジベースにアクセスして顧客の問い合わせを解決できる AI エージェントを展開。

### 📝 **コンテンツ生成**
事実情報で強化された記事、要約、またはレポートを生成。

### 🎓 **教育チューター**
コース教材へのアクセスを持つパーソナライズされた学習アシスタントを構築。

## 🏗️ アーキテクチャ

```
@aid-on/memory-rag
├── 📁 types/          # TypeScript インターフェースと型
├── 📁 providers/      # プロバイダー抽象化レイヤー
│   ├── factory.ts     # プロバイダーファクトリパターン
│   ├── base.ts        # ベースプロバイダークラス
│   └── vercel-ai.ts   # Vercel AI SDK アダプター
├── 📁 stores/         # ベクトルストレージレイヤー
│   └── in-memory.ts   # インメモリベクトルストア
├── 📁 services/       # ビジネスロジック
│   ├── rag-service.ts # RAG オーケストレーション
│   └── store-manager.ts # セッション管理
├── 📁 integrations/   # フレームワーク統合
│   └── vercel-ai.ts   # Vercel AI SDK ツール
└── 📄 index.ts        # パブリック API エクスポート
```

### 設計原則

- **プロバイダー非依存**: コードを変更せずに LLM/埋め込みプロバイダーを交換
- **メモリ効率**: インメモリ操作に最適化
- **型安全**: 厳密な型付けによる完全な TypeScript
- **モジュラー**: 必要なものだけを使用
- **エッジ対応**: サーバーレスおよびエッジ環境で動作

## 🧪 開発

```bash
# 依存関係をインストール
npm install

# テストを実行
npm test

# ウォッチモードでテストを実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage

# ライブラリをビルド
npm run build

# 型チェック
npm run type-check

# リンティング
npm run lint
```

## 🚀 パフォーマンス

- **高速埋め込み**: ドキュメントあたり約 50ms（プロバイダーによる）
- **即座の検索**: 1000 ドキュメントで 10ms 未満
- **低メモリ**: 100 ドキュメントあたり約 1MB
- **ゼロコールドスタート**: 初期化する外部サービスなし

## 🔒 セキュリティ

- デフォルトでデータの永続化なし
- マルチテナントアプリ用のセッション分離
- プロバイダー API キーはサーバーに保持
- セキュアなエッジ環境で動作

## 📄 ライセンス

MIT © [Aid-On](https://github.com/Aid-On)

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細は[コントリビューションガイド](https://github.com/Aid-On/memory-rag/blob/main/CONTRIBUTING.md)をご覧ください。

## 🔗 リソース

- [GitHub リポジトリ](https://github.com/Aid-On/memory-rag)
- [NPM パッケージ](https://www.npmjs.com/package/@aid-on/memory-rag)
- [API ドキュメント](https://Aid-On.github.io/memory-rag/)
- [サンプルとデモ](https://github.com/Aid-On/memory-rag/tree/main/examples)
- [問題を報告](https://github.com/Aid-On/memory-rag/issues)
- [ディスカッション](https://github.com/Aid-On/memory-rag/discussions)

---

Aid-On チームによって ❤️ をこめて作られました