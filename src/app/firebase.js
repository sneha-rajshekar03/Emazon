// Import the Firebase functions you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgr1fQC5KFhgh-9aVCvHcaRE_GT7x1KVA",
  authDomain: "emzon-b8feb.firebaseapp.com",
  projectId: "emzon-b8feb",
  storageBucket: "emzon-b8feb.firebasestorage.app",
  messagingSenderId: "941950569459",
  appId: "1:941950569459:web:1c44e2aedb9699433f2086",
  measurementId: "G-XGB6M0847P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, auth, analytics };
np;
