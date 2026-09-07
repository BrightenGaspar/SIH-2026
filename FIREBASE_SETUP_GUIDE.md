# 🚀 AgriFlow AI - Complete Firebase Backend Setup & Deployment Guide
**Smart India Hackathon 2026 (Problem Statement 33)**

This guide provides everything needed to configure, test, and deploy the production-ready Firebase backend for **AgriFlow AI**.

---

## 🏗️ 1. Architecture Overview

| Service | Purpose in AgriFlow AI |
| :--- | :--- |
| **Firebase Authentication** | 6-Digit SIM SMS Phone Auth, Role Custom Claims (Farmer, Buyer, FPO, Admin). |
| **Cloud Firestore** | Real-time NoSQL DB for 40+ Vegetables, Orders, Escrow Vault, IoT Telematics. |
| **Firebase Cloud Functions (v2)** | Fast2SMS Gateway API, Escrow Lock/Payout Engine, Rocky AI Regional Voice Engine. |
| **Firebase Cloud Storage** | Crop harvest photos, GI origin certificates, Lab test reports. |
| **Firestore Security Rules** | Granular RBAC ensuring escrow immutability & sensor privacy. |
| **Cloud Scheduler (Cron)** | Daily 6:00 AM automated APMC Mandi & MSP Price Floor synchronization. |

---

## 📋 2. Prerequisites

1. Install **Node.js** (v18 or v20+ recommended)
2. Install the **Firebase CLI**:
```bash
npm install -g firebase-tools
```
3. Login to your Google / Firebase Account:
```bash
firebase login
```

---

## ⚡ 3. Quick-Start Local Development (Firebase Emulator Suite)

The repository includes pre-configured settings for the Firebase Emulator Suite (Auth, Firestore, Cloud Functions, Storage, UI).

1. Install backend dependencies in the `functions/` folder:
```bash
cd functions
npm install
cd ..
```

2. Start the local emulators:
```bash
firebase emulators:start
```

3. Open the **Firebase Emulator UI** at:
👉 **`http://localhost:4000`**
- Firestore Database: `http://localhost:8080`
- Functions: `http://localhost:5001`
- Auth: `http://localhost:9099`

---

## 🌐 4. Connecting to Live Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and click **"Add project"** (e.g. `agriflow-ai-sih2026`).
2. Enable the following services in the console:
   - **Authentication**: Enable **Phone** and **Email/Password** providers.
   - **Firestore Database**: Click **Create database** (Start in production mode).
   - **Storage**: Click **Get started**.
3. Link your local directory to your Firebase project:
```bash
firebase use --add
```
(Select your newly created project from the list)

---

## 🔑 5. Environment Variables & Fast2SMS API Key

To enable real cellular SMS text message delivery via **Fast2SMS**:
1. Get your free API Key from [Fast2SMS](https://www.fast2sms.com).
2. Set the environment variable for Cloud Functions:
```bash
firebase functions:secrets:set FAST2SMS_KEY
# Enter your Fast2SMS authorization key when prompted
```

For client-side configuration in Next.js, add the following to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🚀 6. Deploying to Production

Deploy the entire backend suite (Security Rules, Storage Rules, Cloud Functions, Firestore Indexes) with a single command:

```bash
firebase deploy
```

Or deploy individual components:
- **Deploy Cloud Functions only**: `firebase deploy --only functions`
- **Deploy Firestore Rules only**: `firebase deploy --only firestore:rules`
- **Deploy Storage Rules only**: `firebase deploy --only storage`

---

## 📡 7. Available Cloud Function Endpoints

| Function Name | Trigger | Description |
| :--- | :--- | :--- |
| `sendCellularOtp` | Callable (`httpsCallable`) | Sends 6-digit OTP via Fast2SMS cellular gateway to 10-digit SIM. |
| `verifyCellularOtp` | Callable (`httpsCallable`) | Strictly verifies entered OTP and generates Firebase Custom Auth Token. |
| `createEscrowLock` | Callable (`httpsCallable`) | Locks buyer funds into secure escrow vault with temp limits (2°C–8°C). |
| `ingestTruckTelematics`| Callable / HTTPS | Records live IoT temperature/GPS and checks for cold-chain breaches. |
| `releaseEscrowPayout` | Callable (`httpsCallable`) | Transfers locked funds directly to Farmer's wallet/bank upon delivery. |
| `rockyAiAssistant` | Callable (`httpsCallable`) | Regional AI Voice Advisor supporting 11 Indian languages. |
| `syncApmcMspPricesDaily`| Scheduled (Cron 6 AM) | Automated daily APMC Mandi & Govt MSP floor price synchronization. |
