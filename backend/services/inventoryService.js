const INVENTORY_URL = () => process.env.INVENTORY_API_URL;

// Check if all items have sufficient stock
// Returns { ok: true } or { ok: false, message, product_id, available }
exports.checkStock = async (items) => {
    const res = await fetch(`${INVENTORY_URL()}/api/inventory`);
    if (!res.ok) throw new Error('Inventory service unreachable');
    const inventoryData = await res.json();

    for (const item of items) {
        const record = inventoryData.find(inv => inv.product_id === item.product_id);
        if (!record) {
            return { ok: false, message: `Product ${item.product_id} not found in inventory`, product_id: item.product_id };
        }
        if (record.current_stock < item.quantity) {
            return { ok: false, message: `Not enough stock for ${item.product_id}`, product_id: item.product_id, available: record.current_stock };
        }
    }
    return { ok: true };
};

// Deduct stock for each item after payment confirmation
exports.deductStock = async (items) => {
    const res = await fetch(`${INVENTORY_URL()}/api/inventory`);
    if (!res.ok) throw new Error('Inventory service unreachable during deduction');
    const inventoryData = await res.json();

    for (const item of items) {
        const record = inventoryData.find(inv => inv.product_id === item.product_id);
        if (record) {
            const newStock = Math.max(0, record.current_stock - item.quantity);
            await fetch(`${INVENTORY_URL()}/api/inventory/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: item.product_id, current_stock: newStock }),
            });
        }
    }
};