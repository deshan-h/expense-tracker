import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useWishlist = (user, addExpense) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    const qWishlist = query(collection(db, 'wishlist'), orderBy('dateAdded', 'desc'));
    const unsubWishlist = onSnapshot(qWishlist, (snapshot) => {
      const data = [];
      snapshot.forEach((document) => {
        data.push({ id: document.id, ...document.data() });
      });
      setWishlistItems(data);
      setLoading(false);
    });

    return () => unsubWishlist();
  }, [user]);

  const addWishlistItem = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'wishlist'), {
        name: data.name,
        estimatedCost: data.estimatedCost,
        subItems: data.subItems || [],
        status: 'pending',
        actualCost: null,
        dateAdded: new Date().toISOString(),
        dateCompleted: null
      });
      toast.success("Added to Wishlist!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding wishlist item: ", error);
      toast.error("Failed to add to Wishlist.");
      playErrorSound();
      return false;
    }
  }, []);

  const completeWishlistItem = useCallback(async (id, item, actualCost, category, subcategory) => {
    try {
      // 1. Mark as completed in Wishlist
      await updateDoc(doc(db, 'wishlist', id), {
        status: 'completed',
        actualCost: actualCost,
        dateCompleted: new Date().toISOString()
      });

      // 2. Add as an actual expense
      if (addExpense) {
        const fullDate = new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().slice(0, 5);
        await addExpense({
          category: category || 'Wishlist',
          subcategory: subcategory || item.name,
          amount: parseFloat(actualCost),
          description: `Wishlist: ${item.name}`,
          date: fullDate,
          isTracked: true
        });
      }

      toast.success(`${item.name} completed and recorded as expense!`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error completing wishlist item: ", error);
      toast.error("Failed to complete item.");
      playErrorSound();
      return false;
    }
  }, [addExpense]);

  const deleteWishlistItem = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'wishlist', id));
      toast.success("Wishlist item deleted.");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error deleting wishlist item: ", error);
      toast.error("Failed to delete wishlist item.");
      playErrorSound();
      return false;
    }
  }, []);

  const addSubItemToWishlist = useCallback(async (id, currentSubItems, newSubItemName, newSubItemCost) => {
    try {
      const updatedSubItems = [...(currentSubItems || []), { 
        name: newSubItemName, 
        estimatedCost: newSubItemCost ? parseFloat(newSubItemCost) : null 
      }];
      
      const newTotalEstimatedCost = updatedSubItems.reduce((acc, curr) => acc + (curr.estimatedCost || 0), 0);

      await updateDoc(doc(db, 'wishlist', id), {
        subItems: updatedSubItems,
        estimatedCost: newTotalEstimatedCost
      });
      toast.success("Sub-item added!");
      return true;
    } catch (error) {
      console.error("Error adding sub-item: ", error);
      toast.error("Failed to add sub-item.");
      return false;
    }
  }, []);

  return { wishlistItems, loading, addWishlistItem, completeWishlistItem, deleteWishlistItem, addSubItemToWishlist };
};
