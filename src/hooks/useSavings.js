import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useSavings = (user) => {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSavings = useCallback(async () => {
    if (!user) {
      setSavings([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('savings')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map(s => {
          const isInitial = s.type === 'Initial' || (s.note && s.note.startsWith('[Initial Balance]'));
          return {
            ...s,
            type: isInitial ? 'Initial' : s.type,
            description: s.note ? s.note.replace(/^\[Initial Balance\]\s*/, '') : ''
          };
        });
        setSavings(formatted);
      }
    } catch (err) {
      console.error("Error fetching savings:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavings();

    if (!user) return;

    const channel = supabase
      .channel('savings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings' }, () => {
        fetchSavings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSavings]);

  const addSaving = useCallback(async (data) => {
    try {
      const isInitial = data.type === 'Initial';
      const savingType = isInitial ? 'Deposit' : (data.type || 'Deposit');
      const savingNote = isInitial 
        ? `[Initial Balance] ${data.description || ''}`.trim()
        : (data.description || '');

      const { error } = await supabase
        .from('savings')
        .insert([{
          type: savingType,
          amount: parseFloat(data.amount),
          note: savingNote,
          date: new Date(data.date).toISOString()
        }]);

      if (error) throw error;

      toast.success(`Savings ${data.type.toLowerCase()} recorded successfully!`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding saving: ", error);
      toast.error(`Failed to record savings ${data.type.toLowerCase()}.`);
      playErrorSound();
      return false;
    }
  }, []);

  const deleteSaving = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('savings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Savings record deleted.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting saving: ", error);
      toast.error("Failed to delete savings record.");
      playErrorSound();
      return false;
    }
  }, []);

  const updateSaving = useCallback(async (id, updatedData) => {
    try {
      const isInitial = updatedData.type === 'Initial';
      const savingType = isInitial ? 'Deposit' : updatedData.type;
      const dataToUpdate = {
        amount: parseFloat(updatedData.amount),
        note: isInitial 
          ? `[Initial Balance] ${updatedData.description || ''}`.trim()
          : (updatedData.description || ''),
        date: new Date(updatedData.date).toISOString()
      };
      
      if (savingType !== undefined) dataToUpdate.type = savingType;

      const { error } = await supabase
        .from('savings')
        .update(dataToUpdate)
        .eq('id', id);

      if (error) throw error;

      toast.success("Savings record updated!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error updating saving: ", error);
      toast.error("Failed to update savings record.");
      playErrorSound();
      return false;
    }
  }, []);

  return { savings, loading, addSaving, deleteSaving, updateSaving };
};
