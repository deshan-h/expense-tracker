import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from '../utils/sounds';

export const useTemplates = (user) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('v_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map(tpl => ({
          ...tpl,
          category: tpl.category_name || '',
          subcategory: tpl.subcategory_name || '',
          trackCycle: Boolean(tpl.cycle_days),
          cycleDays: tpl.cycle_days,
          lastPaidDate: tpl.last_used,
          cycleBreakCount: tpl.breaks_count || 0
        }));
        setTemplates(formatted);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();

    if (!user) return;

    const channel = supabase
      .channel('templates-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, () => {
        fetchTemplates();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTemplates]);

  const resolveCategoryIds = async (categoryName, subcategoryName) => {
    let category_id = null;
    let subcategory_id = null;

    if (categoryName) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName.trim())
        .maybeSingle();

      if (cat) {
        category_id = cat.id;

        if (subcategoryName) {
          const { data: sub } = await supabase
            .from('subcategories')
            .select('id')
            .eq('category_id', category_id)
            .eq('name', subcategoryName.trim())
            .maybeSingle();

          if (sub) {
            subcategory_id = sub.id;
          }
        }
      }
    }

    return { category_id, subcategory_id };
  };

  const addTemplate = useCallback(async (data) => {
    try {
      const { category_id, subcategory_id } = await resolveCategoryIds(data.category, data.subcategory);

      const { error } = await supabase
        .from('templates')
        .insert([{
          name: data.name,
          amount: parseFloat(data.amount),
          type: data.type || 'Expense',
          category_id,
          subcategory_id,
          description: data.description || '',
          cycle_days: data.trackCycle && data.cycleDays ? Number(data.cycleDays) : null,
          last_used: data.lastPaidDate || null,
          breaks_count: Number(data.cycleBreakCount) || 0
        }]);

      if (error) throw error;

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
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
      if (data.amount !== undefined) updateData.amount = parseFloat(data.amount);
      if (data.description !== undefined) updateData.description = data.description || '';
      if (data.trackCycle !== undefined || data.cycleDays !== undefined) {
        updateData.cycle_days = (data.trackCycle ?? true) && data.cycleDays ? Number(data.cycleDays) : null;
      }
      if (data.lastPaidDate !== undefined) updateData.last_used = data.lastPaidDate;
      if (data.cycleBreakCount !== undefined) updateData.breaks_count = Number(data.cycleBreakCount) || 0;

      if (data.category !== undefined) {
        const { category_id, subcategory_id } = await resolveCategoryIds(data.category, data.subcategory);
        updateData.category_id = category_id;
        updateData.subcategory_id = subcategory_id;
      }

      const { error } = await supabase
        .from('templates')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

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
