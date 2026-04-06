/**
 * GrowthTracker 共通ロジック
 */

/**
 * 4月1日を起点とした学年計算
 * @param {number|string} generation 期生 (例: 19)
 * @returns {string} 新◯年生
 */
export const calculateGrade = (generation) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 4月1日より前なら、前年度扱い
  const currentAcademicYear = month < 4 ? year - 1 : year;

  // 19期生が2024年度に入学(1年生)と仮定
  // TODO: プロジェクトの基準年度に合わせて調整が必要
  const baseYear = 2024; // 19期生が1年生の年
  const baseGen = 19;

  const entryYear = baseYear - (generation - baseGen);
  const grade = currentAcademicYear - entryYear + 1;

  if (grade <= 0) return "新入生";
  if (grade > 3) return "OB";
  return `新${grade}年生`;
};

/**
 * BMI計算
 */
export const calcBMI = (weight, height) => {
  if (!weight || !height) return 0;
  return (Number(weight) / (Number(height) / 100) ** 2).toFixed(1);
};

/**
 * BMI進捗率マッピング (18.0 - 24.0 -> 0 - 100%)
 */
export const getBmiProgress = (bmi) => {
  const min = 18.0;
  const max = 24.0;
  const progress = ((bmi - min) / (max - min)) * 100;
  return Math.min(Math.max(progress, 0), 100).toFixed(1);
};

/**
 * トレンド予測とアドバイス
 * @param {Array} history 履歴データ
 * @param {Object} player プレイヤーデータ
 * @param {Object} nextRank 次のランク情報
 */
export const getTrendAdvice = (history, player, nextRank) => {
  if (!history || history.length < 2) {
    return {
      predictedDays: null,
      advice: "まずは2回以上の計測を完了させよう。増量の旅はここからだ！",
      dailyGain: 0,
    };
  }

  // 直近2週間の増減を簡易算出（最新と1つ前）
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];

  // 日数差の計算
  const d1 = new Date(
    latest.createdAt?.toDate ? latest.createdAt.toDate() : latest.date,
  );
  const d2 = new Date(
    previous.createdAt?.toDate ? previous.createdAt.toDate() : previous.date,
  );
  const daysDiff = Math.max((d1 - d2) / (1000 * 60 * 60 * 24), 1);

  const weightDiff = latest.weight - previous.weight;
  const dailyGain = weightDiff / daysDiff; // 1日あたりの増量(kg)

  if (dailyGain <= 0) {
    return {
      predictedDays: null,
      advice:
        "体重が停滞中。1食につき「白米あと1合」を追加して、エネルギーを充填せよ！",
      dailyGain: dailyGain.toFixed(3),
    };
  }

  if (!nextRank) {
    return {
      predictedDays: 0,
      advice: "最高ランク到達！現状を維持し、パワーを研ぎ澄ませ。",
      dailyGain: dailyGain.toFixed(3),
    };
  }

  // 次のランクまでの必要体重
  const targetWeight = nextRank.bmi * (player.height / 100) ** 2;
  const remainingWeight = targetWeight - latest.weight;
  const predictedDays = Math.ceil(remainingWeight / dailyGain);

  let advice = "";
  if (dailyGain < 0.07) {
    // 週0.5kg(1日0.07kg)未満
    advice = `ペースアップが必要だ。1日あと${((0.071 - dailyGain) * 1000).toFixed(0)}gの増量を目指し、補食を2回増やせ。`;
  } else {
    advice = "理想的な増量ペースだ。このリズムを崩さず、次のランクへ突き進め！";
  }

  return {
    predictedDays,
    advice,
    dailyGain: dailyGain.toFixed(3),
  };
};
