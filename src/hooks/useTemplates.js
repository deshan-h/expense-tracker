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
      await updateDoc(doc(db, 'templates', id), {
        name: data.name,
        amount: data.amount,
        category: data.category,
        subcategory: data.subcategory || ''
      });
      toast.success(`Template updated!`);
      playSuccessSound();
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
