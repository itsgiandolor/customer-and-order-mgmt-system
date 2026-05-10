const DELIVERY_URL = () => process.env.DELIVERY_API_URL;

// Register order in Delivery system
// Creates a delivery order in the external delivery API
exports.registerDeliveryOrder = async (order) => {
    const res = await fetch(`${DELIVERY_URL()}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            order_id: order.order_id,
            customer_info: {
                name: order.customer_info.name,
                email: order.customer_info.email,
                contact_number: order.customer_info.contact_number,
                delivery_address: order.customer_info.delivery_address,
            },
            order_source: order.order_source || "web",
            items: order.items.map((i) => ({
                product_id: i.product_id,
                product_name: i.product_name,
                quantity: i.quantity,
                price: i.price,
                subtotal: i.subtotal,
            })),
            total_amount: order.total_amount,
            payment_status: "Confirmed",
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
    }

    return await res.json();
};

// Create delivery record
// Creates a shipment/delivery record for the order
exports.createDeliveryRecord = async (order_id) => {
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const res = await fetch(`${DELIVERY_URL()}/api/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            order_id: order_id,
            estimated_delivery: estimatedDelivery.toISOString(),
            courier_name: "J&T Express",
            delivery_notes: "",
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
    }

    return await res.json();
};

// Process delivery for order
// Combines both registration and delivery record creation
exports.processDelivery = async (order) => {
    try {
        // Step 1: Register order in Delivery system
        await exports.registerDeliveryOrder(order);
        console.log("[Delivery] Order registered in delivery system:", order.order_id);

        // Step 2: Create delivery record
        await exports.createDeliveryRecord(order.order_id);
        console.log("[Delivery] Shipment created for order:", order.order_id);

        return { success: true, message: "Order processed for delivery" };
    } catch (error) {
        throw new Error(`Delivery processing failed: ${error.message}`);
    }
};
