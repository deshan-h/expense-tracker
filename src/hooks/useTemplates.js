import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useTemplates = (user) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const qTpl = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));
    const unsubTpl = onSnapshot(qTpl, (snapshot) => {
      const tplData = [];
      snapshot.forEach((document) => {
        tplData.push({ id: document.id, ...document.data() });
      });
      setTemplates(tplData);
      setLoading(false);
    });

    return () => unsubTpl();
  }, [user]);

  const addTemplate = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'templates'), {
        name: data.name,
        amount: data.amount,
        category: data.category,
        subcategory: data.subcategory || '',
        description: data.description || '',
        trackCycle: Boolean(data.trackCycle),
        cycleDays: data.cycleDays ? Number(data.cycleDays) : null,
        lastPaidDate: data.lastPaidDate || null,
        createdAt: serverTimestamp()
      });
      toast.success(`Template "${data.name}" saved!`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding template: ", error);
      toast.error("Failed to save template.");
      playErrorSound();
      return false;
    }
  }, []);

  const deleteTemplate = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'templates', id));
      toast.success("Template deleted.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting template: ", error);
      toast.error("Failed to delete template.");
      playErrorSound();
      return false;
    }
  }, []);

  const updateTemplate = useCallback(async (id, data) => {
    try {
      const updateData = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.subcategory !== undefined) updateData.subcategory = data.subcategory || '';
      if (data.description !== undefined) updateData.description = data.description || '';
      if (data.trackCycle !== undefined) updateData.trackCycle = Boolean(data.trackCycle);
      if (data.cycleDays !== undefined) updateData.cycleDays = data.cycleDays ? Number(data.cycleDays) : null;
      if (data.lastPaidDate !== undefined) updateData.lastPaidDate = data.lastPaidDate;

      await updateDoc(doc(db, 'templates', id), updateData);
      return true;
    } catch (error) {
      console.error("Error updating template: ", error);
      toast.error("Failed to update template.");
      playErrorSound();
      return false;
    }
  }, []);

  return { templates, addTemplate, deleteTemplate, updateTemplate, loading };
};
