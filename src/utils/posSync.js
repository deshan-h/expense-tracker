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

// Initialize secondary app for POS
const posApp = getApps().find(app => app.name === 'posApp') || initializeApp(posConfig, 'posApp');
const posDb = getFirestore(posApp);

export const fetchNewSalesSum = async (lastSyncDateStr) => {
  try {
    const posAuth = getAuth(posApp);

    // IMPORTANT: Replace these with your actual POS Admin login details!
    const POS_EMAIL = "admin@desh.lk";
    const POS_PASSWORD = "Desh@1998";

    if (!posAuth.currentUser) {
      await signInWithEmailAndPassword(posAuth, POS_EMAIL, POS_PASSWORD);
    }

    const salesRef = collection(posDb, 'daily_sales');
    // Fetch all sales ordered by latest first
    const q = query(salesRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    let sum = 0;
    let count = 0;
    let latestTimestamp = null;
    const lastSyncTime = lastSyncDateStr ? new Date(lastSyncDateStr).getTime() : 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const rawTimestamp = data.timestamp || data.createdAt || data.date;
      if (!rawTimestamp) {
        console.warn("Skipping record with no timestamp", doc.id);
        return;
      }

      let saleTime;
      if (typeof rawTimestamp.toDate === 'function') {
        saleTime = rawTimestamp.toDate().getTime();
      } else {
        saleTime = new Date(rawTimestamp).getTime();
      }

      // Only count sales that happened strictly after the last sync
      console.log(`Checking POS Record ${doc.id}: saleTime=${saleTime} vs lastSyncTime=${lastSyncTime} (${new Date(saleTime).toISOString()})`);
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

        console.log(`Included POS Record ${doc.id}: Income=${income}`);
        sum += income;
        count++;
        // Keep track of the very latest timestamp we process
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
    console.error("Error fetching POS sales:", error);
    return { success: false, error: error.message };
  }
};
