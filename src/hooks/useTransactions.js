import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useTransactions = (user) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('v_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map(t => ({
          ...t,
          category: t.category_name || '',
          subcategory: t.subcategory_name || '',
          isTracked: t.is_tracked ?? true
        }));
        setTransactions(formatted);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();

    if (!user) return;

    const channel = supabase
      .channel('transactions-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTransactions]);

  // Helper to resolve category_id and subcategory_id from names
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

  const addExpense = useCallback(async (data) => {
    try {
      const { category_id, subcategory_id } = await resolveCategoryIds(data.category, data.subcategory);

      const { error } = await supabase
        .from('transactions')
        .insert([{
          type: 'Expense',
          category_id,
          subcategory_id,
          amount: parseFloat(data.amount),
          description: data.description || '',
          date: new Date(data.date).toISOString(),
          is_tracked: data.isTracked ?? true
        }]);

      if (error) throw error;

      toast.success(`Expense recorded successfully!`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding expense: ", error);
      toast.error("Failed to record expense.");
      playErrorSound();
      return false;
    }
  }, []);

  const addIncome = useCallback(async (data) => {
    try {
      const { category_id, subcategory_id } = await resolveCategoryIds(data.category, data.subcategory);

      const { error } = await supabase
        .from('transactions')
        .insert([{
          type: 'Income',
          category_id,
          subcategory_id,
          amount: parseFloat(data.amount),
          description: data.description || '',
          date: new Date(data.date).toISOString(),
          is_tracked: true
        }]);

      if (error) throw error;

      toast.success(`Income recorded successfully!`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding income: ", error);
      toast.error("Failed to record income.");
      playErrorSound();
      return false;
    }
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Transaction deleted.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      toast.error("Failed to delete transaction.");
      playErrorSound();
      return false;
    }
  }, []);

  const updateTransaction = useCallback(async (id, updatedData) => {
    try {
      const dataToUpdate = {
        amount: parseFloat(updatedData.amount),
        description: updatedData.description || '',
        date: new Date(updatedData.date).toISOString()
      };

      if (updatedData.category !== undefined) {
        const { category_id, subcategory_id } = await resolveCategoryIds(updatedData.category, updatedData.subcategory);
        dataToUpdate.category_id = category_id;
        dataToUpdate.subcategory_id = subcategory_id;
      }

      if (updatedData.type !== undefined) {
        dataToUpdate.type = updatedData.type;
      }

      const { error } = await supabase
        .from('transactions')
        .update(dataToUpdate)
        .eq('id', id);

      if (error) throw error;

      toast.success("Transaction updated.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error updating transaction: ", error);
      toast.error("Failed to update transaction.");
      playErrorSound();
      return false;
    }
  }, []);

  return { transactions, addExpense, addIncome, deleteTransaction, updateTransaction, loading };
};
