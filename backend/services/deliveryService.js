const DELIVERY_URL = () => process.env.DELIVERY_API_URL;

/** Same value delivery subsystem should use as ORDER_MGMT_URL (Render sets RENDER_EXTERNAL_URL). */
const customerApiBaseForPartners = () => {
    const raw = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_CUSTOMER_API_URL || '';
    return typeof raw === 'string' ? raw.replace(/\/+$/, '') : '';
};

const requireDeliveryBase = () => {
    const base = DELIVERY_URL();
    if (!base || typeof base !== 'string') {
        throw new Error('DELIVERY_API_URL is not set');
    }
    return base.replace(/\/+$/, '');
};

const safeJson = async (res) => {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { message: text.slice(0, 200) };
    }
};

const isMissingRoute404 = (res, data) => {
    if (res.status !== 404) return false;
    const msg = String(data?.message ?? '');
    return msg.includes('Cannot POST') || msg.includes('Cannot GET');
};

const partnerOrderMgmtHint = () => {
    const ours = customerApiBaseForPartners();
    if (ours) {
        return `On the Delivery service (Render), set ORDER_MGMT_URL=${ours} — their createDelivery loads GET ${ours}/api/orders/<order_id>.`;
    }
    return 'On the Delivery service (Render), set ORDER_MGMT_URL to this API’s public HTTPS origin (same host you use for /api/orders). On this service set RENDER_EXTERNAL_URL or PUBLIC_CUSTOMER_API_URL so logs can print the exact value.';
};

// Register order in Delivery system (optional — not deployed on all delivery hosts)
exports.registerDeliveryOrder = async (order) => {
    const base = requireDeliveryBase();
    const url = `${base}/api/orders`;

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
            return null;
        }
        console.error('[Delivery] registerDeliveryOrder failed:', res.status, data.message);
        throw new Error(`Register order failed (${res.status}): ${data.message}`);
    }

    return data;
};

exports.createDeliveryRecord = async (order_id) => {
    const base = requireDeliveryBase();
    const url = `${base}/api/deliveries`;

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
        const body = String(data?.message ?? '');
        if (res.status === 404 && body.includes('Order not found in Customer')) {
            console.error('[Delivery] createDelivery failed: delivery cannot GET this order from Customer API.', partnerOrderMgmtHint());
        } else {
            console.error('[Delivery] createDelivery failed:', res.status, body);
        }
        throw new Error(`Create delivery failed (${res.status}): ${data.message}`);
    }

    return data;
};

exports.processDelivery = async (order) => {
    await exports.registerDeliveryOrder(order);
    await exports.createDeliveryRecord(order.order_id);
    return { success: true };
};
