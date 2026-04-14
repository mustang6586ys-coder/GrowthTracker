import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RANKS } from "./constants";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { calcBMI } from "./utils";

const AdminPage = ({
  allPlayers,
  filterGen,
  setFilterGen,
  onLogout,
  onOpenEdit,
  onOpenUpload,
}) => {
  const [teamHistory, setTeamHistory] = useState([]);
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [sortKey, setSortKey] = useState("roster-num");
  const [sortOrder, setSortOrder] = useState("asc");

  const COLORS = {
    all: "#818cf8",
    gen18: "#f87171",
    gen19: "#fbbf24",
    gen20: "#34d399",
  };

  useEffect(() => {
    let isActive = true;
    const fetchAllTrends = async () => {
      if (allPlayers.length === 0) return;
      setLoadingGraph(true);
      const trends = {};
      try {
        const historyPromises = allPlayers.map((p) =>
          getDocs(collection(db, "gt_players", p.id, "history")),
        );
        const snapshots = await Promise.all(historyPromises);
snapshots.forEach((snap, index) => {
          const p = allPlayers[index];
          const genKey = `gen${p.generation}`;
          snap.forEach((doc) => {
            const data = doc.data();
            const ts = data.createdAt || data.date;
            const dateObj = ts?.toDate ? ts.toDate() : new Date();
            const dateStr = dateObj.toLocaleDateString("ja-JP", {
              month: "short",
              day: "numeric",
            });
            if (!trends[dateStr]) {
              trends[dateStr] = {
                date: dateStr,
                all: [],
                gen18: [],
                gen19: [],
                gen20: [],
                rawDate: dateObj.getTime(),
              };
            }
            const bmi = parseFloat(calcBMI(data.weight, p.height));
            trends[dateStr].all.push(bmi);
            if (trends[dateStr][genKey]) trends[dateStr][genKey].push(bmi);
          });
        });
        const chartData = Object.values(trends)
          .sort((a, b) => a.rawDate - b.rawDate)
          .map((d) => ({
            date: d.date,
            全体: d.all.length
              ? (d.all.reduce((a, b) => a + b, 0) / d.all.length).toFixed(2)
              : null,
            "18期": d.gen18.length
              ? (d.gen18.reduce((a, b) => a + b, 0) / d.gen18.length).toFixed(2)
              : null,
            "19期": d.gen19.length
              ? (d.gen19.reduce((a, b) => a + b, 0) / d.gen19.length).toFixed(2)
              : null,
            "20期": d.gen20.length
              ? (d.gen20.reduce((a, b) => a + b, 0) / d.gen20.length).toFixed(2)
              : null,
          }));

        if (isActive) {
          setTeamHistory(chartData);
        }
      } catch (e) {
        console.error(e);
      }
      if (isActive) {
        setLoadingGraph(false);
      }
    };
    fetchAllTrends();

    return () => {
      isActive = false;
    };
  }, [allPlayers]);

  const groups = useMemo(() => {
    return [
      { id: "all", label: "全体", color: COLORS.all },
      { id: "18", label: "18期", color: COLORS.gen18 },
      { id: "19", label: "19期", color: COLORS.gen19 },
      { id: "20", label: "20期", color: COLORS.gen20 },
    ].map((g) => {
      const filtered = allPlayers.filter((p) =>
        g.id === "all" ? true : String(p.generation) === g.id,
      );
      const currentAvg = filtered.length
        ? filtered.reduce(
            (acc, p) => acc + Number(calcBMI(p.weight, p.height)),
            0,
          ) / filtered.length
        : 0;
      const lastAvg = filtered.length
        ? filtered.reduce(
            (acc, p) =>
              acc + Number(calcBMI(p.lastWeight || p.weight, p.height)),
            0,
          ) / filtered.length
        : 0;
      return {
        ...g,
        avgBmi: currentAvg.toFixed(1),
        score: (currentAvg - lastAvg).toFixed(2),
      };
    });
  }, [allPlayers]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedPlayers = [...allPlayers]
    .filter((p) =>
      filterGen === "all" ? true : String(p.generation) === filterGen,
    )
    .sort((a, b) => {
      const getVal = (obj, key) => {
        if (key === "bmi") return Number(calcBMI(obj.weight, obj.height));
        const gen = String(obj.generation || "");
        const numRaw = String(obj["roster-num"] || obj.rosterNum || "0");
        const num = numRaw.slice(-2).padStart(2, "0");
        return Number(gen + num);
      };

      const valA = getVal(a, sortKey);
      const valB = getVal(b, sortKey);
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-3 font-sans pb-24 selection:bg-indigo-500/30">
      {/* Command Center Header */}
      <header className="flex justify-between items-center mb-4 bg-white/5 p-4 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/20">
            <span className="text-white font-black text-xs italic">GT</span>
          </div>
          <div>
            <h1 className="text-xs font-black italic tracking-tighter uppercase leading-none mb-1">
              Command <span className="text-indigo-400">Center</span>
            </h1>
            <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 font-black uppercase tracking-widest">
              Administrator
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpenUpload}
            className="text-[9px] font-black px-4 py-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 active:scale-95 transition-all hover:bg-indigo-500/20 tracking-widest uppercase"
          >
            Data Sync
          </button>
          <button
            onClick={onLogout}
            className="text-[9px] font-black px-4 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 active:scale-95 transition-all hover:bg-rose-500/20 tracking-widest uppercase"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Analytics Graph */}
      <div className="bg-[#111114] rounded-[2.5rem] p-6 border border-white/5 mb-6 shadow-2xl relative h-[240px]">
        {!loadingGraph && (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={teamHistory}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff05"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#475569"
                fontSize={8}
                tickLine={false}
                axisLine={false}
              />
              <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1c1c1e",
                  border: "none",
                  borderRadius: "16px",
                  fontSize: "10px",
                  fontWeight: "900",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }}
              />
              <Line
                type="monotone"
                dataKey="全体"
                stroke={COLORS.all}
                strokeWidth={4}
                dot={false}
                animationDuration={2000}
              />
              <Line
                type="monotone"
                dataKey="18期"
                stroke={COLORS.gen18}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="19期"
                stroke={COLORS.gen19}
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="20期"
                stroke={COLORS.gen20}
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Generation Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setFilterGen(g.id)}
            className={`flex flex-col items-center p-4 rounded-[1.5rem] border transition-all duration-300 ${filterGen === g.id ? "bg-white/10 border-white/20 shadow-xl" : "bg-white/5 border-transparent opacity-40 hover:opacity-100"}`}
          >
            <span
              className="text-[7px] font-black uppercase mb-1.5 tracking-widest"
              style={{ color: g.color }}
            >
              {g.label}
            </span>
            <span className="text-xl font-black italic tracking-tighter mb-1 leading-none">
              {g.avgBmi}
            </span>
            <span
              className={`text-[8px] font-black ${Number(g.score) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {Number(g.score) > 0 ? `+${g.score}` : g.score}
            </span>
          </button>
        ))}
      </div>

      {/* Roster Matrix */}
      <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-6 px-2">
          <button
            onClick={() => toggleSort("roster-num")}
            className={`text-[9px] font-black uppercase tracking-[0.3em] transition-colors ${sortKey === "roster-num" ? "text-indigo-400" : "text-slate-600"}`}
          >
            Roster Matrix{" "}
            {sortKey === "roster-num" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => toggleSort("bmi")}
            className={`text-[9px] font-black uppercase tracking-[0.3em] transition-colors ${sortKey === "bmi" ? "text-indigo-400" : "text-slate-600"}`}
          >
            BMI Sort {sortKey === "bmi" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
          {sortedPlayers.map((p) => {
            const bmi = calcBMI(p.weight, p.height);
            const rank = RANKS.reduce(
              (prev, curr) => (bmi >= curr.bmi ? curr : prev),
              RANKS[0],
            );
            const genStr = String(p.generation || "");
            const numStr = String(p["roster-num"] || p.rosterNum || "")
              .slice(-2)
              .padStart(2, "0");
            const rNum = genStr + numStr;

            return (
              <div
                key={p.id}
                className="group bg-white/[0.03] active:scale-[0.98] rounded-2xl p-4 flex items-center justify-between border border-white/5 transition-all hover:bg-white/[0.06] cursor-pointer"
                onClick={() => onOpenEdit(p)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-9 rounded-xl bg-[#0a0a0c] border border-white/10 flex items-center justify-center text-[10px] font-black text-indigo-400 px-1 shadow-inner">
                    {rNum}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-100 mb-0.5">
                      {p.name}
                    </p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                      {p.height}cm / {p.weight}kg
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[14px] text-indigo-400 font-black italic tracking-tighter leading-none">
                      {bmi}
                    </span>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] text-black bg-gradient-to-br ${rank.color} shadow-lg shadow-white/5`}
                  >
                    {rank.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="mt-8 text-center">
        <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
          Command Center Matrix v4.0
        </p>
      </footer>
    </div>
  );
};

export default AdminPage;
