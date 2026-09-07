/**
 * AgriFlow AI - Client-Side Firebase SDK Initializer & Service Helpers
 * Compatible with Next.js 15 App Router & Standalone Web Clients
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  getFunctions, 
  httpsCallable 
} from "firebase/functions";
import { getStorage } from "firebase/storage";

// Firebase Project Configuration (Replace with your Firebase Console credentials or environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForLocalDevAndEmulators123",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sih-2026-cdc21.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sih-2026-cdc21",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sih-2026-cdc21.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "102938475610",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:102938475610:web:abcdef1234567890"
};

// Singleton App Initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
export const storage = getStorage(app);

// ============================================================================
// 📱 AUTHENTICATION & CELLULAR OTP HELPERS
// ============================================================================

/**
 * Setup Invisible reCAPTCHA verifier for Firebase Phone Auth
 */
export const setupRecaptchaVerifier = (buttonId: string) => {
  if (typeof window === "undefined") return null;
  return new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
    callback: () => {
      console.log("reCAPTCHA verified successfully");
    }
  });
};

/**
 * Send SMS OTP via Fast2SMS Cloud Function
 */
export const sendFast2SmsOtp = async (phone: string, purpose: string = "Farmer Login") => {
  const sendOtpCallable = httpsCallable(functions, "sendCellularOtp");
  const result: any = await sendOtpCallable({ phone, purpose });
  return result.data;
};

/**
 * Verify SMS OTP and Login with Custom Token
 */
export const verifyFast2SmsOtpAndLogin = async (phone: string, enteredOtp: string) => {
  const verifyCallable = httpsCallable(functions, "verifyCellularOtp");
  const result: any = await verifyCallable({ phone, enteredOtp });
  if (result.data?.customToken) {
    const userCredential = await signInWithCustomToken(auth, result.data.customToken);
    return { user: userCredential.user, profile: result.data.user };
  }
  return result.data;
};

// ============================================================================
// 🔒 ESCROW & PROCUREMENT HELPERS
// ============================================================================

export const lockEscrowForOrder = async (orderData: {
  orderId: string;
  farmerId: string;
  cropId: string;
  cropName: string;
  totalAmount: number;
  quantityKg: number;
}) => {
  const lockCallable = httpsCallable(functions, "createEscrowLock");
  const result: any = await lockCallable(orderData);
  return result.data;
};

export const releaseEscrowForOrder = async (orderId: string) => {
  const releaseCallable = httpsCallable(functions, "releaseEscrowPayout");
  const result: any = await releaseCallable({ orderId });
  return result.data;
};

// ============================================================================
// 🤖 ROCKY AI ASSISTANT HELPER
// ============================================================================

export const askRockyAiBackend = async (queryText: string, language: string = "en") => {
  const rockyCallable = httpsCallable(functions, "rockyAiAssistant");
  const result: any = await rockyCallable({ query: queryText, language });
  return result.data;
};

// ============================================================================
// 📊 REALTIME FIRESTORE SUBSCRIPTIONS
// ============================================================================

export const subscribeToMarketplaceCrops = (callback: (crops: any[]) => void) => {
  const cropsCollection = collection(db, "crops");
  return onSnapshot(cropsCollection, (snapshot) => {
    const crops = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(crops);
  });
};

export const subscribeToTruckTelematics = (orderId: string, callback: (data: any[]) => void) => {
  const telematicsRef = collection(db, "telematics");
  const q = query(telematicsRef, where("orderId", "==", orderId), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(logs);
  });
};
