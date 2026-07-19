import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWYrkA4DzdQoOcbZyi1UP-x0imyQafmiM",
  authDomain: "expense-tracker-f0560.firebaseapp.com",
  projectId: "expense-tracker-f0560",
  storageBucket: "expense-tracker-f0560.firebasestorage.app",
  messagingSenderId: "1015482084016",
  appId: "1:1015482084016:web:40f6273eca16596b1ae975",
  measurementId: "G-BM5TM1T5N1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
