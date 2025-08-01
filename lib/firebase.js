// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAyhU1kcboL4-hLDIwshEfUT_rFXJRVJaQ",
  authDomain: "peerup-64fbf.firebaseapp.com",
  projectId: "peerup-64fbf",
  storageBucket: "peerup-64fbf.firebasestorage.app",
  messagingSenderId: "824987992193",
  appId: "1:824987992193:web:725cc00d06646f98b6cd80",
  measurementId: "G-NDNET3EEG6"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics only on client side
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => yes ? getAnalytics(app) : null).catch(() => null);
}

// Initialize Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, GoogleAuthProvider };