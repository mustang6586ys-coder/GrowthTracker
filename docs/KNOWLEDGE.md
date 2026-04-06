GrowthTracker 開発ナレッジ共有 (KNOWLEDGE.md)

このファイルは、過去に発生したエラー、ハマりポイント、およびその解決策を記録し、再発を防止するためのものです。AIおよび開発者は、実装前に必ずこの内容を確認してください。

1. 頻出エラーと対策

例：Firebase 権限エラー (Permission Denied)

事象: Firestoreへの書き込み時に Permission Denied が発生する。

原因: signInAnonymously の完了を待たずに setDoc 等を実行していた。

解決策: Authの状態を useEffect で監視し、user が存在する時のみクエリを実行するガードを徹底する。

再発防止策: rules.md の「実装上の注意点」に「Auth Before Queries」を追記。

2. 実装上の落とし穴 (Pitfalls)

例：Tailwind v4 のクラス名適用

事象: 独自のカラーコードが反映されない。

原因: 従来の tailwind.config.js の記法と v4 の CSS 変数ベースの記法が混在していた。

解決策: theme.css 内での @theme ブロックによる定義に統一。

3. ナレッジ記録ルール

新しいエラーを解決した際は、以下のフォーマットで追記すること。

ID: ERR-001 (連番)

事象: 何が起きたか

原因: なぜ起きたか（技術的背景）

解決策: どう直したか（具体的なコード変更）

AIへの指示: 今後どう振る舞うべきか
