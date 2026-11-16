import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useScheduled = (user, addExpense) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const isProcessing = useRef(false);

  const fetchSchedules = useCallback(async () => {
    if (!user) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, categories(id, name), subcategories(id, name)')
        .order('next_due', { ascending: true });

      if (error) throw error;

      if (data) {
        const formatted = data.map(s => ({
          ...s,
          category: s.categories?.name || '',
          subcategory: s.subcategories?.name || '',
          nextDate: s.next_due || s.start_date,
          expiryDate: s.expiry_date,
          askBefore: s.ask_before_adding
        }));
        setSchedules(formatted);
      }
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSchedules();

    if (!user) return;

    const channel = supabase
      .channel('schedules-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        fetchSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSchedules]);

  const resolveCategoryIds = async (categoryName, subcategoryName) => {
    let category_id = null;
    let subcategory_id = null;

    if (categoryName) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName.trim())
        .maybeSingle();

      if (cat) {
        category_id = cat.id;

        if (subcategoryName) {
          const { data: sub } = await supabase
            .from('subcategories')
            .select('id')
            .eq('category_id', category_id)
            .eq('name', subcategoryName.trim())
            .maybeSingle();

          if (sub) {
            subcategory_id = sub.id;
          }
        }
      }
    }

    return { category_id, subcategory_id };
  };

  // Auto-process schedules
  const processSchedules = useCallback(async () => {
    if (!addExpense || schedules.length === 0) return;
    const now = new Date();
    
    for (const schedule of schedules) {
      if (schedule.status !== 'active') continue;
      if (schedule.askBefore) continue;
      
      let nextDateObj = new Date(schedule.nextDate);
      let updated = false;
      let currentNextDate = schedule.nextDate;
      let isCompleted = false;
      
      while (nextDateObj <= now) {
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
            await supabase.from('schedules').update({ status: 'completed' }).eq('id', schedule.id);
            toast.success(`Scheduled expense '${schedule.description}' completed.`);
          } else {
            await supabase.from('schedules').update({ next_due: currentNextDate }).eq('id', schedule.id);
            toast.success(`Scheduled expense '${schedule.description}' processed and rescheduled.`);
          }
        } catch (err) {
          console.error("Error updating scheduled expense: ", err);
        }
      }
    }
  }, [schedules, addExpense]);

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
      const { category_id, subcategory_id } = await resolveCategoryIds(data.category, data.subcategory);

      const { error } = await supabase
        .from('schedules')
        .insert([{
          category_id,
          subcategory_id,
          amount: parseFloat(data.amount),
          type: data.type || 'Expense',
          description: data.description || '',
          start_date: new Date(data.nextDate).toISOString(),
          next_due: new Date(data.nextDate).toISOString(),
          expiry_date: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
          frequency: data.frequency || 'Monthly',
          ask_before_adding: Boolean(data.askBefore),
          status: 'active'
        }]);

      if (error) throw error;

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
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
        await supabase.from('schedules').update({ status: 'completed' }).eq('id', schedule.id);
      } else {
        if (schedule.frequency === 'Daily') nextDateObj.setDate(nextDateObj.getDate() + 1);
        else if (schedule.frequency === 'Weekly') nextDateObj.setDate(nextDateObj.getDate() + 7);
        else if (schedule.frequency === 'Monthly') nextDateObj.setMonth(nextDateObj.getMonth() + 1);
        else if (schedule.frequency === 'Yearly') nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
        
        if (schedule.expiryDate && nextDateObj > new Date(schedule.expiryDate)) {
          await supabase.from('schedules').update({ status: 'completed' }).eq('id', schedule.id);
        } else {
          await supabase.from('schedules').update({ next_due: nextDateObj.toISOString() }).eq('id', schedule.id);
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
        await supabase.from('schedules').update({ status: 'completed' }).eq('id', schedule.id);
      } else {
        if (schedule.frequency === 'Daily') nextDateObj.setDate(nextDateObj.getDate() + 1);
        else if (schedule.frequency === 'Weekly') nextDateObj.setDate(nextDateObj.getDate() + 7);
        else if (schedule.frequency === 'Monthly') nextDateObj.setMonth(nextDateObj.getMonth() + 1);
        else if (schedule.frequency === 'Yearly') nextDateObj.setFullYear(nextDateObj.getFullYear() + 1);
        
        if (schedule.expiryDate && nextDateObj > new Date(schedule.expiryDate)) {
          await supabase.from('schedules').update({ status: 'completed' }).eq('id', schedule.id);
        } else {
          await supabase.from('schedules').update({ next_due: nextDateObj.toISOString() }).eq('id', schedule.id);
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
