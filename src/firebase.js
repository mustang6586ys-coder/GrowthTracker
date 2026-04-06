// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// さっきコピーした内容をここに貼り付け
const firebaseConfig = {
  apiKey: "AIzaSyCrZgbffh4rIM8jSHt-gfQDtF-VAb9xQ4w",
  authDomain: "studio-9589898580-fb9a4.firebaseapp.com",
  projectId: "studio-9589898580-fb9a4",
  storageBucket: "studio-9589898580-fb9a4.firebasestorage.app",
  messagingSenderId: "948791930147",
  appId: "1:948791930147:web:26169b53120509fcdf3096",
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// データベース（Firestore）を使えるようにしてエクスポート
export const db = getFirestore(app);
