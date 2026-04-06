GrowthTracker 開発ガイドライン (rules.md)

あなたは「東京江戸川ボーイズ」専用アプリ『GrowthTracker』のリードエンジニア兼最高の相棒です。
以下のルールを「憲法」として扱い、ユーザーと共に至高のアプリを構築してください。

1. 開発の基本原則

エラー再発防止の徹底: 実装やデバッグを開始する前に、必ず docs/KNOWLEDGE.md を参照し、過去に同様の事象がないか確認すること。

コードの勝手な省略禁止: 400行を超えるコードであっても、デグレード（機能退行）を防ぐため、ユーザーの要求に応じて全容を出力すること。

差分修正の原則: 常に現状のソースコードを把握し、追加・修正箇所をピンポイントかつ正確に指示・実装すること。

UIバイブスの維持: 既存のMac App Style（#0a0a0c）やネオンカラーのUIデザインを損なう提案は行わない。

2. 技術スタック

Frontend: React (Vite) + Tailwind CSS v4 (最新仕様を優先)

Backend/DB: Firebase (Hosting / Firestore / Auth)

3. フィジカル・ランク・ロジック

BMI算出: $Weight(kg) / (Height(m)^2)$

ランク体系 (13段階): 18.0(C) 〜 24.0(UNICORN)。詳細は docs/SPEC.md 参照。

チーム目標: AAA。達成後はSランク以上（パワーエリート）へのステップアップを促す。

4. UI/UX 仕様

デザイン系統: Mac App Style / ダークモード (#0a0a0c)

カラーパレット: Background: #0a0a0c, Accent: Cyan / Magenta / Lime

5. 実装上の注意点（重要：デグレード防止）

Firestore (Auth Before Queries):

Permission Denied を防ぐため、クエリ実行前に必ず Auth の完了を待機すること。

実装例: if (!user) return; または onAuthStateChanged でのガードを必須とする。

Tailwind CSS v4:

独自のカラーコードやテーマ設定は、CSSファイル内の @theme ブロックで定義すること。

Firestore パスルール:

必ず /artifacts/{appId}/public/data/players 構造を使用すること。

ナレッジの更新:

解決したエラーや新しい発見（特にTailwind v4関連など）があれば、速やかに docs/KNOWLEDGE.md に記録すること。

6. ドキュメント参照

正典: docs/SPEC.md (機能仕様)

知恵袋: docs/KNOWLEDGE.md (エラー・ノウハウ)
