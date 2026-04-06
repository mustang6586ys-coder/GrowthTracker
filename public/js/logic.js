// logic.js (計算と演出の心臓部)
import { db } from "./config.js";

const CONFIG = {
  RANK_LIMITS: { UME: 20.0, TAKE: 22.0, MATSU: 24.0, UNICORN: 26.0 },
  COLORS: {
    UME: "#cd7f32",
    TAKE: "#9da5a8",
    MATSU: "#ffd700",
    UNICORN: "magenta",
  },
};

const calcBMI = (h, w) => parseFloat((w / (h / 100) ** 2).toFixed(1));

const mockSaveAndFetchStats = async (bmi) => {
  await new Promise((r) => setTimeout(r, 1200));
  return { median: 21.5, top: 25.2 };
};

const updateRankUI = (bmi) => {
  const badge = document.getElementById("rank-badge");
  if (!badge) return;
  badge.classList.remove("unicorn-mode");

  if (bmi >= CONFIG.RANK_LIMITS.UNICORN) {
    badge.innerText = "UNICORN";
    badge.classList.add("unicorn-mode");
  } else if (bmi >= CONFIG.RANK_LIMITS.MATSU) {
    badge.innerText = "松 (プロ級)";
    badge.style.background = CONFIG.COLORS.MATSU;
  } else if (bmi >= CONFIG.RANK_LIMITS.TAKE) {
    badge.innerText = "竹 (アスリート)";
    badge.style.background = CONFIG.COLORS.TAKE;
  } else if (bmi >= CONFIG.RANK_LIMITS.UME) {
    badge.innerText = "梅 (アマチュア)";
    badge.style.background = CONFIG.COLORS.UME;
  } else {
    badge.innerText = "育成中";
    badge.style.background = "#888";
  }
};

const renderGoalProgress = (h, w, bmi) => {
  let nextTarget = CONFIG.RANK_LIMITS.UME;
  if (bmi >= CONFIG.RANK_LIMITS.MATSU) nextTarget = CONFIG.RANK_LIMITS.UNICORN;
  else if (bmi >= CONFIG.RANK_LIMITS.TAKE)
    nextTarget = CONFIG.RANK_LIMITS.MATSU;
  else if (bmi >= CONFIG.RANK_LIMITS.UME) nextTarget = CONFIG.RANK_LIMITS.TAKE;

  const targetW = nextTarget * (h / 100) ** 2;
  const diff = (targetW - w).toFixed(1);
  const progress = Math.min((bmi / nextTarget) * 100, 100);

  const gauge = document.getElementById("gauge-fill");
  if (gauge) gauge.style.width = progress + "%";

  const msgObj = document.getElementById("goal-msg");
  if (msgObj) {
    msgObj.innerText =
      bmi >= CONFIG.RANK_LIMITS.UNICORN
        ? "伝説の体格！維持せよ！"
        : `次の目標まで あと ${diff}kg`;
  }
};

const animateValue = (id, start, end, duration, prefix = "") => {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = prefix + (progress * (end - start) + start).toFixed(1);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
};

// メイン関数を window に登録して HTML から呼べるようにする
window.handleLogicFlow = async () => {
  console.log("Button clicked!"); // 動作確認用のログ

  const hInput = document.getElementById("height");
  const wInput = document.getElementById("weight");
  if (!hInput || !wInput) return;

  const h = parseFloat(hInput.value);
  const w = parseFloat(wInput.value);

  if (!h || !w || h < 100 || w < 20) return alert("正しい数値を入力してね！");

  const bmi = calcBMI(h, w);
  const btn = document.querySelector(".btn-submit");
  if (btn) {
    btn.innerText = "解析中...";
    btn.disabled = true;
  }

  try {
    const stats = await mockSaveAndFetchStats(bmi);

    document.getElementById("input-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "block";

    updateRankUI(bmi);
    animateValue("bmi-out", 0, bmi, 1000, "BMI ");
    renderGoalProgress(h, w, bmi);

    document.getElementById("med-val").innerText = stats.median;
    document.getElementById("top-val").innerText = stats.top;
  } catch (e) {
    console.error("Error details:", e);
    alert("エラーが発生しました。コンソールを確認してください。");
  } finally {
    if (btn) {
      btn.innerText = "解析する";
      btn.disabled = false;
    }
  }
};
