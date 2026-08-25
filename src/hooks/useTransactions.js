import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useTransactions = (user) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const qTx = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txData = [];
      snapshot.forEach((document) => {
        txData.push({ id: document.id, ...document.data() });
      });
      setTransactions(txData);
      setLoading(false);
    });

    return () => unsubTx();
  }, [user]);

  const addExpense = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'transactions'), {
        type: 'Expense',
        category: data.category,
        subcategory: data.subcategory,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date).toISOString(),
        isTracked: data.isTracked
      });
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
      await addDoc(collection(db, 'transactions'), {
        type: 'Income',
        category: data.category,
        subcategory: '',
        amount: data.amount,
        description: data.description,
        date: new Date(data.date).toISOString(),
        isTracked: true
      });
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
      await deleteDoc(doc(db, 'transactions', id));
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
        amount: updatedData.amount,
        description: updatedData.description,
        date: new Date(updatedData.date).toISOString()
      };
      
      if (updatedData.category !== undefined) dataToUpdate.category = updatedData.category;
      if (updatedData.subcategory !== undefined) dataToUpdate.subcategory = updatedData.subcategory;
      if (updatedData.type !== undefined) dataToUpdate.type = updatedData.type;

      await updateDoc(doc(db, 'transactions', id), dataToUpdate);
      toast.success("Transaction updated!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error updating transaction: ", error);
      toast.error("Failed to update transaction.");
      playErrorSound();
      return false;
    }
  }, []);

  return { transactions, loading, addExpense, addIncome, deleteTransaction, updateTransaction };
};
