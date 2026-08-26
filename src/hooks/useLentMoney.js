import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useLentMoney = (user) => {
  const [lentMoney, setLentMoney] = useState([]);

  useEffect(() => {
    if (!user) {
      setLentMoney([]);
      return;
    }

    // Since we use 1 document per person, we can just fetch them all.
    // We sort by an arbitrary field, or just fetch all and let frontend sort.
    const qLent = query(collection(db, 'moneyLent'));
    const unsubLent = onSnapshot(qLent, (snapshot) => {
      const lentData = [];
      snapshot.forEach((document) => {
        lentData.push({ id: document.id, ...document.data() });
      });
      setLentMoney(lentData);
    });

    return () => unsubLent();
  }, [user]);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

  const addLentMoney = useCallback(async (data) => {
    try {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) return false;

      // Find an active ledger for this person
      const existingDoc = lentMoney.find(r => r.name === data.name && r.status !== 'settled');

      const newItem = {
        id: generateId(),
        entryType: 'borrow',
        amount: amount,
        date: new Date(data.date).toISOString(),
        description: data.description || 'Borrowed money',
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null
      };

      if (existingDoc) {
        // Update existing document
        const newTotalAmount = (existingDoc.totalAmount || 0) + amount;
        await updateDoc(doc(db, 'moneyLent', existingDoc.id), {
          totalAmount: newTotalAmount,
          status: newTotalAmount > (existingDoc.totalPaid || 0) ? 'pending' : 'settled',
          history: [...(existingDoc.history || []), newItem]
        });
      } else {
        // Create new document
        await addDoc(collection(db, 'moneyLent'), {
          name: data.name,
          type: data.type,
          totalAmount: amount,
          totalPaid: 0,
          status: 'pending',
          history: [newItem],
          createdAt: new Date().toISOString()
        });
      }

      toast.success("Record added!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding lent money: ", error);
      toast.error("Failed to add record.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  const receiveLentPayment = useCallback(async (name, paymentAmount, dateStr) => {
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) return false;

      const existingDoc = lentMoney.find(r => r.name === name && r.status !== 'settled');
      if (!existingDoc) {
         toast.error("No active record found for this person.");
         return false;
      }

      const newItem = {
        id: generateId(),
        entryType: 'payment',
        amount: amount,
        date: dateStr || new Date().toISOString()
      };

      const newTotalPaid = (existingDoc.totalPaid || 0) + amount;
      
      await updateDoc(doc(db, 'moneyLent', existingDoc.id), {
        totalPaid: newTotalPaid,
        status: newTotalPaid >= (existingDoc.totalAmount || 0) ? 'settled' : 'pending',
        history: [...(existingDoc.history || []), newItem]
      });

      toast.success(`Payment of Rs. ${amount} received from ${name}!`);
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

      // If both are 0 or below, we can delete the whole document, but let's just update it to settled.
      // Actually, if history is empty, delete the document!
      if (newHistory.length === 0) {
        await deleteDoc(doc(db, 'moneyLent', docId));
      } else {
        await updateDoc(doc(db, 'moneyLent', docId), {
          totalAmount: Math.max(0, newTotalAmount),
          totalPaid: Math.max(0, newTotalPaid),
          status: newTotalAmount > newTotalPaid ? 'pending' : 'settled',
          history: newHistory
        });
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

  return {
    lentMoney,
    addLentMoney,
    receiveLentPayment,
    deleteLentHistoryEntry
  };
};
