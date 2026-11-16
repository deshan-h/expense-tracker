import { posSupabase } from "../supabase.js";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

const posConfig = {
  apiKey: "AIzaSyAQQQ8ny_R4o1g0DaF6ciIS6-Ntvaw42Eo",
  authDomain: "desh-digital-hub.firebaseapp.com",
  projectId: "desh-digital-hub",
  storageBucket: "desh-digital-hub.firebasestorage.app",
  messagingSenderId: "467371569214",
  appId: "1:467371569214:web:c23703cdb21cc68ad4e16f",
  measurementId: "G-9RQY57WPDC"
};

export const fetchNewSalesSum = async (lastSyncDateStr) => {
  const lastSyncTime = lastSyncDateStr ? new Date(lastSyncDateStr).getTime() : 0;

  // 1. If POS Supabase client is configured, fetch from Supabase
  if (posSupabase) {
    try {
      const tableName = import.meta.env.VITE_POS_SALES_TABLE || 'daily_sales';
      const { data, error } = await posSupabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let sum = 0;
      let count = 0;
      let latestTimestamp = null;

      (data || []).forEach((row) => {
        const rawTimestamp = row.timestamp || row.created_at || row.date;
        if (!rawTimestamp) return;

        const saleTime = new Date(rawTimestamp).getTime();

        if (saleTime > lastSyncTime) {
          let income = 0;
          const saleAmount = Number(row.amount || row.totalAmount || row.total_amount || row.total || 0);

          if (row.isRepair || row.is_repair) {
            income = saleAmount - Number(row.cost || 0);
          } else {
            let totalCost = 0;
            const items = row.cartItems || row.cart_items;
            if (items && Array.isArray(items)) {
              items.forEach(item => {
                totalCost += (Number(item.cost || 0) * Number(item.qty || item.quantity || 1));
              });
            }
            income = saleAmount - totalCost;
          }

          sum += income;
          count++;
          if (!latestTimestamp || saleTime > latestTimestamp) {
            latestTimestamp = saleTime;
          }
        }
      });

      return {
        sum,
        count,
        latestTimestamp: latestTimestamp ? new Date(latestTimestamp).toISOString() : null,
        success: true
      };
    } catch (err) {
      console.error("Error fetching from POS Supabase:", err);
      // Fall through to Firebase fallback if available
    }
  }

  // 2. Fallback to Firebase POS App if Supabase is not yet configured or errored
  try {
    const posApp = getApps().find(app => app.name === 'posApp') || initializeApp(posConfig, 'posApp');
    const posDb = getFirestore(posApp);
    const posAuth = getAuth(posApp);

    const POS_EMAIL = "admin@desh.lk";
    const POS_PASSWORD = "Desh@1998";

    if (!posAuth.currentUser) {
      await signInWithEmailAndPassword(posAuth, POS_EMAIL, POS_PASSWORD);
    }

    const salesRef = collection(posDb, 'daily_sales');
    const q = query(salesRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    let sum = 0;
    let count = 0;
    let latestTimestamp = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const rawTimestamp = data.timestamp || data.createdAt || data.date;
      if (!rawTimestamp) return;

      let saleTime;
      if (typeof rawTimestamp.toDate === 'function') {
        saleTime = rawTimestamp.toDate().getTime();
      } else {
        saleTime = new Date(rawTimestamp).getTime();
      }

      if (saleTime > lastSyncTime) {
        let income = 0;
        const saleAmount = Number(data.amount || data.totalAmount || data.total || 0);

        if (data.isRepair) {
          income = saleAmount - Number(data.cost || 0);
        } else {
          let totalCost = 0;
          if (data.cartItems && Array.isArray(data.cartItems)) {
            data.cartItems.forEach(item => {
              totalCost += (Number(item.cost || 0) * Number(item.qty || 1));
            });
          }
          income = saleAmount - totalCost;
        }

        sum += income;
        count++;
        if (!latestTimestamp || saleTime > latestTimestamp) {
          latestTimestamp = saleTime;
        }
      }
    });

    return {
      sum,
      count,
      latestTimestamp: latestTimestamp ? new Date(latestTimestamp).toISOString() : null,
      success: true
    };
  } catch (error) {
    console.error("Error fetching POS sales from Firebase fallback:", error);
    return { success: false, error: error.message };
  }
};
