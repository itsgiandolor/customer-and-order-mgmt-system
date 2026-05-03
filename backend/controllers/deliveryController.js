const Delivery = require("../models/Delivery");
const Order = require("../models/Order");

const generateDeliveryId = () => {
    return "DEL-" + Date.now();
};

// POST /api/deliveries
exports.createDelivery = async (req, res) => {
    try {
        const {
            order_id,
            status,
            estimated_delivery,
            courier_name,
            delivery_notes,
        } = req.body;

        if (!order_id || !estimated_delivery || !courier_name) {
            return res.status(400).json({
                message: "Order ID, estimated delivery, and courier name are required.",
            });
        }

        const order = await Order.findOne({ order_id });

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.payment_status !== "Confirmed") {
            return res.status(400).json({
                message: "Delivery cannot be created because payment is not confirmed.",
            });
        }

        const existingDelivery = await Delivery.findOne({ order_id });

        if (existingDelivery) {
            return res.status(409).json({
                message: "Delivery record already exists for this order.",
            });
        }

        const delivery = await Delivery.create({
            delivery_id: generateDeliveryId(),
            order_id,
            status: status || "Pending",
            estimated_delivery,
            courier_name,
            delivery_notes: delivery_notes || "",
        });

        order.order_status = "Ready for Fulfillment";
        await order.save();

        res.status(201).json({
            message: "Delivery record created successfully.",
            delivery,
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/deliveries
exports.getDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find().sort({ createdAt: -1 });

        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/deliveries/:delivery_id
exports.getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({
            delivery_id: req.params.delivery_id,
        });

        if (!delivery) {
            return res.status(404).json({ message: "Delivery not found." });
        }

        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/deliveries/order/:order_id
exports.getDeliveryByOrderId = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({
            order_id: req.params.order_id,
        });

        if (!delivery) {
            return res.status(404).json({
                message: "Delivery record for this order not found.",
            });
        }

        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/deliveries/:delivery_id
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { status, estimated_delivery, courier_name, delivery_notes } = req.body;

        const delivery = await Delivery.findOne({
            delivery_id: req.params.delivery_id,
        });

        if (!delivery) {
            return res.status(404).json({ message: "Delivery not found." });
        }

        if (status) delivery.status = status;
        if (estimated_delivery) delivery.estimated_delivery = estimated_delivery;
        if (courier_name) delivery.courier_name = courier_name;
        if (delivery_notes !== undefined) delivery.delivery_notes = delivery_notes;

        await delivery.save();

        const order = await Order.findOne({ order_id: delivery.order_id });

        if (order) {
            if (delivery.status === "In Transit") {
                order.order_status = "In Transit";
            } else if (delivery.status === "Out for Delivery") {
                order.order_status = "In Transit";
            } else if (delivery.status === "Delivered") {
                order.order_status = "Delivered";
            } else if (delivery.status === "Failed Delivery") {
                order.order_status = "Cancelled";
            }

            await order.save();
        }

        res.status(200).json({
            message: "Delivery status updated successfully.",
            delivery,
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/deliveries/:delivery_id
exports.deleteDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOneAndDelete({
            delivery_id: req.params.delivery_id,
        });

        if (!delivery) {
            return res.status(404).json({ message: "Delivery not found." });
        }

        res.status(200).json({
            message: "Delivery record deleted successfully.",
            delivery,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};