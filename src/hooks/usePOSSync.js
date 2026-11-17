import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
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

  const fetchMetadata = useCallback(async () => {
    if (!user) {
      setSyncMetadata(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('metadata')
        .select('*')
        .eq('key', 'posSync')
        .maybeSingle();

      if (error) throw error;
      setSyncMetadata(data?.data || null);
    } catch (err) {
      console.error("Error fetching POS sync metadata:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchMetadata();

    if (!user) return;

    const channel = supabase
      .channel('pos-metadata-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'metadata', filter: 'key=eq.posSync' }, () => {
        fetchMetadata();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMetadata]);

  const handleSyncPOS = useCallback(async (options = {}) => {
    const isAuto = typeof options === 'object' && options?.isAuto === true;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);

    const runTime = new Date().toISOString();
    const todayStr = getLocalDateString();

    try {
      toast.loading(isAuto ? '⏰ Daily 8:00 PM Auto-syncing POS sales...' : 'Fetching new POS sales...', { id: 'sync' });
      
      // 1. Resolve the latest synced timestamp reliably (state -> metadata table -> latest transaction)
      let lastTimestamp = syncMetadata?.posLatestTimestamp;

      if (!lastTimestamp) {
        const { data: meta } = await supabase
          .from('metadata')
          .select('data')
          .eq('key', 'posSync')
          .maybeSingle();
        if (meta?.data?.posLatestTimestamp) {
          lastTimestamp = meta.data.posLatestTimestamp;
        }
      }

      if (!lastTimestamp) {
        const { data: latestTx } = await supabase
          .from('transactions')
          .select('pos_latest_timestamp')
          .not('pos_latest_timestamp', 'is', null)
          .order('pos_latest_timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestTx?.pos_latest_timestamp) {
          lastTimestamp = latestTx.pos_latest_timestamp;
        }
      }

      if (!lastTimestamp) {
        // Fallback to start of today so historical sales are never pulled en masse
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        lastTimestamp = todayStart.toISOString();
      }

      const result = await fetchNewSalesSum(lastTimestamp);
      let newPosTimestamp = result?.latestTimestamp || lastTimestamp;
      
      if (result.success) {
        if (result.count === 0 || result.sum === 0) {
          toast.success(isAuto ? '⏰ 8:00 PM Auto-sync: All POS sales up to date!' : 'No new sales to sync!', { id: 'sync' });
        } else {
          // Find Business category and POS Batch Sync subcategory
          let category_id = null;
          let subcategory_id = null;

          const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('name', 'Business')
            .maybeSingle();

          if (cat) {
            category_id = cat.id;
            const { data: sub } = await supabase
              .from('subcategories')
              .select('id')
              .eq('category_id', cat.id)
              .eq('name', 'POS Batch Sync')
              .maybeSingle();
            if (sub) subcategory_id = sub.id;
          }

          const { error: txError } = await supabase
            .from('transactions')
            .insert([{
              type: 'Income',
              category_id,
              subcategory_id,
              amount: parseFloat(result.sum),
              description: 'DESH Digital Hub POS Income',
              date: new Date().toISOString(),
              pos_latest_timestamp: newPosTimestamp,
              is_tracked: true
            }]);

          if (txError) throw txError;
          
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

      const updatedData = {
        lastRunTime: runTime,
        posLatestTimestamp: newPosTimestamp,
        lastAutoSyncDate: todayStr
      };

      await supabase
        .from('metadata')
        .upsert({
          key: 'posSync',
          data: updatedData,
          updated_at: new Date().toISOString()
        });

      setSyncMetadata(updatedData);

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
    if (!user) return;

    const checkAndTrigger = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = getLocalDateString(now);

      let alreadyRanTodayAfter8PM = syncMetadata?.lastAutoSyncDate === todayStr;

      if (!alreadyRanTodayAfter8PM && syncMetadata?.lastRunTime) {
        const lastRun = new Date(syncMetadata.lastRunTime);
        if (getLocalDateString(lastRun) === todayStr && lastRun.getHours() >= 20) {
          alreadyRanTodayAfter8PM = true;
        }
      }

      if (currentHour >= 20 && !alreadyRanTodayAfter8PM && !isSyncingRef.current) {
        console.log(`[usePOSSync] Triggering daily 8:00 PM auto-sync for ${todayStr}`);
        handleSyncPOS({ isAuto: true });
      }
    };

    checkAndTrigger();

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

    const intervalId = setInterval(checkAndTrigger, 60000);

    return () => {
      if (timerId) clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, [user, syncMetadata, handleSyncPOS]);

  return { syncMetadata, isSyncing, handleSyncPOS };
};
