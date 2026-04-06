GrowthTracker プロジェクト仕様書

1. 概要

プロジェクト名: GrowthTracker (for 東京江戸川ボーイズ)

コンセプト: BMIベースの13段階ランク制によるフィジカル成長の「エンタメ化」。

目的: 中学生選手の増量に対するモチベーション創出。

2. コアロジック

2.1 BMI計算

$BMI = \frac{Weight(kg)}{Height(m)^2}$

YOUピン: BMI 18.0(0%) 〜 24.0(100%) でマッピング。

2.2 ランク体系 & チーム目標

「AAA」をチーム目標（主力級）とし、到達後はエリート枠へのステップアップを促す。

BMI

ランク

区分

状態

18.0-19.0

C 〜 CCC

基礎トレ期

- 19.5-20.5

B 〜 BBB

標準・出力型

- 21.0-21.5

A 〜 AA

主力級

- 22.0

AAA

チーム目標

TARGET

22.5-23.5

S 〜 SSS

パワーエリート

Step Up!

24.0〜

UNICORN

至高の領域

LEGEND

2.3 学年自動更新

毎年4月1日を起点に、保存された「期生」データから現在の学年を自動算出する。

3. UI/UX

ベースカラー: #0a0a0c

アクセント: ネオンカラー（Cyan, Magenta, Lime）

トレンド予測: 週+0.5kgの増量想定で、次のランク（またはAAA）への到達日を表示。

4. データ構造 (Firestore)

Public Data Path: artifacts/{appId}/public/data/players

Sub-collection: .../players/{playerId}/history

Status: 接続確認済み。ダミーデータによるアップロードテスト完了。

5. 現在のフェーズと次タスク

[x] UIプロトタイプ完成

[x] Firebase Hosting公開

[x] Firebase Authentication / Firestore 基礎連携完了

[ ] Next: 履歴データの詳細グラフ表示（Recharts等を用いたトレンドの可視化）

[ ] Next: Command Center（管理者用データ一括編集・削除・CSV出力機能）の強化

[ ] Next: ステップアップ・プロンプト（目標達成時の演出）の実装
