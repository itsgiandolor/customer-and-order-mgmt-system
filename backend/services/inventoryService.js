const INVENTORY_URL = () => process.env.INVENTORY_API_URL;

// Check if all items have sufficient stock
exports.checkStock = async (items) => {
    const res = await fetch(`${INVENTORY_URL()}/api/inventory`);
    if (!res.ok) throw new Error('Inventory service unreachable');
    const inventoryData = await res.json();

    for (const item of items) {
        const record = inventoryData.find(inv => inv.product_id === item.product_id);
        if (!record) {
            return {
                ok: false,
                message: `Product ${item.product_id} not found in inventory`,
                product_id: item.product_id,
            };
        }
        if (record.current_stock < item.quantity) {
            return {
                ok: false,
                message: `Not enough stock for ${item.product_id}`,
                product_id: item.product_id,
                available: record.current_stock,
            };
        }
    }
    return { ok: true };
};

// Deduct stock for each item after payment confirmation
exports.deductStock = async (items) => {
    console.log('[Inventory] Starting stock deduction for items:', JSON.stringify(items));

    // Step 1: Get current inventory
    const res = await fetch(`${INVENTORY_URL()}/api/inventory`);
    if (!res.ok) throw new Error('Inventory service unreachable during deduction');
    const inventoryData = await res.json();

    console.log('[Inventory] Current inventory fetched, records:', inventoryData.length);

    // Step 2: Deduct each item one by one
    for (const item of items) {
        const record = inventoryData.find(inv => inv.product_id === item.product_id);

        if (!record) {
            // Not found — log it but continue with other items
            console.error(`[Inventory] product_id "${item.product_id}" not found in inventory. Skipping deduction.`);
            continue;
        }

        const newStock = Math.max(0, record.current_stock - item.quantity);

        console.log(`[Inventory] Deducting ${item.product_id}: ${record.current_stock} → ${newStock}`);

        try {
            const updateRes = await fetch(`${INVENTORY_URL()}/api/inventory/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: item.product_id,
                    product_name: item.product_name,   // ← was missing, their model requires it
                    current_stock: newStock,
                }),
            });

            if (updateRes.ok) {
                const updatedData = await updateRes.json();
                console.log(`[Inventory] ✅ Deducted ${item.product_id}. New stock:`, updatedData?.current_stock ?? newStock);
            } else {
                // Log the actual error body from their API
                const errBody = await updateRes.text();
                console.error(`[Inventory] ❌ Update failed for ${item.product_id}. Status: ${updateRes.status}. Body: ${errBody}`);
            }
        } catch (err) {
            console.error(`[Inventory] ❌ Network error updating ${item.product_id}:`, err.message);
        }
    }

    console.log('[Inventory] Stock deduction complete.');
};