import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAXuQQATjq4ypUF9WTRUgL7rBgiACT7ADY",
  authDomain: "wastewatch-6cc08.firebaseapp.com",
  databaseURL: "https://wastewatch-6cc08-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wastewatch-6cc08",
  storageBucket: "wastewatch-6cc08.firebasestorage.app",
  messagingSenderId: "952423791847",
  appId: "1:952423791847:web:efe1805545ecc19f30f642",
  measurementId: "G-8XJ5P8ME32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };