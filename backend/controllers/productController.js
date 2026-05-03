const Product = require("../models/Product");

// In-memory fallback when MongoDB is not available
let memoryProducts = [
    { product_id: "P001", product_name: "HAVIT HV-G92 Gamepad", description: "Gaming controller with high precision", price: 200, category: "Electronics", stock: 50, rating: 5.0, reviews: "1.5k", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P002", product_name: "Demonia High Boots", description: "Gothic platform boots", price: 6500, category: "Clothing & Apparel", stock: 30, rating: 5.0, reviews: "1.5k", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P003", product_name: "Graduation Gown", description: "Academic regalia for ceremonies", price: 1500, category: "Clothing & Apparel", stock: 100, rating: 5.0, reviews: "1.5k", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P004", product_name: "Ergonomic Chair", description: "Office chair with lumbar support", price: 4500, category: "Home & Living", stock: 25, rating: 4.8, reviews: "800", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P005", product_name: "Wireless Mouse", description: "Bluetooth ergonomic mouse", price: 850, category: "Electronics", stock: 75, rating: 4.5, reviews: "2.1k", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P006", product_name: "Coffee Table", description: "Modern minimalist design", price: 3200, category: "Home & Living", stock: 15, rating: 4.7, reviews: "450", image_url: "https://placehold.co/300x200", is_active: true },
];

const isMongoConnected = () => {
    const mongoose = require("mongoose");
    return mongoose.connection.readyState === 1;
};

const generateProductId = () => {
    return "P" + String(Date.now()).slice(-6);
};

exports.getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;
        
        if (!isMongoConnected()) {
            let products = memoryProducts.filter(p => p.is_active);
            if (category) products = products.filter(p => p.category === category);
            if (search) products = products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()));
            return res.status(200).json(products);
        }
        
        let query = { is_active: true };
        if (category) query.category = category;
        if (search) query.product_name = { $regex: search, $options: "i" };
        
        const products = await Product.find(query).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        if (!isMongoConnected()) {
            const product = memoryProducts.find(p => p.product_id === req.params.id);
            if (!product) return res.status(404).json({ message: "Product not found." });
            return res.status(200).json(product);
        }
        
        const product = await Product.findOne({ product_id: req.params.id });
        if (!product) return res.status(404).json({ message: "Product not found." });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { product_name, description, price, category, stock, rating, reviews, image_url } = req.body;
        
        if (!product_name || !price || !category) {
            return res.status(400).json({ message: "Product name, price, and category are required." });
        }
        
        const product = await Product.create({
            product_id: generateProductId(),
            product_name,
            description,
            price,
            category,
            stock: stock || 100,
            rating: rating || 5.0,
            reviews: reviews || "0",
            image_url: image_url || "https://placehold.co/300x200",
        });
        
        res.status(201).json({
            message: "Product created successfully.",
            product,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { product_name, description, price, category, stock, rating, reviews, image_url, is_active } = req.body;
        
        const product = await Product.findOneAndUpdate(
            { product_id: req.params.id },
            { product_name, description, price, category, stock, rating, reviews, image_url, is_active },
            { new: true }
        );
        
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        
        res.status(200).json({
            message: "Product updated successfully.",
            product,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ product_id: req.params.id });
        
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        
        res.status(200).json({
            message: "Product deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.seedProducts = async (req, res) => {
    try {
        const sampleProducts = [
            { product_id: "P001", product_name: "HAVIT HV-G92 Gamepad", description: "Gaming controller with high precision", price: 200, category: "Electronics", stock: 50, rating: 5.0, reviews: "1.5k" },
            { product_id: "P002", product_name: "Demonia High Boots", description: "Gothic platform boots", price: 6500, category: "Clothing & Apparel", stock: 30, rating: 5.0, reviews: "1.5k" },
            { product_id: "P003", product_name: "Graduation Gown", description: "Academic regalia for ceremonies", price: 1500, category: "Clothing & Apparel", stock: 100, rating: 5.0, reviews: "1.5k" },
            { product_id: "P004", product_name: "Ergonomic Chair", description: "Office chair with lumbar support", price: 4500, category: "Home & Living", stock: 25, rating: 4.8, reviews: "800" },
            { product_id: "P005", product_name: "Wireless Mouse", description: "Bluetooth ergonomic mouse", price: 850, category: "Electronics", stock: 75, rating: 4.5, reviews: "2.1k" },
            { product_id: "P006", product_name: "Coffee Table", description: "Modern minimalist design", price: 3200, category: "Home & Living", stock: 15, rating: 4.7, reviews: "450" },
        ];
        
        if (!isMongoConnected()) {
            memoryProducts = sampleProducts.map(p => ({ ...p, image_url: "https://placehold.co/300x200", is_active: true }));
            return res.status(200).json({
                message: "Sample products loaded to memory (MongoDB not connected).",
                count: sampleProducts.length,
            });
        }
        
        await Product.deleteMany({});
        await Product.insertMany(sampleProducts);
        
        res.status(200).json({
            message: "Sample products seeded successfully.",
            count: sampleProducts.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
