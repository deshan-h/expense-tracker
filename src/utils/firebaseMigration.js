import { db } from '../firebase';
import { supabase } from '../supabase';
import { collection, getDocs } from 'firebase/firestore';

export const runFirebaseMigration = async (onProgress) => {
  const report = (step, current, total, message) => {
    if (onProgress) {
      onProgress({ step, current, total, message, percent: total > 0 ? Math.round((current / total) * 100) : 0 });
    }
  };

  try {
    report('start', 0, 100, 'Connecting to Firebase Firestore...');

    // 1. Categories & Subcategories
    report('categories', 5, 100, 'Fetching categories from Firebase...');
    const catSnap = await getDocs(collection(db, 'categories'));
    
    const catMap = new Map();
    const subMap = new Map();

    const { data: existingCats } = await supabase.from('categories').select('*, subcategories(*)');
    (existingCats || []).forEach(c => {
      catMap.set(c.name.toLowerCase().trim(), c.id);
      (c.subcategories || []).forEach(s => {
        subMap.set(`${c.id}:${s.name.toLowerCase().trim()}`, s.id);
      });
    });

    let catCount = 0;
    for (const doc of catSnap.docs) {
      const data = doc.data();
      const catName = data.name.trim();
      const catType = data.type || 'Expense';
      let catId = catMap.get(catName.toLowerCase());

      if (!catId) {
        const { data: inserted, error } = await supabase
          .from('categories')
          .insert([{
            name: catName,
            type: catType,
            icon: data.icon || 'Tag',
            target: data.target ? Number(data.target) : 0
          }])
          .select()
          .single();

        if (!error && inserted) {
          catId = inserted.id;
          catMap.set(catName.toLowerCase(), catId);
          catCount++;
        }
      } else if (data.target) {
        await supabase
          .from('categories')
          .update({ target: Number(data.target) })
          .eq('id', catId);
      }

      const subList = Array.isArray(data.subcategories) ? data.subcategories : [];
      for (const sub of subList) {
        if (!sub || typeof sub !== 'string') continue;
        const subName = sub.trim();
        const subKey = `${catId}:${subName.toLowerCase()}`;
        if (!subMap.has(subKey)) {
          const { data: insertedSub, error: subErr } = await supabase
            .from('subcategories')
            .insert([{
              category_id: catId,
              name: subName
            }])
            .select()
            .single();

          if (!subErr && insertedSub) {
            subMap.set(subKey, insertedSub.id);
          }
        }
      }
    }
    report('categories', 20, 100, `Synced ${catSnap.size} categories and subcategories.`);

    // 2. Templates
    report('templates', 25, 100, 'Migrating templates...');
    const tplSnap = await getDocs(collection(db, 'templates'));

    for (const doc of tplSnap.docs) {
      const d = doc.data();
      const catId = d.category ? catMap.get(d.category.toLowerCase().trim()) || null : null;
      let subId = null;
      if (catId && d.subcategory) {
        subId = subMap.get(`${catId}:${d.subcategory.toLowerCase().trim()}`) || null;
      }

      const { data: existingTpl } = await supabase
        .from('templates')
        .select('id')
        .eq('name', d.name)
        .maybeSingle();

      if (!existingTpl) {
        await supabase
          .from('templates')
          .insert([{
            name: d.name,
            amount: parseFloat(d.amount || 0),
            type: d.type || 'Expense',
            category_id: catId,
            subcategory_id: subId,
            description: d.description || '',
            cycle_days: d.trackCycle && d.cycleDays ? Number(d.cycleDays) : null,
            last_used: d.lastPaidDate || null,
            breaks_count: Number(d.cycleBreakCount) || 0
          }]);
      }
    }
    report('templates', 40, 100, `Synced ${tplSnap.size} templates.`);

    // 3. Transactions
    report('transactions', 45, 100, 'Fetching transactions...');
    const txSnap = await getDocs(collection(db, 'transactions'));
    const totalTx = txSnap.size;

    // Check count of transactions in Supabase to avoid mass duplicates
    const { count: supabaseTxCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (!supabaseTxCount || supabaseTxCount < totalTx) {
      const txBatch = [];
      for (const doc of txSnap.docs) {
        const d = doc.data();
        const catId = d.category ? catMap.get(d.category.toLowerCase().trim()) || null : null;
        let subId = null;
        if (catId && d.subcategory) {
          subId = subMap.get(`${catId}:${d.subcategory.toLowerCase().trim()}`) || null;
        }

        txBatch.push({
          type: d.type || 'Expense',
          category_id: catId,
          subcategory_id: subId,
          amount: parseFloat(d.amount || 0),
          description: d.description || '',
          date: new Date(d.date || Date.now()).toISOString(),
          is_tracked: d.isTracked ?? true,
          pos_latest_timestamp: d.posLatestTimestamp || null
        });
      }

      // Batch insert in chunks of 50
      for (let i = 0; i < txBatch.length; i += 50) {
        const chunk = txBatch.slice(i, i + 50);
        await supabase.from('transactions').insert(chunk);
        const progress = Math.min(80, 45 + Math.round((i / txBatch.length) * 35));
        report('transactions', progress, 100, `Migrated ${Math.min(i + 50, txBatch.length)} of ${txBatch.length} transactions...`);
      }
    } else {
      report('transactions', 80, 100, `Transactions already up to date (${supabaseTxCount} records).`);
    }

    // 4. Savings
    report('savings', 85, 100, 'Migrating savings...');
    const savSnap = await getDocs(collection(db, 'savings'));
    const { count: supabaseSavCount } = await supabase.from('savings').select('*', { count: 'exact', head: true });

    if (!supabaseSavCount || supabaseSavCount < savSnap.size) {
      // Clear any partial data before migrating savings cleanly to avoid duplicates
      if (supabaseSavCount > 0 && supabaseSavCount < savSnap.size) {
        await supabase.from('savings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      for (const doc of savSnap.docs) {
        const d = doc.data();
        const savingType = d.type === 'Withdrawal' ? 'Withdrawal' : 'Deposit';
        await supabase.from('savings').insert([{
          type: savingType,
          amount: parseFloat(d.amount || 0),
          note: d.type === 'Initial' ? `[Initial Balance] ${d.description || ''}` : (d.description || ''),
          date: new Date(d.date || Date.now()).toISOString()
        }]);
      }
      report('savings', 90, 100, `Synced ${savSnap.size} savings records.`);
    } else {
      report('savings', 90, 100, `Savings already up to date (${supabaseSavCount} records).`);
    }

    // 5. Money Lent
    report('lent', 95, 100, 'Migrating lent & borrowed ledgers...');
    const lentSnap = await getDocs(collection(db, 'moneyLent'));
    const { count: supabaseLentCount } = await supabase.from('lent_money').select('*', { count: 'exact', head: true });

    if (!supabaseLentCount || supabaseLentCount < lentSnap.size) {
      for (const doc of lentSnap.docs) {
        const d = doc.data();
        const txObj = {
          totalPaid: parseFloat(d.totalPaid || 0),
          history: d.history || []
        };

        await supabase.from('lent_money').insert([{
          name: d.name,
          relationship: d.type || 'Other',
          debt_type: d.debtType || 'lent',
          lent_amount: parseFloat(d.totalAmount || 0),
          status: d.status || 'pending',
          transactions: txObj
        }]);
      }
    }

    // 6. Metadata
    report('metadata', 98, 100, 'Syncing metadata & POS settings...');
    const metaSnap = await getDocs(collection(db, 'metadata'));
    for (const doc of metaSnap.docs) {
      await supabase.from('metadata').upsert({
        key: doc.id,
        data: doc.data(),
        updated_at: new Date().toISOString()
      });
    }

    report('done', 100, 100, 'All data successfully migrated to Supabase!');

    return {
      success: true,
      stats: {
        transactions: totalTx,
        categories: catSnap.size,
        templates: tplSnap.size,
        savings: savSnap.size,
        lent: lentSnap.size
      }
    };
  } catch (error) {
    console.error("Migration error:", error);
    report('error', 0, 100, `Migration error: ${error.message}`);
    throw error;
  }
};
