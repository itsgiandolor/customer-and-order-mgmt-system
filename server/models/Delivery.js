const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
    {
        delivery_id: {
            type: String,
            required: true,
            unique: true,
        },

        order_id: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["Pending", "In Transit", "Out for Delivery", "Delivered", "Failed Delivery"],
            default: "Pending",
        },

        estimated_delivery: {
            type: Date,
            required: true,
        },

        courier_name: {
            type: String,
            required: true,
        },

        delivery_notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Delivery", deliverySchema);