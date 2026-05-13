const INVENTORY_URL = () => process.env.INVENTORY_API_URL;

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

exports.deductStock = async (items) => {
    console.log('==============================');
    console.log('[Inventory] deductStock CALLED');
    console.log('[Inventory] Items to deduct:', JSON.stringify(items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity
    }))));
    console.log('[Inventory] Using URL:', INVENTORY_URL());
    console.log('==============================');

    // Step 1: Get current inventory
    let inventoryData = [];
    try {
        const res = await fetch(`${INVENTORY_URL()}/api/inventory`);
        if (!res.ok) throw new Error(`GET /api/inventory returned ${res.status}`);
        inventoryData = await res.json();
        console.log(`[Inventory] Fetched ${inventoryData.length} inventory records`);
        console.log('[Inventory] Available product_ids:', inventoryData.map(i => i.product_id).join(', '));
    } catch (err) {
        throw new Error(`Inventory GET failed: ${err.message}`);
    }

    // Step 2: Deduct each item
    for (const item of items) {
        const record = inventoryData.find(inv => inv.product_id === item.product_id);

        if (!record) {
            console.error(`[Inventory] ❌ PRODUCT NOT FOUND: "${item.product_id}" — not in inventory. Cannot deduct.`);
            console.error(`[Inventory]    Inventory has: ${inventoryData.map(i => i.product_id).join(', ')}`);
            continue;
        }

        const newStock = Math.max(0, record.current_stock - item.quantity);
        console.log(`[Inventory] Deducting "${item.product_id}" (${item.product_name}): ${record.current_stock} → ${newStock}`);

        try {
            const updateRes = await fetch(`${INVENTORY_URL()}/api/inventory/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    current_stock: newStock,
                }),
            });

            const updateText = await updateRes.text();
            let updateData;
            try { updateData = JSON.parse(updateText); }
            catch { updateData = { raw: updateText.slice(0, 300) }; }

            if (updateRes.ok) {
                console.log(`[Inventory] ✅ POST update returned OK for ${item.product_id}`);
                console.log(`[Inventory]    Response:`, JSON.stringify(updateData));

                // ── Verify the update actually persisted ──────────────────
                try {
                    const verifyRes = await fetch(`${INVENTORY_URL()}/api/inventory`);
                    if (verifyRes.ok) {
                        const verifyData = await verifyRes.json();
                        const verified = verifyData.find(inv => inv.product_id === item.product_id);
                        if (verified) {
                            if (verified.current_stock === newStock) {
                                console.log(`[Inventory] ✅ VERIFIED: ${item.product_id} stock is now ${verified.current_stock}`);
                            } else {
                                console.error(`[Inventory] ⚠️  MISMATCH: Expected ${newStock} but inventory shows ${verified.current_stock}`);
                                console.error(`[Inventory]    The Inventory API accepted the POST but did NOT save the change.`);
                                console.error(`[Inventory]    Contact the Inventory team — their update endpoint may have a bug.`);
                            }
                        } else {
                            console.error(`[Inventory] ⚠️  product_id ${item.product_id} missing from inventory after update`);
                        }
                    }
                } catch (verifyErr) {
                    console.warn(`[Inventory] Could not verify update:`, verifyErr.message);
                }

            } else {
                console.error(`[Inventory] ❌ POST update FAILED for ${item.product_id}`);
                console.error(`[Inventory]    Status: ${updateRes.status}`);
                console.error(`[Inventory]    Response:`, JSON.stringify(updateData));
            }

        } catch (err) {
            console.error(`[Inventory] ❌ Network error for ${item.product_id}:`, err.message);
        }
    }

    console.log('[Inventory] deductStock complete.');
};