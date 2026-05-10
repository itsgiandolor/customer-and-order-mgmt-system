const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        product_id: {
            type: String,
            required: true,
            unique: true,
        },
        product_name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            default: 5.0,
            min: 0,
            max: 5,
        },
        reviews: {
            type: String,
            default: "0",
        },
        image_url: {
            type: String,
            default: "https://placehold.co/300x200",
        },
        is_active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
