const Payment = require("../models/Payment");
const Order = require("../models/Order");
const { deductStock } = require('../services/inventoryService');
const { processDelivery } = require('../services/deliveryService');
const { randomUUID } = require('crypto');

const generatePaymentId = () => "PAY-" + randomUUID().split('-')[0].toUpperCase();

// POST /api/payments/confirm
exports.confirmPayment = async (req, res) => {
    try {
        const {
            order_id,
            payment_method,
            payment_amount,
            phone_number,
        } = req.body;

        if (!order_id || !payment_method || !payment_amount) {
            return res.status(400).json({
                message: "Order ID, payment method, and amount are required.",
            });
        }

        // Validate phone number for GCash/Maya
        if ((payment_method === 'GCash' || payment_method === 'Maya') && !phone_number) {
            return res.status(400).json({
                message: `${payment_method} requires a phone number.`,
            });
        }

        const order = await Order.findOne({ order_id });
        if (!order) return res.status(404).json({ message: "Order not found." });

        // Prevent double payment
        if (order.payment_status === 'Confirmed') {
            return res.status(409).json({ message: 'This order has already been paid.' });
        }

        if (Number(payment_amount) !== Number(order.total_amount)) {
            return res.status(400).json({
                message: "Payment amount does not match order total.",
                order_total: order.total_amount,
                payment_amount,
            });
        }

        const transaction_reference = `TXN-${Date.now()}-${order_id}`;
        const existingPayment = await Payment.findOne({ transaction_reference });
        if (existingPayment) {
            return res.status(409).json({ message: "Duplicate transaction reference detected." });
        }

        // ─── COD (Cash on Delivery) Handling ───────────────────────────────────
        if (payment_method === 'COD') {
            const payment = await Payment.create({
                payment_id: "PAY-" + Date.now().toString().slice(-8),
                order_id,
                payment_method,
                payment_amount,
                payment_status: 'Pending', // COD stays pending until delivery
                transaction_reference,
                payment_date: new Date(),
            });

            order.payment_status = 'Pending';
            order.order_status = 'Confirmed';
            await order.save();

            try {
                await processDelivery(order);
                order.order_status = 'Ready for Fulfillment';
                await order.save();
            } catch (err) {
                console.error('[Delivery Service error - COD]', err.message);
            }

            return res.status(201).json({
                message: 'COD order confirmed. Payment to be collected on delivery.',
                payment,
                order,
            });
        }

        // ─── GCash & Maya Payment Processing (Simple Form) ───────────────────────
        // For GCash and Maya, just confirm immediately (simulate successful payment)
        const payment = await Payment.create({
            payment_id: "PAY-" + Date.now().toString().slice(-8),
            order_id,
            payment_method,
            payment_amount,
            payment_status: 'Confirmed', // Automatically confirmed
            transaction_reference,
            payment_date: new Date(),
        });

        order.payment_status = 'Confirmed';
        order.order_status = 'Confirmed';
        await order.save();

        // Deduct Stock after payment confirmed
        try {
            await deductStock(order.items);
            console.log('[Inventory] Stock deducted for order:', order.order_id);
        } catch (err) {
            console.error('[Inventory deduction failed]', err.message);
        }

        // Process Delivery
        try {
            await processDelivery(order);
            order.order_status = 'Ready for Fulfillment';
            await order.save();
        } catch (err) {
            console.error('[Delivery Service error]', err.message);
        }

        return res.status(201).json({
            message: `${payment_method} payment confirmed. Order is being processed.`,
            payment,
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Delivery Service ─────────────────────────────────────────────────
try {
    await processDelivery(order);
    order.order_status = "Ready for Fulfillment";
    await order.save();
} catch (err) {
    console.error("[Delivery Service error]", err.message);
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

// POST /api/payments/cod-confirm/:order_id
// Called when COD order is delivered and payment is collected
exports.confirmCODPayment = async (req, res) => {
    try {
        const { order_id } = req.params;

        const order = await Order.findOne({ order_id });
        if (!order) return res.status(404).json({ message: "Order not found." });

        const payment = await Payment.findOne({ order_id });
        if (!payment) return res.status(404).json({ message: "Payment record not found." });

        // Check if COD payment
        if (payment.payment_method !== 'COD') {
            return res.status(400).json({ message: "This is not a COD order." });
        }

        // Check if already confirmed
        if (payment.payment_status === 'Confirmed') {
            return res.status(409).json({ message: "Payment already confirmed." });
        }

        // Mark payment as confirmed
        payment.payment_status = 'Confirmed';
        await payment.save();

        // Update order status
        order.payment_status = 'Confirmed';
        await order.save();

        // Deduct stock only when COD payment is confirmed (on delivery)
        try {
            await deductStock(order.items);
            console.log('[Inventory] Stock deducted for COD order:', order.order_id);
        } catch (err) {
            console.error('[Inventory deduction failed for COD]', err.message);
        }

        res.status(200).json({
            message: "COD payment confirmed. Order is complete.",
            payment,
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};