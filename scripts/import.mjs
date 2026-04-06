import { db } from "../src/firebase.js";
import { doc, setDoc } from "firebase/firestore";
import fs from "fs";
import { parse } from "csv-parse/sync";

async function importData() {
  try {
    // 1. ファイルを読み込む（タブ区切りとして処理）
    const fileContent = fs.readFileSync("players.csv", "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: "\t", // ★ここを追加！タブ区切りに対応させます
    });

    console.log(
      `🚀 タブ区切りデータとして読み込み完了: ${records.length} 名をインポートします...`,
    );

    for (const player of records) {
      // IDの存在チェック
      if (!player.id) {
        console.warn(
          "⚠️ IDが見つからない行をスキップしました。ヘッダー名を確認してください。",
        );
        continue;
      }

      await setDoc(doc(db, "gt_players", player.id), {
        password: player.password || "000",
        generation: player.generation || "不明",
        number: Number(player.number) || 0,
        name: player.name || "名前なし",
        height: Number(player.height) || 0,
        weight: Number(player.weight) || 0,
        lastWeight: Number(player.weight) || 0,
        targetBmi: 22.0,
        updatedAt: new Date(),
      });

      console.log(`✅ 登録完了: ${player.name} (${player.id})`);
    }

    console.log("✨ 全選手のインポートが正常に完了しました！");
    process.exit(0);
  } catch (error) {
    console.error("❌ エラーが発生しました:");
    console.error(error.message);
    process.exit(1);
  }
}

importData();
