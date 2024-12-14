// lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  push,
  onValue,
} from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAijDn8PFMEoZR-1rE0knfsdGYWkqV_sNs",
  authDomain: "fir-cloud-9b508.firebaseapp.com",
  databaseURL:
    "https://fir-cloud-9b508-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fir-cloud-9b508",
  storageBucket: "fir-cloud-9b508.firebasestorage.app",
  messagingSenderId: "92325678928",
  appId: "1:92325678928:web:6875825d7fdfebf7702655",
  measurementId: "G-2H2G8BJMG5",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, child, push, onValue };
