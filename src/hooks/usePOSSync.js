import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchNewSalesSum } from '../utils/posSync';
import toast from 'react-hot-toast';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const usePOSSync = (user) => {
  const [syncMetadata, setSyncMetadata] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setSyncMetadata(null);
      return;
    }

    const unsubMetadata = onSnapshot(doc(db, 'metadata', 'posSync'), (docSnap) => {
      if (docSnap.exists()) {
        setSyncMetadata(docSnap.data());
      }
    });

    return () => unsubMetadata();
  }, [user]);

  const handleSyncPOS = useCallback(async (options = {}) => {
    const isAuto = typeof options === 'object' && options?.isAuto === true;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);

    const runTime = new Date().toISOString();
    const todayStr = getLocalDateString();

    try {
      toast.loading(isAuto ? '⏰ Daily 8:00 PM Auto-syncing POS sales...' : 'Fetching new POS sales...', { id: 'sync' });
      
      const result = await fetchNewSalesSum(syncMetadata?.posLatestTimestamp || null);
      let newPosTimestamp = result?.latestTimestamp || syncMetadata?.posLatestTimestamp || null;
      
      if (result.success) {
        if (result.count === 0 || result.sum === 0) {
          toast.success(isAuto ? '⏰ 8:00 PM Auto-sync: All POS sales up to date!' : 'No new sales to sync!', { id: 'sync' });
        } else {
          await addDoc(collection(db, 'transactions'), {
            type: 'Income',
            category: 'Business',
            amount: parseFloat(result.sum),
            description: 'DESH Digital Hub POS Income',
            date: new Date().toISOString(),
            posLatestTimestamp: newPosTimestamp,
            isTracked: true
          });
          
          toast.success(
            isAuto 
              ? `⏰ 8:00 PM Auto-synced Rs. ${result.sum.toLocaleString()} from POS!`
              : `Successfully synced Rs. ${result.sum.toLocaleString()}!`, 
            { id: 'sync', duration: 5000 }
          );
        }
      } else {
        toast.error('Failed to connect to POS database', { id: 'sync' });
      }

      await setDoc(doc(db, 'metadata', 'posSync'), {
        lastRunTime: runTime,
        posLatestTimestamp: newPosTimestamp,
        lastAutoSyncDate: todayStr
      }, { merge: true });

    } catch (error) {
      console.error(error);
      toast.error('An error occurred while syncing.', { id: 'sync' });
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [syncMetadata]);

  // Automatic Daily 8:00 PM Trigger & Catch-up
  useEffect(() => {
    if (!user || !syncMetadata) return;

    const checkAndTrigger = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = getLocalDateString(now);

      // Check if sync already ran today at or after 20:00 (8:00 PM)
      let alreadyRanTodayAfter8PM = syncMetadata.lastAutoSyncDate === todayStr;

      if (!alreadyRanTodayAfter8PM && syncMetadata.lastRunTime) {
        const lastRun = new Date(syncMetadata.lastRunTime);
        if (getLocalDateString(lastRun) === todayStr && lastRun.getHours() >= 20) {
          alreadyRanTodayAfter8PM = true;
        }
      }

      // If current time is 8:00 PM (20:00) or later, and today's 8 PM sync hasn't run yet
      if (currentHour >= 20 && !alreadyRanTodayAfter8PM && !isSyncingRef.current) {
        console.log(`[usePOSSync] Triggering daily 8:00 PM auto-sync for ${todayStr}`);
        handleSyncPOS({ isAuto: true });
      }
    };

    // 1. Check immediately when hook/metadata initializes
    checkAndTrigger();

    // 2. Schedule precise timer for 8:00 PM today if app is open before 20:00
    const now = new Date();
    const target8PM = new Date();
    target8PM.setHours(20, 0, 0, 0);

    let timerId = null;
    const msUntil8PM = target8PM.getTime() - now.getTime();
    if (msUntil8PM > 0) {
      timerId = setTimeout(() => {
        checkAndTrigger();
      }, msUntil8PM);
    }

    // 3. Periodic safety check every 60s (handles sleep / tab suspension wakeups)
    const intervalId = setInterval(checkAndTrigger, 60000);

    return () => {
      if (timerId) clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, [user, syncMetadata, handleSyncPOS]);

  return { syncMetadata, isSyncing, handleSyncPOS };
};
