/**
 * AgriFlow AI - Firebase SQL Connect / Relational Cloud Data Bridge
 * Project: sih-2026-cdc21
 * Seamlessly connects SQLite / Cloud SQL PostgreSQL relational records
 * (Users, Crops, Orders, Reefer Telematics) with Firebase Firestore and Cloud Functions.
 */

import { db, functions } from "./firebase";
import { collection, doc, setDoc, getDocs, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export interface SqlUserRecord {
  id: string;
  name: string;
  role: "farmer" | "buyer" | "logistics" | "qc" | "admin";
  phone: string;
  kisan_id?: string;
  fpo?: string;
  location: string;
  wallet_balance: number;
  avatar?: string;
}

export interface SqlCropRecord {
  id: string;
  name: string;
  variety: string;
  category: string;
  farmer_name: string;
  location: string;
  stock_tons: number;
  direct_price: number;
  mandi_price: number;
  farmer_gain: string;
  brix: string;
  shelf_life_days: number;
  reefer_temp: string;
  humidity: string;
  image: string;
}

export interface SqlOrderRecord {
  id: string;
  commodity: string;
  quantity_tons: number;
  price_per_kg: number;
  total_value: number;
  stage_index: number;
  stage_name: string;
  stage_color: string;
  farmer_name: string;
  farmer_phone: string;
  buyer_name: string;
  buyer_company: string;
  truck_no: string;
  driver_name: string;
  chamber_temp: string;
  humidity: string;
  logistics_status: string;
  eta: string;
  qc_status: string;
}

export class FirebaseSqlConnect {
  private static instance: FirebaseSqlConnect;

  public static getInstance(): FirebaseSqlConnect {
    if (!FirebaseSqlConnect.instance) {
      FirebaseSqlConnect.instance = new FirebaseSqlConnect();
    }
    return FirebaseSqlConnect.instance;
  }

  /**
   * Sync a relational SQL User record into Firebase Firestore
   */
  public async syncUserToFirestore(user: SqlUserRecord): Promise<void> {
    const userRef = doc(db, "users", user.id);
    await setDoc(userRef, {
      ...user,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Sync a relational SQL Crop catalog entry into Firebase Firestore
   */
  public async syncCropToFirestore(crop: SqlCropRecord): Promise<void> {
    const cropRef = doc(db, "crops", crop.id);
    await setDoc(cropRef, {
      ...crop,
      directPrice: crop.direct_price,
      mandiPrice: crop.mandi_price,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Sync SQL Order state with Firestore Escrow
   */
  public async syncOrderToFirestore(order: SqlOrderRecord): Promise<void> {
    const orderRef = doc(db, "orders", order.id);
    await setDoc(orderRef, {
      ...order,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Subscribe to real-time SQL sync updates via Firestore snapshot listener
   */
  public subscribeToSyncedOrders(callback: (orders: SqlOrderRecord[]) => void) {
    const ordersCol = collection(db, "orders");
    return onSnapshot(ordersCol, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as SqlOrderRecord));
      callback(orders);
    });
  }
}

export const sqlConnect = FirebaseSqlConnect.getInstance();
