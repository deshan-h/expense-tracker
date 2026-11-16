import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useWishlist = (user, addExpense) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map(w => {
          let parsedNotes = {};
          try {
            parsedNotes = typeof w.notes === 'string' ? JSON.parse(w.notes || '{}') : (w.notes || {});
          } catch {
            parsedNotes = {};
          }

          return {
            ...w,
            name: w.title,
            estimatedCost: w.amount,
            subItems: parsedNotes.subItems || [],
            actualCost: parsedNotes.actualCost || null,
            dateAdded: w.created_at,
            dateCompleted: w.purchased_at
          };
        });
        setWishlistItems(formatted);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();

    if (!user) return;

    const channel = supabase
      .channel('wishlist-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, () => {
        fetchWishlist();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWishlist]);

  const addWishlistItem = useCallback(async (data) => {
    try {
      const notesObj = {
        subItems: data.subItems || [],
        actualCost: null
      };

      const { error } = await supabase
        .from('wishlist')
        .insert([{
          title: data.name,
          amount: parseFloat(data.estimatedCost || 0),
          priority: 'Medium',
          status: 'pending',
          notes: JSON.stringify(notesObj)
        }]);

      if (error) throw error;

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
      let currentNotes = {};
      try {
        currentNotes = typeof item.notes === 'string' ? JSON.parse(item.notes || '{}') : (item.notes || {});
      } catch {
        currentNotes = {};
      }

      currentNotes.actualCost = actualCost;

      const { error } = await supabase
        .from('wishlist')
        .update({
          status: 'completed',
          purchased_at: new Date().toISOString(),
          notes: JSON.stringify(currentNotes)
        })
        .eq('id', id);

      if (error) throw error;

      if (addExpense) {
        const fullDate = new Date().toLocaleDateString('en-CA') + 'T' + new Date().toTimeString().slice(0, 5);
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
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

      const notesObj = {
        subItems: updatedSubItems,
        actualCost: null
      };

      const { error } = await supabase
        .from('wishlist')
        .update({
          amount: newTotalEstimatedCost,
          notes: JSON.stringify(notesObj)
        })
        .eq('id', id);

      if (error) throw error;

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
