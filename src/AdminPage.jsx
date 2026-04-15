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
  const [timeRange, setTimeRange] = useState("3m");

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
            rawDate: d.rawDate,
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

  const measurementStatus = useMemo(() => {
    const REFERENCE_MONDAY = new Date("2026-04-06T00:00:00");
    const CYCLE_DAYS = 14;
    const now = new Date();

    const diffMs = now - REFERENCE_MONDAY;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const cycleIndex = Math.floor(diffDays / CYCLE_DAYS);

    const currentMonday = new Date(REFERENCE_MONDAY);
    currentMonday.setDate(REFERENCE_MONDAY.getDate() + cycleIndex * CYCLE_DAYS);

    const currentFriday = new Date(currentMonday);
    currentFriday.setDate(currentMonday.getDate() + 4);
    currentFriday.setHours(19, 0, 0, 0);

    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + CYCLE_DAYS);

    const inWindow = now >= currentMonday && now <= currentFriday;

    const weekLabel = `${currentMonday.getMonth() + 1}/${currentMonday.getDate()}（月）〜${currentMonday.getDate() + 4}（金）`;

    const daysUntilNext = Math.ceil((nextMonday - now) / (1000 * 60 * 60 * 24));

    const notSubmitted = inWindow
      ? allPlayers.filter((p) => {
          if (!p.updatedAt) return true;
          const updated = p.updatedAt.toDate ? p.updatedAt.toDate() : new Date(p.updatedAt);
          return updated < currentMonday;
        })
      : [];

    return { inWindow, weekLabel, daysUntilNext, notSubmitted, currentMonday, currentFriday };
  }, [allPlayers]);

  const RANGE_OPTIONS = [
    { key: "3m",  label: "3M",  days: 90  },
    { key: "6m",  label: "6M",  days: 180 },
    { key: "1y",  label: "1Y",  days: 365 },
    { key: "2y",  label: "2Y",  days: 730 },
    { key: "all", label: "ALL", days: null },
  ];

  const filteredHistory = useMemo(() => {
    const opt = RANGE_OPTIONS.find((o) => o.key === timeRange);
    if (!opt || !opt.days) return teamHistory;
    const cutoff = Date.now() - opt.days * 24 * 60 * 60 * 1000;
    return teamHistory.filter((d) => d.rawDate >= cutoff);
  }, [teamHistory, timeRange]);

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
      filterGen === null || filterGen === "all" ? true : String(p.generation) === filterGen,
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
      <div className="bg-[#111114] rounded-[2.5rem] p-6 border border-white/5 mb-6 shadow-2xl">
        <div className="flex justify-end mb-3 gap-1">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setTimeRange(o.key)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                timeRange === o.key
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-white/5 text-slate-500 hover:text-slate-300"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="h-[180px]">
          {!loadingGraph && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory}>
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
                {(filterGen === null || filterGen === "all") && (
                  <Line type="monotone" dataKey="全体" stroke={COLORS.all} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                )}
                {(filterGen === null || filterGen === "18") && (
                  <Line type="monotone" dataKey="18期" stroke={COLORS.gen18} strokeWidth={2} dot={false} />
                )}
                {(filterGen === null || filterGen === "19") && (
                  <Line type="monotone" dataKey="19期" stroke={COLORS.gen19} strokeWidth={2} dot={false} />
                )}
                {(filterGen === null || filterGen === "20") && (
                  <Line type="monotone" dataKey="20期" stroke={COLORS.gen20} strokeWidth={2} dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Generation Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setFilterGen(filterGen === g.id ? null : g.id)}
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

      {/* Measurement Week Status */}
      <div className={`rounded-[2rem] p-5 border mb-6 ${measurementStatus.inWindow ? "bg-rose-500/10 border-rose-500/20" : "bg-white/5 border-white/10"}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${measurementStatus.inWindow ? "text-rose-400" : "text-slate-500"}`}>
              {measurementStatus.inWindow ? "⚡ 測定週 — 未入力チェック" : "測定週ステータス"}
            </p>
            <p className="text-xs font-black text-slate-300">{measurementStatus.weekLabel}</p>
          </div>
          {!measurementStatus.inWindow && (
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-500 uppercase">Next week in</p>
              <p className="text-xl font-black text-indigo-400 italic">{measurementStatus.daysUntilNext}<span className="text-[10px] not-italic ml-1">days</span></p>
            </div>
          )}
          {measurementStatus.inWindow && (
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-500 uppercase">未入力</p>
              <p className="text-xl font-black text-rose-400 italic">{measurementStatus.notSubmitted.length}<span className="text-[10px] not-italic ml-1">名</span></p>
            </div>
          )}
        </div>
        {measurementStatus.inWindow && measurementStatus.notSubmitted.length > 0 && (
          <div className="mt-3 pt-3 border-t border-rose-500/20 flex flex-wrap gap-2">
            {measurementStatus.notSubmitted.map((p) => {
              const genStr = String(p.generation || "");
              const numStr = String(p["roster-num"] || p.rosterNum || "").slice(-2).padStart(2, "0");
              return (
                <span key={p.id} className="text-[10px] font-black bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded-xl border border-rose-500/20">
                  {genStr}{numStr} {p.name}
                </span>
              );
            })}
          </div>
        )}
        {measurementStatus.inWindow && measurementStatus.notSubmitted.length === 0 && (
          <p className="text-xs font-black text-emerald-400 mt-2">全員入力済み！</p>
        )}
      </div>

      {/* Roster Matrix */}
      <div className="bg-white/5 rounded-[2.5rem] p-3 border border-white/10 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            onClick={() => toggleSort("roster-num")}
            className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${sortKey === "roster-num" ? "text-indigo-400" : "text-slate-600"}`}
          >
            Roster Matrix{" "}
            {sortKey === "roster-num" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => toggleSort("bmi")}
            className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${sortKey === "bmi" ? "text-indigo-400" : "text-slate-600"}`}
          >
            BMI Sort {sortKey === "bmi" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>

        <div className="space-y-1.5 max-h-[600px] overflow-y-auto no-scrollbar">
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
                className="group bg-white/[0.03] active:scale-[0.98] rounded-2xl px-2 py-3 flex items-center justify-between border border-white/5 transition-all hover:bg-white/[0.06] cursor-pointer"
                onClick={() => onOpenEdit(p)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 rounded-xl bg-[#0a0a0c] border border-white/10 flex items-center justify-center text-sm font-black text-indigo-400 px-1 shadow-inner shrink-0">
                    {rNum}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-100 mb-0.5">
                      {p.name}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 tracking-tight">
                      {p.height}cm / {p.weight}kg
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg text-indigo-400 font-black italic tracking-tighter leading-none">
                    {bmi}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs text-black bg-gradient-to-br ${rank.color} shadow-lg shadow-white/5 shrink-0`}
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
