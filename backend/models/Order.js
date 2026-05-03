const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        product_id: {
            type: String,
            required: true,
        },
        product_name: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        order_id: {
            type: String,
            required: true,
            unique: true,
        },

        customer_info: {
            name: {
                type: String,
                required: true,
            },
            email: {
                type: String,
                required: true,
            },
            contact_number: {
                type: String,
                required: true,
            },
            delivery_address: {
                type: String,
                required: true,
            },
        },

        order_source: {
            type: String,
            enum: ["web", "mobile_app", "pos"],
            default: "web",
        },

        items: {
            type: [orderItemSchema],
            required: true,
        },

        total_amount: {
            type: Number,
            required: true,
            min: 0,
        },

        payment_status: {
            type: String,
            enum: ["Pending", "Confirmed", "Failed", "Refunded"],
            default: "Pending",
        },

        order_status: {
            type: String,
            enum: [
                "Processing",
                "Confirmed",
                "Ready for Fulfillment",
                "In Transit",
                "Delivered",
                "Cancelled",
                "Rejected",
            ],
            default: "Processing",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);