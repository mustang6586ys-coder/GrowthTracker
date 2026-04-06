import { db } from "./src/firebase.js"; // firebase.jsのパスを確認！
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

const csvPath = "./players.csv"; // タブ区切りでも拡張子は .csv や .txt でOK

async function masterUpload() {
  try {
    const rawData = fs.readFileSync(csvPath, "utf-8");
    const lines = rawData.trim().split("\n");

    // --- 修正ポイント：区切り文字をタブ(\t)に指定 ---
    const delimiter = "\t";
    const headers = lines[0].split(delimiter).map((h) => h.trim());

    console.log("🚀 タブ区切りデータでFirestore同期を開始するぜ！");
    console.log("読み込みヘッダー:", headers);

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim());
      const player = {};

      headers.forEach((header, index) => {
        const val = values[index];
        // 数値として保存する項目
        if (["roster-num", "height", "weight", "lastWeight"].includes(header)) {
          player[header] = Number(val) || 0;
        } else {
          player[header] = val;
        }
      });

      if (!player.id) continue;

      const docRef = doc(db, "gt_players", player.id);
      await setDoc(
        docRef,
        {
          ...player,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      console.log(`✅ 同期完了: ${player.name} (#${player["roster-num"]})`);
    }

    console.log("\n🔥 全選手のセットアップが完了したぜ！");
  } catch (err) {
    console.error("❌ エラーが発生したぜ、相棒:", err);
  }
}

masterUpload();
