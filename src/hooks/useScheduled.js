import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useScheduled = (user, addExpense) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const isProcessing = useRef(false);

  // Subscribe to schedules
  useEffect(() => {
    if (!user) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    const qSchedules = query(collection(db, 'scheduled_expenses'), orderBy('nextDate', 'asc'));
    const unsub = onSnapshot(qSchedules, (snapshot) => {
      const data = [];
      snapshot.forEach((document) => {
        data.push({ id: document.id, ...document.data() });
      });
      setSchedules(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Auto-process schedules
  const processSchedules = useCallback(async () => {
    if (!addExpense || schedules.length === 0) return;
    const now = new Date();
    
    for (const schedule of schedules) {
      if (schedule.status !== 'active') continue;
      if (schedule.askBefore) continue; // Skip auto-processing for askBefore schedules
      
      let nextDateObj = new Date(schedule.nextDate);
      let updated = false;
      let currentNextDate = schedule.nextDate;
      let isCompleted = false;
      
      while (nextDateObj <= now) {
        // Record as an expense
        await addExpense({
          category: schedule.category,
          subcategory: schedule.subcategory || '',
          amount: schedule.amount,
          description: schedule.description || 'Scheduled Expense',
          date: nextDateObj.toISOString(),
          isTracked: true
        });
        
        updated = true;
        
        if (schedule.frequency === 'Once') {
          isCompleted = true;
          break;
        } else {
          // Advance to next cycle
          if (schedule.frequency === 'Daily') nextDateObj.setDate(nextDateObj.getDate() + 1);
          else if (schedule.frequency === 'Weekly') nextDateObj.setDate(nextDateObj.getDate() + 7);
          else if (schedule.frequency === 'Monthly') nextDateObj.setMonth(nextDateObj.getMonth() + 1);
          else if (schedule.frequency === 'Yearly') nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
          
          if (schedule.expiryDate && nextDateObj > new Date(schedule.expiryDate)) {
            isCompleted = true;
            break;
          }
          
          currentNextDate = nextDateObj.toISOString();
        }
      }
      
      if (updated) {
        try {
          if (isCompleted) {
            await updateDoc(doc(db, 'scheduled_expenses', schedule.id), { status: 'completed' });
            toast.success(`Scheduled expense '${schedule.description}' completed.`);
          } else {
            await updateDoc(doc(db, 'scheduled_expenses', schedule.id), { nextDate: currentNextDate });
            toast.success(`Scheduled expense '${schedule.description}' processed and rescheduled.`);
          }
        } catch (err) {
          console.error("Error updating scheduled expense: ", err);
        }
      }
    }
  }, [schedules, addExpense]);

  // Run processor when schedules arrive
  useEffect(() => {
    if (schedules.length > 0 && addExpense && !isProcessing.current) {
      const hasPending = schedules.some(s => s.status === 'active' && new Date(s.nextDate) <= new Date() && !s.askBefore);
      if (hasPending) {
        isProcessing.current = true;
        processSchedules().finally(() => {
          isProcessing.current = false;
        });
      }
    }
  }, [schedules, addExpense, processSchedules]);

  const addSchedule = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'scheduled_expenses'), {
        category: data.category,
        subcategory: data.subcategory || '',
        amount: data.amount,
        description: data.description,
        nextDate: new Date(data.nextDate).toISOString(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
        frequency: data.frequency, // 'Once', 'Daily', 'Weekly', 'Monthly', 'Yearly'
        askBefore: data.askBefore || false,
        status: 'active'
      });
      toast.success('Expense scheduled successfully!');
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error scheduling expense: ", error);
      toast.error('Failed to schedule expense.');
      playErrorSound();
      return false;
    }
  }, []);

  const deleteSchedule = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'scheduled_expenses', id));
      toast.success('Scheduled expense removed.');
      return true;
    } catch (error) {
      console.error("Error deleting schedule: ", error);
      toast.error('Failed to remove schedule.');
      return false;
    }
  }, []);

  const pendingAskSchedules = useMemo(() => {
    const now = new Date();
    return schedules.filter(s => s.status === 'active' && s.askBefore && new Date(s.nextDate) <= now);
  }, [schedules]);

  const approveSchedule = useCallback(async (schedule) => {
    if (!addExpense) return false;
    try {
      let nextDateObj = new Date(schedule.nextDate);
      
      await addExpense({
        category: schedule.category,
        subcategory: schedule.subcategory || '',
        amount: schedule.amount,
        description: schedule.description || 'Scheduled Expense',
        date: new Date().toISOString(),
        isTracked: true
      });

      if (schedule.frequency === 'Once') {
        await updateDoc(doc(db, 'scheduled_expenses', schedule.id), { status: 'completed' });
      } else {
        if (schedule.frequency === 'Daily') nextDateObj.setDate(nextDateObj.getDate() + 1);
        else if (schedule.frequency === 'Weekly') nextDateObj.setDate(nextDateObj.getDate() + 7);
        else if (schedule.frequency === 'Monthly') nextDateObj.setMonth(nextDateObj.getMonth() + 1);
        else if (schedule.frequency === 'Yearly') nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
        
        if (schedule.expiryDate && nextDateObj > new Date(schedule.expiryDate)) {
          await updateDoc(doc(db, 'scheduled_expenses', schedule.id), { status: 'completed' });
        } else {
          await updateDoc(doc(db, 'scheduled_expenses', schedule.id), { nextDate: nextDateObj.toISOString() });
        }
      }
      toast.success(`Expense '${schedule.description}' added.`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error approving schedule: ", error);
      toast.error("Failed to approve schedule.");
      return false;
    }
  }, [addExpense]);

  const skipSchedule = useCallback(async (schedule) => {
    try {
      let nextDateObj = new Date(schedule.nextDate);
      if (schedule.frequency === 'Once') {
        await updateDoc(doc(db, 'scheduled_expenses', schedule.id), { status: 'completed' });
      } else {
        if (schedule.frequency === 'Daily') nextDateObj.setDate(nextDateObj.getDate() + 1);
        else if (schedule.frequency === 'Weekly') nextDateObj.setDate(nextDateObj.getDate() + 7);
        else if (schedule.frequency === 'Monthly') nextDateObj.setMonth(nextDateObj.getMonth() + 1);
        else if (schedule.frequency === 'Yearly') nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
        
        if (schedule.expiryDate && nextDateObj > new Date(schedule.expiryDate)) {
          await updateDoc(doc(db, 'scheduled_expenses', schedule.id), { status: 'completed' });
        } else {
          await updateDoc(doc(db, 'scheduled_expenses', schedule.id), { nextDate: nextDateObj.toISOString() });
        }
      }
      toast.success(`Skipped '${schedule.description}'.`);
      return true;
    } catch (error) {
      console.error("Error skipping schedule: ", error);
      return false;
    }
  }, []);

  return { schedules, pendingAskSchedules, loading, addSchedule, deleteSchedule, approveSchedule, skipSchedule };
};
