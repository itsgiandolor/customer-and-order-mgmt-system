const Payment = require("../models/Payment");
const Order = require("../models/Order");

const generatePaymentId = () => {
    return "PAY-" + Date.now();
};

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

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
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
            return res.status(409).json({
                message: "Duplicate transaction reference detected.",
            });
        }

        const payment = await Payment.create({
            payment_id: generatePaymentId(),
            order_id,
            payment_method,
            payment_amount,
            payment_status: payment_status || "Confirmed",
            transaction_reference,
            payment_date: new Date(),
        });

        order.payment_status = payment.payment_status;

        if (payment.payment_status === "Confirmed") {
            order.order_status = "Confirmed";
        } else if (payment.payment_status === "Failed") {
            order.order_status = "Cancelled";
        }

        await order.save();

        res.status(201).json({
            message: "Payment recorded successfully.",
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
        const payment = await Payment.findOne({
            payment_id: req.params.payment_id,
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found." });
        }

        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/payments/order/:order_id
exports.getPaymentByOrderId = async (req, res) => {
    try {
        const payment = await Payment.findOne({
            order_id: req.params.order_id,
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment for this order not found." });
        }

        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};