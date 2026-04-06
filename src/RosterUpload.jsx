import React, { useState } from "react";
import { db } from "./firebase";
import { collection, doc, writeBatch, Timestamp } from "firebase/firestore";
import Papa from "papaparse";

/**
 * RosterUpload.jsx
 * エラー耐性を強化したデータインポートエンジン
 */
const RosterUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const getSimulatedStats = (generation, height) => {
    const hMeter = height / 100;
    let targetBMI = 20.0;

    // 学年別BMIバイアス
    const gen = parseInt(generation);
    if (gen === 18) targetBMI = 21.5;
    else if (gen === 19) targetBMI = 20.0;
    else if (gen === 20) targetBMI = 18.5;

    const variance = (Math.random() - 0.5) * 3.6;
    const finalBMI = targetBMI + variance;

    const currentWeight = parseFloat((finalBMI * (hMeter * hMeter)).toFixed(1));
    const startWeight = currentWeight - (1.5 + Math.random() * 1.5);

    return { currentWeight, startWeight };
  };

  const generateHistory = (startWeight, finalWeight) => {
    const history = [];
    const startDate = new Date("2026-02-01");
    const totalDiff = finalWeight - startWeight;

    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i * 14);

      const progress = i / 4;
      const weight = startWeight + totalDiff * progress + Math.random() * 0.2;

      history.push({
        date: Timestamp.fromDate(date),
        weight: parseFloat(weight.toFixed(1)),
      });
    }
    return history;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("Parsing CSV...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "\t", // タブ区切りを追加
      complete: async (results) => {
        const players = results.data;
        console.log("CSV Parsed:", players);

        let batch = writeBatch(db);
        let count = 0;
        let totalProcessed = 0;

        try {
          for (const p of players) {
            // CSVヘッダーの存在確認（デバッグ用）
            if (!p.id || !p.generation) {
              console.warn("Missing required fields for player:", p);
              continue;
            }

            const height = parseFloat(p.height) || 168.0;
            const { currentWeight, startWeight } = getSimulatedStats(
              p.generation,
              height,
            );

            const docId = String(p.id); // IDを文字列に強制
            const playerRef = doc(db, "gt_players", docId);

            // メインデータ
            batch.set(playerRef, {
              name: p.name || "Unknown Player",
              height: height,
              weight: currentWeight,
              lastWeight: startWeight,
              generation: parseInt(p.generation),
              rosterNum: p["roster-num"] || p.rosterNum || "00",
              password: String(p.password || ""),
              updatedAt: Timestamp.now(),
            });

            // 履歴データ生成
            const historyData = generateHistory(startWeight, currentWeight);
            historyData.forEach((h) => {
              // サブコレクションへの参照作成
              const hRef = doc(collection(playerRef, "history"));
              batch.set(hRef, h);
            });

            count++;
            totalProcessed++;

            // バッチ制限回避: 1選手6操作のため、最大80選手(480操作)ごとにコミット
            if (count >= 70) {
              setUploadStatus(`Uploading... (${totalProcessed} players)`);
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }

          // 残りのデータをコミット
          await batch.commit();
          setIsUploading(false);
          setUploadStatus("");
          alert(
            `ミッション完了！ ${totalProcessed}名のデータが同期されました。`,
          );
        } catch (error) {
          console.error("Firestore Upload Error:", error);
          setUploadStatus("Upload Failed.");
          setIsUploading(false);
          alert(
            "アップロード中にエラーが発生しました。コンソールを確認してください。",
          );
        }
      },
    });
  };

  return (
    <div className="p-10 bg-[#0a0a0c] text-white rounded-[2.5rem] border border-white/10 shadow-2xl max-w-lg w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-black italic text-indigo-400 uppercase tracking-widest leading-tight">
          Data Reset & Sync
        </h2>
        <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-tighter">
            System Status:
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Ready to re-deploy dummy data.
          </p>
        </div>
      </div>

      <div className="relative group">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="block w-full text-sm text-slate-500 
            file:mr-4 file:py-4 file:px-6 
            file:rounded-2xl file:border-0 
            file:text-xs file:font-black file:uppercase
            file:bg-indigo-600 file:text-white 
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:file:bg-indigo-700 transition-all cursor-pointer"
        />
      </div>

      {isUploading && (
        <div className="mt-8 flex flex-col items-center gap-4 py-4 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-indigo-400 animate-pulse uppercase tracking-[0.3em]">
            {uploadStatus}
          </p>
        </div>
      )}
    </div>
  );
};

export default RosterUpload;
