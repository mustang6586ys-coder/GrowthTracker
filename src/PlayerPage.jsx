import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RANKS } from "./constants";
import { StatBox, ProgressBar, TrendAdviceBox } from "./components";
import {
  calculateGrade,
  calcBMI,
  getBmiProgress,
  getTrendAdvice,
} from "./utils";

const PlayerPage = ({ player, history, onLogout, onOpenEdit }) => {
  const bmiValue = parseFloat(calcBMI(player.weight, player.height));
  const gradeLabel = calculateGrade(player.generation);
  const bmiProgress = getBmiProgress(bmiValue);

  // 現在のランク取得
  const currentRank = RANKS.reduce(
    (prev, curr) => (bmiValue >= curr.bmi ? curr : prev),
    RANKS[0],
  );

  // 次のランク
  const nextRank = RANKS.find((r) => r.bmi > bmiValue);

  // トレンド分析
  const trend = getTrendAdvice(history, player, nextRank);

  // --- 目標計算 (AAA) ---
  const ultimateTargetBmi = 22.0;
  const ultimateGoalWeight = (
    ultimateTargetBmi *
    (player.height / 100) ** 2
  ).toFixed(1);
  const ultimateDiff = (ultimateGoalWeight - player.weight).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-3 md:p-4 font-sans pb-24 selection:bg-indigo-500/30">
      <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header: High Density / Glassmorphism */}
        <header className="flex justify-between items-center bg-white/5 p-4 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/20">
              G
            </div>
            <div className="text-left leading-tight">
              <div className="flex items-baseline gap-1.5">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                  {player.generation}期生
                </p>
                <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded-full text-slate-400 font-black">
                  {gradeLabel}
                </span>
              </div>
              <p className="text-sm font-black text-slate-100 tracking-tight">
                #{player["roster-num"]} {player.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onOpenEdit}
              className="text-indigo-400 text-[10px] font-black px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 uppercase tracking-widest active:scale-95 transition-all"
            >
              Update
            </button>
            <button
              onClick={onLogout}
              className="text-slate-500 text-[10px] font-bold px-3 py-2 border border-white/5 rounded-xl uppercase tracking-widest active:scale-95 transition-all"
            >
              Exit
            </button>
          </div>
        </header>

        {/* Rank Hero: Neon Style */}
        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/5 opacity-50"></div>
          <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase relative z-10 mb-2">
            Physical Rank
          </p>
          <div className="relative z-10 py-4">
            <h2
              className={`text-[8.5rem] font-black bg-gradient-to-b ${currentRank.color} bg-clip-text text-transparent leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
            >
              {currentRank.id}
            </h2>
            <p className="text-xs font-black text-indigo-400/80 tracking-[0.2em] uppercase mt-2">
              {currentRank.label}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-8 border-t border-white/5 relative z-10">
            <StatBox
              label="BMI"
              value={bmiValue.toFixed(1)}
              color="text-indigo-400"
            />
            <StatBox label="Height" value={player.height} unit="cm" />
            <StatBox label="Weight" value={player.weight} unit="kg" />
          </div>

          {/* BMI Progress Bar (Mapping 18-24) */}
          <div className="mt-8 space-y-2 relative z-10">
            <div className="flex justify-between items-end px-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Growth Map
              </p>
              <p className="text-[10px] font-black text-white italic">
                {bmiProgress}%
              </p>
            </div>
            <ProgressBar
              progress={bmiProgress}
              colorClass={`bg-gradient-to-r ${currentRank.color}`}
            />
            <div className="flex justify-between text-[7px] font-black text-slate-600 px-1 uppercase tracking-tighter">
              <span>Foundation (18.0)</span>
              <span>Unicorn (24.0+)</span>
            </div>
          </div>
        </div>

        {/* Trend Analysis Section (New) */}
        <TrendAdviceBox
          advice={trend.advice}
          predictedDays={trend.predictedDays}
        />

        {/* Growth Curve */}
        <div className="bg-[#111114] rounded-[2.2rem] p-6 border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              History
            </p>
            <p className="text-[9px] font-bold text-slate-500 uppercase">
              Weight Trend (kg)
            </p>
          </div>
          <div className="h-[180px] w-full">
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff05"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#334155"
                    fontSize={9}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1c1c1e",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "11px",
                      fontWeight: "900",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{ color: "#818cf8" }}
                    cursor={{ stroke: "#4f46e5", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorW)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[10px] text-slate-600 border border-dashed border-white/10 rounded-3xl uppercase tracking-[0.2em] gap-2">
                <span className="text-xl opacity-20">📊</span>
                Waiting for Data
              </div>
            )}
          </div>
        </div>

        {/* Next Goal: AAA Focus */}
        <div className="bg-gradient-to-br from-indigo-900/40 via-[#0a0a0c] to-[#0a0a0c] rounded-[2.5rem] p-7 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full"></div>

          <div className="grid grid-cols-2 gap-8 relative z-10">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                Target Weight
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white italic tracking-tighter">
                  {ultimateGoalWeight}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">
                  kg
                </span>
              </div>
              <p className="text-[8px] font-bold text-slate-500">
                Standard: AAA (BMI 22.0)
              </p>
            </div>

            <div className="text-right space-y-1">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                Required
              </p>
              <div className="flex items-baseline justify-end gap-1">
                <span
                  className={`text-4xl font-black italic tracking-tighter ${Number(ultimateDiff) > 0 ? "text-rose-500" : "text-emerald-400"}`}
                >
                  {Number(ultimateDiff) > 0 ? `+${ultimateDiff}` : "DONE"}
                </span>
                {Number(ultimateDiff) > 0 && (
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    kg
                  </span>
                )}
              </div>
              <p className="text-[8px] font-bold text-slate-500 uppercase">
                Until Team Standard
              </p>
            </div>
          </div>
        </div>

        <footer className="text-center space-y-2 py-4">
          <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
            Growth Tracker / Command Center v4.0
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PlayerPage;
