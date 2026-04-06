import React from "react";

export const StatBox = ({ label, value, unit, color }) => (
  <div className="py-2 px-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
    <p className="text-[8px] text-slate-500 font-black uppercase mb-0.5 tracking-tighter">
      {label}
    </p>
    <p
      className={`text-lg font-black italic tracking-tighter ${color || "text-white"}`}
    >
      {value}
      {unit && (
        <span className="text-[9px] opacity-30 ml-0.5 font-normal not-italic">
          {unit}
        </span>
      )}
    </p>
  </div>
);

export const ProgressBar = ({
  progress,
  colorClass = "from-indigo-500 to-purple-500",
}) => (
  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
    <div
      className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]`}
      style={{ width: `${progress}%` }}
    />
  </div>
);

export const TrendAdviceBox = ({ advice, predictedDays }) => (
  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 space-y-3 shadow-xl backdrop-blur-sm">
    <div className="flex justify-between items-start">
      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
        Trend Analysis
      </p>
      {predictedDays !== null && (
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-500 uppercase">
            Est. Arrival
          </p>
          <p className="text-lg font-black text-indigo-300 italic">
            {predictedDays} <span className="text-[10px] not-italic">days</span>
          </p>
        </div>
      )}
    </div>
    <p className="text-xs font-bold text-slate-200 leading-relaxed">{advice}</p>
  </div>
);

export const InputItem = ({ label, value, onChange }) => (
  <div className="space-y-1.5 text-left">
    <label className="text-[9px] font-black text-slate-500 ml-2 uppercase tracking-widest">
      {label}
    </label>
    <input
      type="number"
      step="0.1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-2xl font-black text-white outline-none focus:border-indigo-500 transition-all shadow-inner font-sans"
    />
  </div>
);

export const EditModal = ({
  tempData,
  setTempData,
  setShowModal,
  handleSaveChanges,
  loading,
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
    <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2.5rem] p-7 border border-white/10 shadow-2xl">
      <h3 className="text-center font-black text-xl mb-8 tracking-[0.2em] text-white uppercase italic">
        Update Stats
      </h3>
      <div className="space-y-5">
        <InputItem
          label="身長 (cm)"
          value={tempData.height}
          onChange={(v) => setTempData({ ...tempData, height: v })}
        />
        <InputItem
          label="体重 (kg)"
          value={tempData.weight}
          onChange={(v) => setTempData({ ...tempData, weight: v })}
        />
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 bg-white/5 text-slate-400 font-black py-5 rounded-2xl text-[10px] uppercase"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="flex-[1.5] bg-indigo-600 text-white font-black py-5 px-6 rounded-2xl shadow-xl text-[10px] uppercase"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  </div>
);
