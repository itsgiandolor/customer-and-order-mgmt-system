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

        // ─── COD (Cash on Delivery) Handling ───────────────────────────────────
        if (payment_method === 'COD') {
            // For COD: don't deduct stock yet, but still send to delivery
            // Stock is deducted when delivery confirms receipt
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

        // ─── Non-COD Payment Processing ───────────────────────────────────────
        order.payment_status = finalPaymentStatus;
        if (finalPaymentStatus === "Confirmed") {
            order.order_status = "Confirmed";
        } else if (finalPaymentStatus === "Failed") {
            order.order_status = "Cancelled";
            await order.save();
            return res.status(200).json({ message: "Payment failed. Order cancelled.", payment, order });
        }
        await order.save();

        // Deduct Stock
        try {
            await deductStock(order.items);
            console.log('[Inventory] Stock deducted for order:', order.order_id);
        } catch (err) {
            console.error('[Inventory deduction failed]', err.message);
        }

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