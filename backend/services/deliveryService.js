const DELIVERY_URL = () => process.env.DELIVERY_API_URL;

const requireBaseUrl = () => {
    const base = DELIVERY_URL();
    if (!base || typeof base !== 'string') {
        throw new Error('DELIVERY_API_URL is not set');
    }
    return base.replace(/\/+$/, '');
};

// Safely parse response — returns text if not JSON
const safeJson = async (res) => {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { message: text.slice(0, 200) }; // return first 200 chars of HTML for logging
    }
};

const isMissingRoute404 = (res, data) => {
    if (res.status !== 404) return false;
    const msg = String(data?.message ?? '');
    return msg.includes('Cannot POST') || msg.includes('Cannot GET');
};

// Register order in Delivery system (skipped if that route is not deployed)
exports.registerDeliveryOrder = async (order) => {
    const base = requireBaseUrl();
    const url = `${base}/api/orders`;
    console.log('[Delivery] Registering order at:', url);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            order_id: order.order_id,
            customer_info: {
                name: order.customer_info.name,
                email: order.customer_info.email,
                contact_number: order.customer_info.contact_number,
                delivery_address: order.customer_info.delivery_address,
            },
            order_source: order.order_source || 'web',
            items: order.items.map((i) => ({
                product_id: i.product_id,
                product_name: i.product_name,
                quantity: i.quantity,
                price: i.price,
                subtotal: i.subtotal,
            })),
            total_amount: order.total_amount,
            payment_status: 'Confirmed',
        }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        if (isMissingRoute404(res, data)) {
            console.warn(
                '[Delivery] /api/orders is not available on this host; skipping registration (proceeding with delivery only).'
            );
            return null;
        }
        console.error('[Delivery] registerDeliveryOrder failed. Status:', res.status, 'Body:', data.message);
        throw new Error(`Register order failed (${res.status}): ${data.message}`);
    }

    console.log('[Delivery] ✅ Order registered successfully:', order.order_id);
    return data;
};

// Create delivery record
exports.createDeliveryRecord = async (order_id) => {
    const base = requireBaseUrl();
    const url = `${base}/api/deliveries`;
    console.log('[Delivery] Creating delivery record at:', url);

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            order_id,
            estimated_delivery: estimatedDelivery.toISOString(),
            courier_name: 'J&T Express',
            delivery_notes: '',
        }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
        console.error('[Delivery] createDeliveryRecord failed. Status:', res.status, 'Body:', data.message);
        throw new Error(`Create delivery failed (${res.status}): ${data.message}`);
    }

    console.log('[Delivery] ✅ Delivery record created for order:', order_id);
    return data;
};

// Process delivery — register when supported, then create delivery record
exports.processDelivery = async (order) => {
    try {
        await exports.registerDeliveryOrder(order);
        await exports.createDeliveryRecord(order.order_id);
        return { success: true };
    } catch (error) {
        throw new Error(`Delivery processing failed: ${error.message}`);
    }
};
