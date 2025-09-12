// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyC10tfhWTXlms5b5E10GCS19yT2nUenPiw",

  authDomain: "twitter-clone-dc64d.firebaseapp.com",

  projectId: "twitter-clone-dc64d",

  storageBucket: "twitter-clone-dc64d.firebasestorage.app",

  messagingSenderId: "743472502985",

  appId: "1:743472502985:web:4048b7fbe93ccdf03b1518",
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
