import { posSupabase } from "../supabase.js";

/**
 * Fetch and calculate new net profit from POS Supabase (desh-digital-hub)
 * @param {string|null} lastSyncDateStr - ISO date string of last sync timestamp
 * @returns {Promise<{ sum: number, count: number, latestTimestamp: string|null, success: boolean, error?: string }>}
 */
export const fetchNewSalesSum = async (lastSyncDateStr) => {
  const lastSyncTime = lastSyncDateStr ? new Date(lastSyncDateStr).getTime() : 0;

  if (!posSupabase) {
    return {
      success: false,
      error: "POS Supabase client is not configured. Please check VITE_POS_SUPABASE_URL and VITE_POS_SUPABASE_ANON_KEY."
    };
  }

  try {
    const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : null;
    const procEnv = typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : null;
    const tableName = metaEnv?.VITE_POS_SALES_TABLE || procEnv?.VITE_POS_SALES_TABLE || 'daily_sales';

    const { data, error } = await posSupabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let sum = 0;
    let count = 0;
    let latestTimestamp = null;

    (data || []).forEach((row) => {
      const rawTimestamp = row.created_at || row.timestamp || row.date;
      if (!rawTimestamp) return;

      const saleTime = new Date(rawTimestamp).getTime();

      if (saleTime > lastSyncTime) {
        let income;
        const saleAmount = Number(row.amount || row.totalAmount || row.total_amount || row.total || 0);

        if (row.isRepair || row.is_repair) {
          income = saleAmount - Number(row.cost || 0);
        } else {
          let totalCost = 0;
          const items = row.cart_items || row.cartItems;
          if (items && Array.isArray(items)) {
            items.forEach((item) => {
              const qty = Number(item.qty || item.quantity || 1);
              const cost = Number(item.cost || 0);
              totalCost += cost * qty;
            });
          }
          income = saleAmount - totalCost;
        }

        sum += income;
        count++;
        if (!latestTimestamp || saleTime > latestTimestamp) {
          latestTimestamp = saleTime;
        }
      }
    });

    return {
      sum,
      count,
      latestTimestamp: latestTimestamp ? new Date(latestTimestamp).toISOString() : null,
      success: true
    };
  } catch (err) {
    console.error("Error fetching from POS Supabase:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch sales from POS database"
    };
  }
};
