import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
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

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, subcategories(*)')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formatted = data.map(cat => ({
          ...cat,
          subcategories: (cat.subcategories || []).map(s => s.name),
          subcategoriesList: cat.subcategories || []
        }));
        setCategories(formatted);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();

    if (!user) return;

    // Realtime listeners for categories and subcategories
    const channel = supabase
      .channel('categories-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCategories, setCategory]);

  const addCategory = useCallback(async (name, icon, type = 'Expense') => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: name.trim(),
          icon: icon || 'Tag',
          type: type || 'Expense',
          target: 0
        }]);

      if (error) throw error;
      toast.success("Category added!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding category: ", error);
      toast.error(error.message || "Failed to add category.");
      playErrorSound();
      return false;
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await supabase
        .from('subcategories')
        .insert([{
          category_id: catId,
          name: subName.trim()
        }]);

      if (error) throw error;
      toast.success(`Subcategory "${subName}" added!`);
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error adding subcategory: ", error);
      toast.error(error.message || "Failed to add subcategory.");
      playErrorSound();
      return false;
    }
  }, []);

  const deleteSubcategory = useCallback(async (catId, subName) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('category_id', catId)
        .eq('name', subName);

      if (error) throw error;
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
        await supabase
          .from('categories')
          .insert([{
            name: cat.name,
            icon: cat.icon,
            type: 'Expense',
            target: 0
          }]);
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

  const updateCategoryTarget = useCallback(async (catId, targetAmount) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          target: targetAmount ? Number(targetAmount) : 0
        })
        .eq('id', catId);

      if (error) throw error;
      toast.success("Category target updated!");
      playSuccessSound();
      return true;
    } catch (error) {
      console.error("Error updating category target: ", error);
      toast.error("Failed to update target.");
      playErrorSound();
      return false;
    }
  }, []);

  return { 
    categories, 
    addCategory, 
    deleteCategory, 
    addSubcategory, 
    deleteSubcategory, 
    seedDefaultCategories, 
    DEFAULT_CATEGORIES, 
    updateCategoryTarget 
  };
};
