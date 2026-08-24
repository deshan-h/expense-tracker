import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { fetchNewSalesSum } from '../utils/posSync';
import toast from 'react-hot-toast';

export const usePOSSync = (user) => {
  const [syncMetadata, setSyncMetadata] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSyncPOS = useCallback(async () => {
    setIsSyncing(true);
    const runTime = new Date().toISOString();
    try {
      toast.loading('Fetching new POS sales...', { id: 'sync' });
      
      const result = await fetchNewSalesSum(syncMetadata?.posLatestTimestamp || null);
      let newPosTimestamp = result?.latestTimestamp || syncMetadata?.posLatestTimestamp || null;
      
      if (result.success) {
        if (result.count === 0 || result.sum === 0) {
          toast.success('No new sales to sync!', { id: 'sync' });
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
          
          toast.success(`Successfully synced Rs. ${result.sum.toLocaleString()}!`, { id: 'sync' });
        }
      } else {
        toast.error('Failed to connect to POS database', { id: 'sync' });
      }

      await setDoc(doc(db, 'metadata', 'posSync'), {
        lastRunTime: runTime,
        posLatestTimestamp: newPosTimestamp
      });

    } catch (error) {
      console.error(error);
      toast.error('An error occurred while syncing.', { id: 'sync' });
    } finally {
      setIsSyncing(false);
    }
  }, [syncMetadata]);

  return { syncMetadata, isSyncing, handleSyncPOS };
};
