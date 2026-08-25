import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useSavings = (user) => {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSavings([]);
      setLoading(false);
      return;
    }

    const qSavings = query(collection(db, 'savings'), orderBy('date', 'desc'));
    const unsubSavings = onSnapshot(qSavings, (snapshot) => {
      const savingsData = [];
      snapshot.forEach((document) => {
        savingsData.push({ id: document.id, ...document.data() });
      });
      setSavings(savingsData);
      setLoading(false);
    });

    return () => unsubSavings();
  }, [user]);

  const addSaving = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'savings'), {
        type: data.type, // 'Deposit' or 'Withdrawal'
        amount: data.amount,
        description: data.description,
        date: new Date(data.date).toISOString(),
      });
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
      await deleteDoc(doc(db, 'savings', id));
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
      const dataToUpdate = {
        amount: updatedData.amount,
        description: updatedData.description,
        date: new Date(updatedData.date).toISOString()
      };
      
      if (updatedData.type !== undefined) dataToUpdate.type = updatedData.type;

      await updateDoc(doc(db, 'savings', id), dataToUpdate);
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
