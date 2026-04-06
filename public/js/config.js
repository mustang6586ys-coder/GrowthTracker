import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKsf9cgh0oJFrDko-j5ma8u3DIxPbWAho",
  authDomain: "pitch-tracker-pro-b73a9.firebaseapp.com",
  projectId: "pitch-tracker-pro-b73a9",
  storageBucket: "pitch-tracker-pro-b73a9.firebasestorage.app",
  messagingSenderId: "917495280819",
  appId: "1:917495280819:web:0948d35de4d86a8f8fecc6",
};

// 1. まず Firebase 本体を起動して "app" という名前にする
const app = initializeApp(firebaseConfig);

// 2. その "app" を使って データベース(db) を起動し、export する
export const db = getFirestore(app);
