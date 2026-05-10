const Payment = require("../models/Payment");
const Order = require("../models/Order");

const generatePaymentId = () => "PAY-" + Date.now();

// POST /api/payments/confirm
exports.confirmPayment = async (req, res) => {
    try {
        const {
            order_id,
            payment_method,
            payment_amount,
            payment_status,
            transaction_reference,
        } = req.body;

        if (!order_id || !payment_method || !payment_amount || !transaction_reference) {
            return res.status(400).json({
                message: "Order ID, payment method, amount, and transaction reference are required.",
            });
        }

        const order = await Order.findOne({ order_id });
        if (!order) return res.status(404).json({ message: "Order not found." });

        if (Number(payment_amount) !== Number(order.total_amount)) {
            return res.status(400).json({
                message: "Payment amount does not match order total.",
                order_total: order.total_amount,
                payment_amount,
            });
        }

        const existingPayment = await Payment.findOne({ transaction_reference });
        if (existingPayment) {
            return res.status(409).json({ message: "Duplicate transaction reference detected." });
        }

        const finalPaymentStatus = payment_status || "Confirmed";

        const payment = await Payment.create({
            payment_id: generatePaymentId(),
            order_id,
            payment_method,
            payment_amount,
            payment_status: finalPaymentStatus,
            transaction_reference,
            payment_date: new Date(),
        });

        order.payment_status = finalPaymentStatus;
        if (finalPaymentStatus === "Confirmed") {
            order.order_status = "Confirmed";
        } else if (finalPaymentStatus === "Failed") {
            order.order_status = "Cancelled";
            await order.save();
            return res.status(200).json({ message: "Payment failed. Order cancelled.", payment, order });
        }
        await order.save();

        // ─── Inventory Deduction ───────────────────────────────────────────────
        try {
            const inventoryRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory`);
            const inventoryData = await inventoryRes.json();

            for (const orderedItem of order.items) {
                const invRecord = inventoryData.find(
                    (inv) => inv.product_id === orderedItem.product_id
                );
                if (invRecord) {
                    const newStock = Math.max(0, invRecord.current_stock - orderedItem.quantity);
                    await fetch(`${process.env.INVENTORY_API_URL}/api/inventory/update`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            product_id: orderedItem.product_id,
                            current_stock: newStock,
                        }),
                    });
                }
            }
            console.log("[Inventory] Stock deducted for order:", order.order_id);
        } catch (err) {
            console.error("[Inventory deduction failed]", err.message);
        }

        // ─── Delivery API ──────────────────────────────────────────────────────
        try {
            const DELIVERY_URL = process.env.DELIVERY_API_URL;

            // Step 1: Register order in Delivery system
            const deliveryOrderRes = await fetch(`${DELIVERY_URL}/api/orders`, {
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

            if (!deliveryOrderRes.ok) {
                const err = await deliveryOrderRes.json();
                throw new Error(err.message);
            }

            // Step 2: Create delivery record
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

            const deliveryRes = await fetch(`${DELIVERY_URL}/api/deliveries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: order.order_id,
                    estimated_delivery: estimatedDelivery.toISOString(),
                    courier_name: "J&T Express",
                    delivery_notes: "",
                }),
            });

            if (deliveryRes.ok) {
                order.order_status = "Ready for Fulfillment";
                await order.save();
                console.log("[Delivery] Shipment created for order:", order.order_id);
            } else {
                const err = await deliveryRes.json();
                console.error("[Delivery] createDelivery failed:", err.message);
            }
        } catch (err) {
            console.error("[Delivery API error]", err.message);
        }

        // ─── Return response ───────────────────────────────────────────────────
        return res.status(201).json({
            message: "Payment confirmed. Order is being processed for fulfillment.",
            payment,
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/payments
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/payments/:payment_id
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findOne({ payment_id: req.params.payment_id });
        if (!payment) return res.status(404).json({ message: "Payment not found." });
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/payments/order/:order_id
exports.getPaymentByOrderId = async (req, res) => {
    try {
        const payment = await Payment.findOne({ order_id: req.params.order_id });
        if (!payment) return res.status(404).json({ message: "Payment for this order not found." });
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};