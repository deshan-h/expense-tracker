import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useLentMoney = (user) => {
  const [lentMoney, setLentMoney] = useState([]);

  const fetchLentMoney = useCallback(async () => {
    if (!user) {
      setLentMoney([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lent_money')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map(r => {
          const txObj = (r.transactions && !Array.isArray(r.transactions) && typeof r.transactions === 'object')
            ? r.transactions
            : { totalPaid: 0, history: Array.isArray(r.transactions) ? r.transactions : [] };

          return {
            ...r,
            type: r.relationship || 'Other',
            debtType: r.debt_type || 'lent',
            totalAmount: parseFloat(r.lent_amount || 0),
            totalPaid: parseFloat(txObj.totalPaid || 0),
            history: txObj.history || [],
            status: r.status || 'pending'
          };
        });
        setLentMoney(formatted);
      }
    } catch (err) {
      console.error("Error fetching lent money:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchLentMoney();

    if (!user) return;

    const channel = supabase
      .channel('lent-money-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lent_money' }, () => {
        fetchLentMoney();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchLentMoney]);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

  const addLentMoney = useCallback(async (data) => {
    try {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) return false;

      const debtType = data.debtType || 'lent';
      const trimmedName = data.name.trim();

      const existingDoc = lentMoney.find(r => 
        r.name?.toLowerCase().trim() === trimmedName.toLowerCase() && 
        (r.debtType || 'lent') === debtType && 
        r.status !== 'settled'
      );

      const newItem = {
        id: generateId(),
        entryType: 'borrow',
        amount: amount,
        date: new Date(data.date).toISOString(),
        description: data.description || (debtType === 'borrowed' ? 'Borrowed money' : 'Lent money'),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null
      };

      if (existingDoc) {
        const newTotalAmount = (existingDoc.totalAmount || 0) + amount;
        const newHistory = [...(existingDoc.history || []), newItem];
        const txObj = {
          totalPaid: existingDoc.totalPaid || 0,
          history: newHistory
        };

        const { error } = await supabase
          .from('lent_money')
          .update({
            lent_amount: newTotalAmount,
            status: newTotalAmount > (existingDoc.totalPaid || 0) ? 'pending' : 'settled',
            transactions: txObj
          })
          .eq('id', existingDoc.id);

        if (error) throw error;
      } else {
        const txObj = {
          totalPaid: 0,
          history: [newItem]
        };

        const { error } = await supabase
          .from('lent_money')
          .insert([{
            name: trimmedName,
            relationship: data.type || 'Other',
            debt_type: debtType,
            lent_amount: amount,
            status: 'pending',
            date: new Date(data.date).toISOString(),
            due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
            description: data.description || '',
            transactions: txObj
          }]);

        if (error) throw error;
      }

      toast.success(debtType === 'borrowed' ? "Borrowed record added!" : "Lent record added!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding lent/borrowed money: ", error);
      toast.error("Failed to add record.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  const receiveLentPayment = useCallback(async (name, paymentAmount, dateStr, description = '', debtType = 'lent', docId = null) => {
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) return false;

      const existingDoc = docId 
        ? lentMoney.find(r => r.id === docId)
        : lentMoney.find(r => r.name?.toLowerCase().trim() === name?.toLowerCase().trim() && (r.debtType || 'lent') === debtType && r.status !== 'settled');
      
      if (!existingDoc) {
        toast.error("No active record found for this person.");
        return false;
      }

      const isBorrowed = (existingDoc.debtType || 'lent') === 'borrowed';

      const newItem = {
        id: generateId(),
        entryType: 'payment',
        amount: amount,
        date: dateStr || new Date().toISOString(),
        description: description || (isBorrowed ? `Repaid to ${existingDoc.name}` : `Payment received from ${existingDoc.name}`)
      };

      const newTotalPaid = (existingDoc.totalPaid || 0) + amount;
      const newHistory = [...(existingDoc.history || []), newItem];
      const txObj = {
        totalPaid: newTotalPaid,
        history: newHistory
      };

      const { error } = await supabase
        .from('lent_money')
        .update({
          status: newTotalPaid >= (existingDoc.totalAmount || 0) ? 'settled' : 'pending',
          transactions: txObj
        })
        .eq('id', existingDoc.id);

      if (error) throw error;

      if (isBorrowed) {
        toast.success(`Payment of Rs. ${amount} made to ${existingDoc.name}!`);
      } else {
        toast.success(`Payment of Rs. ${amount} received from ${existingDoc.name}!`);
      }
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error applying payment: ", error);
      toast.error("Failed to apply payment.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  const deleteLentHistoryEntry = useCallback(async (docId, entryId) => {
    try {
      const existingDoc = lentMoney.find(r => r.id === docId);
      if (!existingDoc) return false;

      const entryToDelete = existingDoc.history.find(h => h.id === entryId);
      if (!entryToDelete) return false;

      const newHistory = existingDoc.history.filter(h => h.id !== entryId);
      
      let newTotalAmount = existingDoc.totalAmount || 0;
      let newTotalPaid = existingDoc.totalPaid || 0;

      if (entryToDelete.entryType === 'borrow') {
        newTotalAmount -= entryToDelete.amount;
      } else if (entryToDelete.entryType === 'payment') {
        newTotalPaid -= entryToDelete.amount;
      }

      if (newHistory.length === 0) {
        const { error } = await supabase
          .from('lent_money')
          .delete()
          .eq('id', docId);
        if (error) throw error;
      } else {
        const txObj = {
          totalPaid: Math.max(0, newTotalPaid),
          history: newHistory
        };

        const { error } = await supabase
          .from('lent_money')
          .update({
            lent_amount: Math.max(0, newTotalAmount),
            status: newTotalAmount > newTotalPaid ? 'pending' : 'settled',
            transactions: txObj
          })
          .eq('id', docId);
        if (error) throw error;
      }

      toast.success("Entry deleted!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting entry: ", error);
      toast.error("Failed to delete entry.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  const clearSettledAccounts = useCallback(async (filterDebtType = null) => {
    try {
      const settled = lentMoney.filter(r => {
        if (r.status !== 'settled') return false;
        if (filterDebtType && (r.debtType || 'lent') !== filterDebtType) return false;
        return true;
      });

      for (const item of settled) {
        await supabase
          .from('lent_money')
          .delete()
          .eq('id', item.id);
      }

      toast.success("Settled accounts cleared!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error clearing settled accounts: ", error);
      toast.error("Failed to clear settled accounts.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  return {
    lentMoney,
    addLentMoney,
    receiveLentPayment,
    deleteLentHistoryEntry,
    clearSettledAccounts
  };
};
