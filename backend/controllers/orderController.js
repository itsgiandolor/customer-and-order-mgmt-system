const Order = require("../models/Order");
const { checkStock } = require('../services/inventoryService');
const { randomUUID } = require('crypto');

// In-memory fallback when MongoDB is not available
let memoryOrders = [];

const isMongoConnected = () => {
    const mongoose = require("mongoose");
    return mongoose.connection.readyState === 1;
};

const generateOrderId = () => {
    return "ORD-" + randomUUID().split('-')[0].toUpperCase();
};


exports.createOrder = async (req, res) => {
    try {
        const { customer_info, order_source, items } = req.body;

        if (!customer_info || !items || items.length === 0) {
            return res.status(400).json({ message: "Customer information and items are required." });
        }

        // 🔥 1. Check stock
        let stockCheck;
        try {
            stockCheck = await checkStock(items);
        } catch (err) {
            return res.status(503).json({
                message: 'Inventory service is currently unavailable. Please try again.',
            });
        }
        if (!stockCheck.ok) {
            return res.status(400).json({ message: stockCheck.message, available: stockCheck.available });
        }

        // 🔥 2. Compute totals (only AFTER stock is valid)
        const computedItems = items.map((item) => ({
            ...item,
            subtotal: item.quantity * item.price,
        }));

        const shipping_fee = req.body.shipping_fee || 0;
        const total_amount = computedItems.reduce((sum, item) => sum + item.subtotal, 0) + shipping_fee;

        // 🔥 3. Create order
        const order = await Order.create({
            order_id: generateOrderId(),
            customer_info,
            order_source,
            items: computedItems,
            shipping_fee,
            total_amount,
            payment_status: "Pending",
            order_status: "Processing",
        });

        res.status(201).json({
            message: "Order created successfully.",
            order,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        if (!isMongoConnected()) {
            const order = memoryOrders.find(o => o.order_id === req.params.order_id);
            if (!order) return res.status(404).json({ message: "Order not found." });
            return res.status(200).json(order);
        }

        const order = await Order.findOne({ order_id: req.params.order_id });
        if (!order) return res.status(404).json({ message: "Order not found." });
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.trackOrder = async (req, res) => {
    try {
        const { order_id, contact_number } = req.query;
        let order;

        if (!isMongoConnected()) {
            order = memoryOrders.find(o => o.order_id === order_id && o.customer_info.contact_number === contact_number);
        } else {
            order = await Order.findOne({
                order_id,
                "customer_info.contact_number": contact_number,
            });
        }

        if (!order) {
            return res.status(404).json({ message: "Order not found or contact number does not match." });
        }

        res.status(200).json({
            order_id: order.order_id,
            customer_name: order.customer_info.name,
            payment_status: order.payment_status,
            order_status: order.order_status,
            total_amount: order.total_amount,
            items: order.items,
            delivery_address: order.customer_info.delivery_address,
            createdAt: order.createdAt,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrdersByCustomer = async (req, res) => {
    try {
        const { contact_number } = req.params;
        let orders;

        if (!isMongoConnected()) {
            orders = memoryOrders.filter(o => o.customer_info.contact_number === contact_number);
        } else {
            orders = await Order.find({ "customer_info.contact_number": contact_number }).sort({ createdAt: -1 });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { order_status } = req.body;

        const order = await Order.findOneAndUpdate(
            { order_id: req.params.order_id },
            { order_status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        res.status(200).json({
            message: "Order status updated.",
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { order_id: req.params.order_id },
            { order_status: "Cancelled" },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        res.status(200).json({
            message: "Order cancelled.",
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
