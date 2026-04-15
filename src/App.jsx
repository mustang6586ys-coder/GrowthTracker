import React, { useState } from "react";
import { db } from "./firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import AdminPage from "./AdminPage";
import PlayerPage from "./PlayerPage";
// ✨ components から EditModal を持ってくる
import { EditModal } from "./components";
import RosterUpload from "./RosterUpload";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [player, setPlayer] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [filterGen, setFilterGen] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchHistory = async (playerId) => {
    const q = query(
      collection(db, "gt_players", playerId, "history"),
      orderBy("createdAt", "asc"),
    );
    const snap = await getDocs(q);
    setHistory(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        date:
          d
            .data()
            .createdAt?.toDate()
            .toLocaleDateString("ja-JP", { month: "short", day: "numeric" }) ||
          "",
      })),
    );
  };

  const handleLogin = async () => {
    setLoading(true);
    if (loginId === "admin" && password === "edogawa-power") {
      const snap = await getDocs(collection(db, "gt_players"));
      setAllPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setIsAdmin(true);
      setIsLoggedIn(true);
    } else {
      const snap = await getDoc(doc(db, "gt_players", loginId));
      if (snap.exists() && String(snap.data().password) === password) {
        setPlayer({ id: snap.id, ...snap.data() });
        await fetchHistory(snap.id);
        setIsAdmin(false);
        setIsLoggedIn(true);
      } else {
        alert("失敗");
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const targetId = isAdmin ? tempData.id : player.id;
    const update = {
      height: Number(tempData.height),
      weight: Number(tempData.weight),
      lastWeight: isAdmin ? tempData.weight : player.weight,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, "gt_players", targetId), update);
    await addDoc(collection(db, "gt_players", targetId, "history"), {
      weight: update.weight,
      createdAt: serverTimestamp(),
    });
    if (isAdmin) {
      const snap = await getDocs(collection(db, "gt_players"));
      setAllPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } else {
      setPlayer({ ...player, ...update });
      await fetchHistory(targetId);
    }
    setShowModal(false);
    setLoading(false);
  };

  if (!isLoggedIn)
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 font-sans text-center">
        <div className="w-full max-w-xs space-y-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center font-black text-4xl shadow-2xl shadow-indigo-500/40">
            G
          </div>
          <div className="space-y-4">
            <input
              placeholder="PLAYER ID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoCapitalize="none" // 勝手に大文字にしない
              spellCheck="false" // 赤い波線を出さない
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-center outline-none focus:border-indigo-500 tracking-widest"
            />
            <input
              type="password"
              placeholder="PASS"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-center outline-none"
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-indigo-600 font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              {loading ? "CONNECTING..." : "ENTER"}
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <>
      {isAdmin ? (
        <div className="relative">
          {/* 👈 アップロード画面のオーバーレイを追加 */}
          {showUpload && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
              <div className="relative w-full max-w-xl flex flex-col items-center">
                <RosterUpload />
                <button
                  onClick={() => setShowUpload(false)}
                  className="mt-8 text-white/30 hover:text-white uppercase text-[10px] font-black tracking-[0.4em] border border-white/10 px-6 py-2 rounded-full transition-all"
                >
                  Close and View Dashboard
                </button>
              </div>
            </div>
          )}

          <AdminPage
            allPlayers={allPlayers}
            filterGen={filterGen}
            setFilterGen={setFilterGen}
            onLogout={() => setIsLoggedIn(false)}
            onOpenEdit={(p) => {
              setTempData(p);
              setShowModal(true);
            }}
            onOpenUpload={() => setShowUpload(true)} // 👈 追加
          />
        </div>
      ) : (
        <PlayerPage
          player={player}
          history={history}
          onLogout={() => setIsLoggedIn(false)}
          onOpenEdit={() => {
            setTempData(player);
            setShowModal(true);
          }}
        />
      )}
      {showModal && (
        <EditModal
          tempData={tempData}
          setTempData={setTempData}
          setShowModal={setShowModal}
          handleSaveChanges={handleSave}
          loading={loading}
        />
      )}
    </>
  );
}

export default App;
