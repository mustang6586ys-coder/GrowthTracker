ログイン不可時のトラブルシューティング (ID確認編)

選手としてログインできない事象が発生した際、原因が「FirestoreへのID未登録」であるかを確認するためのステップバイステップガイドです。

STEP 1: Firebase Console での直接確認

まず、DB側にデータが存在するかを目視で確認します。

Firebase Console にログイン。

Firestore Database を選択。

SPEC.md で定義したパスを辿る。

artifacts > {あなたのappId} > public > data > players

確認ポイント:

players コレクション内に、ログインしようとしている ID（ドキュメントID）が存在するか？

IDの文字列に余計なスペースや、大文字・小文字の打ち間違いがないか？

STEP 2: アプリ側でのログ出力 (デバッグ)

コード内で「どのIDを使って」「どんな結果が返ってきたか」をコンソールに出力します。

App.jsx（またはログイン処理を書いているファイル）の getDoc を呼び出している箇所に以下のログを差し込む。

// 修正イメージ
const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', inputId);
console.log("🔍 Checking ID in Firestore:", inputId); // 入力されたIDを確認

const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
console.log("✅ Player found:", docSnap.data());
} else {
console.error("❌ No such document! ID is likely missing in Firestore:", inputId);
}

ブラウザのデベロッパーツール（F12）の Console タブを開き、ログイン試行時のログを確認する。

STEP 3: 認証状態の確認

Firestoreのセキュリティルールで auth != null としている場合、匿名ログイン（またはカスタムトークン）が失敗しているとデータは取得できません。

コンソールに Auth Error や FirebaseError: [code=permission-denied] が出ていないか確認。

ログイン処理の直前に、現在ログインしているユーザー情報が出力されるか確認。

console.log("🔑 Current Auth User UID:", auth.currentUser?.uid);

STEP 4: 根本的な解決策

もしIDが登録されていないことが原因であれば、以下の対応を行う。

Command Centerから追加: 管理者モードで選手を追加する機能が正常に setDoc（ID指定保存）を行っているか再確認。

手動データ作成: Firebase Consoleから「ドキュメントを追加」を選択し、ID フィールドを適切に設定してテスト用の選手データを作成する。

解決後のアクション

原因が判明し、解決した場合はその内容を docs/KNOWLEDGE.md に ERR-002 として追記すること。
