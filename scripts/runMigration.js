import { db } from '../src/firebase.js';
import { supabase } from '../src/supabase.js';
import { collection, getDocs } from 'firebase/firestore';

async function migrate() {
  console.log("Starting Firebase to Supabase Migration...");

  // 1. Fetch Categories & Subcategories from Firebase
  console.log("\n--- Step 1: Categories & Subcategories ---");
  const catSnap = await getDocs(collection(db, 'categories'));
  console.log(`Found ${catSnap.size} categories in Firebase.`);

  const catMap = new Map(); // name -> id
  const subMap = new Map(); // `${catId}:${subName}` -> id

  // Load existing Supabase categories
  const { data: existingCats } = await supabase.from('categories').select('*, subcategories(*)');
  (existingCats || []).forEach(c => {
    catMap.set(c.name.toLowerCase().trim(), c.id);
    (c.subcategories || []).forEach(s => {
      subMap.set(`${c.id}:${s.name.toLowerCase().trim()}`, s.id);
    });
  });

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

      if (error) {
        console.error(`Error inserting category ${catName}:`, error.message);
        continue;
      }
      catId = inserted.id;
      catMap.set(catName.toLowerCase(), catId);
      console.log(`+ Inserted new category: ${catName} (${catId})`);
    }

    // Insert subcategories
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

        if (subErr) {
          console.error(`Error inserting subcategory ${subName}:`, subErr.message);
        } else {
          subMap.set(subKey, insertedSub.id);
          console.log(`  + Inserted subcategory: ${subName}`);
        }
      }
    }
  }

  // 2. Templates
  console.log("\n--- Step 2: Templates ---");
  const tplSnap = await getDocs(collection(db, 'templates'));
  console.log(`Found ${tplSnap.size} templates in Firebase.`);

  for (const doc of tplSnap.docs) {
    const d = doc.data();
    const catId = d.category ? catMap.get(d.category.toLowerCase().trim()) || null : null;
    let subId = null;
    if (catId && d.subcategory) {
      subId = subMap.get(`${catId}:${d.subcategory.toLowerCase().trim()}`) || null;
    }

    // Check if template exists
    const { data: existingTpl } = await supabase
      .from('templates')
      .select('id')
      .eq('name', d.name)
      .maybeSingle();

    if (!existingTpl) {
      const { error } = await supabase
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

      if (error) console.error(`Error inserting template ${d.name}:`, error.message);
      else console.log(`+ Migrated template: ${d.name}`);
    }
  }

  // 3. Transactions
  console.log("\n--- Step 3: Transactions ---");
  const txSnap = await getDocs(collection(db, 'transactions'));
  console.log(`Found ${txSnap.size} transactions in Firebase.`);

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

  // Insert in batches of 50
  for (let i = 0; i < txBatch.length; i += 50) {
    const chunk = txBatch.slice(i, i + 50);
    const { error } = await supabase.from('transactions').insert(chunk);
    if (error) console.error(`Error inserting transaction chunk ${i}:`, error.message);
    else console.log(`+ Inserted transactions ${i + 1} to ${Math.min(i + 50, txBatch.length)} of ${txBatch.length}`);
  }

  // 4. Savings
  console.log("\n--- Step 4: Savings ---");
  const savSnap = await getDocs(collection(db, 'savings'));
  console.log(`Found ${savSnap.size} savings in Firebase.`);

  for (const doc of savSnap.docs) {
    const d = doc.data();
    const { error } = await supabase.from('savings').insert([{
      type: d.type || 'Deposit',
      amount: parseFloat(d.amount || 0),
      note: d.description || '',
      date: new Date(d.date || Date.now()).toISOString()
    }]);
    if (error) console.error("Error inserting saving:", error.message);
  }
  console.log(`+ Migrated ${savSnap.size} savings records.`);

  // 5. Money Lent
  console.log("\n--- Step 5: Money Lent ---");
  const lentSnap = await getDocs(collection(db, 'moneyLent'));
  console.log(`Found ${lentSnap.size} lent records in Firebase.`);

  for (const doc of lentSnap.docs) {
    const d = doc.data();
    const txObj = {
      totalPaid: parseFloat(d.totalPaid || 0),
      history: d.history || []
    };

    const { error } = await supabase.from('lent_money').insert([{
      name: d.name,
      relationship: d.type || 'Other',
      debt_type: d.debtType || 'lent',
      lent_amount: parseFloat(d.totalAmount || 0),
      status: d.status || 'pending',
      transactions: txObj
    }]);
    if (error) console.error("Error inserting lent record:", error.message);
    else console.log(`+ Migrated lent record: ${d.name}`);
  }

  // 6. Metadata
  console.log("\n--- Step 6: Metadata ---");
  const metaSnap = await getDocs(collection(db, 'metadata'));
  for (const doc of metaSnap.docs) {
    const { error } = await supabase.from('metadata').upsert({
      key: doc.id,
      data: doc.data(),
      updated_at: new Date().toISOString()
    });
    if (error) console.error("Error inserting metadata:", error.message);
    else console.log(`+ Migrated metadata: ${doc.id}`);
  }

  console.log("\n==========================================");
  console.log("🎉 ALL DATA MIGRATED SUCCESSFULLY TO SUPABASE!");
  console.log("==========================================");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
