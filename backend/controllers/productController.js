const Product = require("../models/Product");

// In-memory fallback when MongoDB is not available
let memoryProducts = [
    { product_id: "P001", product_name: "HAVIT HV-G92 Gamepad", description: "Gaming controller with high precision", price: 200, category: "Electronics", rating: 5.0, reviews: "1.5k", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P002", product_name: "Demonia High Boots", description: "Gothic platform boots", price: 6500, category: "Clothing & Apparel", rating: 5.0, reviews: "1.5k", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P003", product_name: "Graduation Gown", description: "Academic regalia for ceremonies", price: 1500, category: "Clothing & Apparel", rating: 5.0, reviews: "1.5k", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P004", product_name: "Ergonomic Chair", description: "Office chair with lumbar support", price: 4500, category: "Home & Living", rating: 4.8, reviews: "800", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P005", product_name: "Wireless Mouse", description: "Bluetooth ergonomic mouse", price: 850, category: "Electronics", rating: 4.5, reviews: "2.1k", image_url: "https://placehold.co/300x200", is_active: true },
    { product_id: "P006", product_name: "Coffee Table", description: "Modern minimalist design", price: 3200, category: "Home & Living", rating: 4.7, reviews: "450", image_url: "https://placehold.co/300x200", is_active: true },
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

        // 1. Get your own product catalog
        let products = [];
        if (!isMongoConnected()) {
            products = memoryProducts.filter(p => p.is_active);
            if (category) products = products.filter(p => p.category === category);
            if (search) products = products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()));
        } else {
            let query = { is_active: true };
            if (category) query.category = category;
            if (search) query.product_name = { $regex: search, $options: "i" };
            products = await Product.find(query).sort({ createdAt: -1 });
        }

        // 2. Get stock levels from Inventory API
        let inventoryData = [];
        try {
            const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory`);
            if (invRes.ok) inventoryData = await invRes.json();
        } catch (err) {
            console.warn('[Inventory API unavailable] Showing products without stock info');
            // Don't crash — show products anyway, just without stock badges
        }

        // 3. Merge by product_id
        const merged = products.map(product => {
            const productObj = product.toObject ? product.toObject() : product;
            const invRecord = inventoryData.find(inv => inv.product_id === productObj.product_id);
            return {
                ...productObj,
                current_stock: invRecord?.current_stock ?? null,
                stock_status: invRecord?.status ?? 'UNKNOWN',
                // null means Inventory API was unreachable — handle in frontend
            };
        });

        res.status(200).json(merged);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        let product = null;

        if (!isMongoConnected()) {
            product = memoryProducts.find(p => p.product_id === req.params.id);
            if (!product) return res.status(404).json({ message: "Product not found." });
        } else {
            product = await Product.findOne({ product_id: req.params.id });
            if (!product) return res.status(404).json({ message: "Product not found." });
        }

        // Get stock data from Inventory API
        let inventoryData = {};
        try {
            const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory`);
            if (invRes.ok) {
                const allInventory = await invRes.json();
                const invRecord = allInventory.find(inv => inv.product_id === product.product_id);
                if (invRecord) {
                    inventoryData = {
                        current_stock: invRecord.current_stock,
                        stock_status: invRecord.status,
                    };
                }
            }
        } catch (err) {
            console.warn('[Inventory API unavailable]', err.message);
        }

        const productObj = product.toObject ? product.toObject() : product;
        const result = {
            ...productObj,
            current_stock: inventoryData.current_stock ?? null,
            stock_status: inventoryData.stock_status ?? 'UNKNOWN',
        };

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { product_name, description, price, category, rating, reviews, image_url } = req.body;

        if (!product_name || !price || !category) {
            return res.status(400).json({ message: "Product name, price, and category are required." });
        }

        const product = await Product.create({
            product_id: generateProductId(),
            product_name,
            description,
            price,
            category,
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
        const { product_name, description, price, category, rating, reviews, image_url, is_active } = req.body;

        const product = await Product.findOneAndUpdate(
            { product_id: req.params.id },
            { product_name, description, price, category, rating, reviews, image_url, is_active },
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
            { product_id: "P001", product_name: "HAVIT HV-G92 Gamepad", description: "Gaming controller with high precision", price: 200, category: "Electronics", rating: 5.0, reviews: "1.5k" },
            { product_id: "P002", product_name: "Demonia High Boots", description: "Gothic platform boots", price: 6500, category: "Clothing & Apparel", rating: 5.0, reviews: "1.5k" },
            { product_id: "P003", product_name: "Graduation Gown", description: "Academic regalia for ceremonies", price: 1500, category: "Clothing & Apparel", rating: 5.0, reviews: "1.5k" },
            { product_id: "P004", product_name: "Ergonomic Chair", description: "Office chair with lumbar support", price: 4500, category: "Home & Living", rating: 4.8, reviews: "800" },
            { product_id: "P005", product_name: "Wireless Mouse", description: "Bluetooth ergonomic mouse", price: 850, category: "Electronics", rating: 4.5, reviews: "2.1k" },
            { product_id: "P006", product_name: "Coffee Table", description: "Modern minimalist design", price: 3200, category: "Home & Living", rating: 4.7, reviews: "450" },
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
