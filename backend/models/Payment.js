const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        payment_id: {
            type: String,
            required: true,
            unique: true,
        },

        order_id: {
            type: String,
            required: true,
        },

        payment_method: {
            type: String,
            required: true,
        },

        payment_amount: {
            type: Number,
            required: true,
            min: 0,
        },

        payment_status: {
            type: String,
            enum: ["Pending", "Confirmed", "Failed", "Refunded"],
            default: "Pending",
        },

        transaction_reference: {
            type: String,
            required: true,
        },

        payment_date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);