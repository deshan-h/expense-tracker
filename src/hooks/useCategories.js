import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Drinks', icon: 'Utensils' },
  { name: 'Shopping', icon: 'ShoppingCart' },
  { name: 'Housing', icon: 'Home' },
  { name: 'Transportation', icon: 'Bus' },
  { name: 'Vehicle', icon: 'Car' },
  { name: 'Life & Entertainment', icon: 'Smile' },
  { name: 'Communication, PC', icon: 'Monitor' },
  { name: 'Financial expenses', icon: 'CreditCard' }
];

export const useCategories = (user, setCategory) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      return;
    }

    const qCat = query(collection(db, 'categories'), orderBy('createdAt', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const catData = [];
      snapshot.forEach((document) => {
        catData.push({ id: document.id, ...document.data() });
      });
      setCategories(catData);
      
      // If we provided a setter for the default category in the form, update it if it's empty
      if (catData.length > 0 && setCategory) {
        setCategory(prev => prev === '' ? catData[0].name : prev);
      }
    });

    return () => unsubCat();
  }, [user, setCategory]);

  const addCategory = useCallback(async (name, icon) => {
    try {
      await addDoc(collection(db, 'categories'), {
        name: name,
        icon: icon,
        subcategories: [],
        createdAt: serverTimestamp()
      });
      toast.success("Category added!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding category: ", error);
      toast.error("Failed to add category.");
      playErrorSound();
      return false;
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success("Category deleted.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting category: ", error);
      toast.error("Failed to delete category.");
      playErrorSound();
      return false;
    }
  }, []);

  const addSubcategory = useCallback(async (catId, subName) => {
    try {
      await updateDoc(doc(db, 'categories', catId), {
        subcategories: arrayUnion(subName)
      });
      toast.success(`Subcategory "${subName}" added!`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding subcategory: ", error);
      toast.error("Failed to add subcategory.");
      playErrorSound();
      return false;
    }
  }, []);

  const deleteSubcategory = useCallback(async (catId, subName) => {
    try {
      await updateDoc(doc(db, 'categories', catId), {
        subcategories: arrayRemove(subName)
      });
      toast.success("Subcategory deleted.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting subcategory: ", error);
      toast.error("Failed to delete subcategory.");
      playErrorSound();
      return false;
    }
  }, []);

  const seedDefaultCategories = useCallback(async () => {
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await addDoc(collection(db, 'categories'), {
          name: cat.name,
          icon: cat.icon,
          subcategories: [],
          createdAt: serverTimestamp()
        });
      }
      toast.success("Default categories seeded!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error seeding categories: ", error);
      toast.error("Failed to seed categories.");
      playErrorSound();
      return false;
    }
  }, []);

  return { categories, addCategory, deleteCategory, addSubcategory, deleteSubcategory, seedDefaultCategories, DEFAULT_CATEGORIES };
};
