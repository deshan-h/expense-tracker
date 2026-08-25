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

    const qLent = query(collection(db, 'moneyLent'), orderBy('date', 'desc'));
    const unsubLent = onSnapshot(qLent, (snapshot) => {
      const lentData = [];
      snapshot.forEach((document) => {
        lentData.push({ id: document.id, ...document.data() });
      });
      setLentMoney(lentData);
    });

    return () => unsubLent();
  }, [user]);

  const addLentMoney = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'moneyLent'), {
        type: data.type,
        name: data.name,
        amount: data.amount,
        paidAmount: 0,
        description: data.description,
        date: new Date(data.date).toISOString(),
        status: 'pending'
      });
      toast.success("Record added!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding lent money: ", error);
      toast.error("Failed to add record.");
      playErrorSound();
      return false;
    }
  }, []);

  const receiveLentPayment = useCallback(async (name, paymentAmount) => {
    try {
      let remainingPayment = parseFloat(paymentAmount);
      if (isNaN(remainingPayment) || remainingPayment <= 0) return false;

      const personPendingRecords = lentMoney
        .filter(r => r.status !== 'paid' && r.name === name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const record of personPendingRecords) {
        if (remainingPayment <= 0) break;

        const currentPaid = record.paidAmount || 0;
        const currentOwed = record.amount - currentPaid;

        if (currentOwed > 0) {
          let amountToApply = 0;
          let newStatus = 'pending';
          let newPaidDate = null;

          if (remainingPayment >= currentOwed) {
             amountToApply = currentOwed;
             newStatus = 'paid';
             newPaidDate = new Date().toISOString();
          } else {
             amountToApply = remainingPayment;
          }

          remainingPayment -= amountToApply;

          const currentHistory = record.paymentHistory || [];
          const newPayment = {
            date: new Date().toISOString(),
            amount: amountToApply
          };

          await updateDoc(doc(db, 'moneyLent', record.id), {
            paidAmount: currentPaid + amountToApply,
            status: newStatus,
            paymentHistory: [...currentHistory, newPayment],
            ...(newPaidDate && { paidDate: newPaidDate })
          });
        }
      }

      toast.success(`Payment of Rs. ${paymentAmount} received from ${name}!`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error applying payment: ", error);
      toast.error("Failed to apply payment.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  const deleteLentMoney = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'moneyLent', id));
      toast.success("Record deleted.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting lent money: ", error);
      toast.error("Failed to delete record.");
      playErrorSound();
      return false;
    }
  }, []);

  const deleteLentPayment = useCallback(async (recordId, paymentIndex) => {
    try {
      const record = lentMoney.find(r => r.id === recordId);
      if (!record || !record.paymentHistory || !record.paymentHistory[paymentIndex]) return false;

      const paymentToDelete = record.paymentHistory[paymentIndex];
      const newPaidAmount = Math.max(0, (record.paidAmount || 0) - paymentToDelete.amount);
      const newHistory = record.paymentHistory.filter((_, idx) => idx !== paymentIndex);
      
      const newStatus = newPaidAmount >= record.amount ? 'paid' : 'pending';

      await updateDoc(doc(db, 'moneyLent', recordId), {
        paidAmount: newPaidAmount,
        paymentHistory: newHistory,
        status: newStatus
      });
      
      toast.success("Payment record deleted.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting lent payment: ", error);
      toast.error("Failed to delete payment record.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  const updateLentMoney = useCallback(async (id, updatedData) => {
    try {
      const dataToUpdate = {
        amount: updatedData.amount,
        description: updatedData.description,
        date: new Date(updatedData.date).toISOString(),
        name: updatedData.name,
        type: updatedData.type
      };

      // Recalculate status based on new amount and existing paidAmount
      const record = lentMoney.find(r => r.id === id);
      if (record) {
        const currentPaid = record.paidAmount || 0;
        dataToUpdate.status = currentPaid >= updatedData.amount ? 'paid' : 'pending';
      }

      await updateDoc(doc(db, 'moneyLent', id), dataToUpdate);
      toast.success("Lent money record updated!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error updating lent money: ", error);
      toast.error("Failed to update record.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  const updateLentPayment = useCallback(async (recordId, paymentIndex, updatedPaymentData) => {
    try {
      const record = lentMoney.find(r => r.id === recordId);
      if (!record || !record.paymentHistory || !record.paymentHistory[paymentIndex]) return false;

      const oldPayment = record.paymentHistory[paymentIndex];
      const newHistory = [...record.paymentHistory];
      newHistory[paymentIndex] = {
        ...oldPayment,
        amount: updatedPaymentData.amount,
        date: new Date(updatedPaymentData.date).toISOString()
      };

      // Recalculate total paid
      const newPaidAmount = newHistory.reduce((acc, curr) => acc + curr.amount, 0);
      const newStatus = newPaidAmount >= record.amount ? 'paid' : 'pending';

      await updateDoc(doc(db, 'moneyLent', recordId), {
        paidAmount: newPaidAmount,
        paymentHistory: newHistory,
        status: newStatus
      });
      
      toast.success("Payment record updated.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error updating lent payment: ", error);
      toast.error("Failed to update payment record.");
      playErrorSound();
      return false;
    }
  }, [lentMoney]);

  return { lentMoney, addLentMoney, receiveLentPayment, deleteLentMoney, deleteLentPayment, updateLentMoney, updateLentPayment };
};
