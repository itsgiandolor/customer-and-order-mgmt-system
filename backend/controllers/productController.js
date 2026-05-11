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
        if (process.env.INVENTORY_API_URL) {
            try {
                const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory`);
                if (invRes.ok) inventoryData = await invRes.json();
            } catch (err) {
                console.warn('[Inventory API unavailable] Showing products without stock info');
                // Don't crash — show products anyway, just without stock badges
            }
        } else {
            console.warn('[INVENTORY_API_URL not set] Showing products without stock info');
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
        if (process.env.INVENTORY_API_URL) {
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
        } else {
            console.warn('[INVENTORY_API_URL not set]');
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
        // Accept both 'name' and 'product_name', 'stock' and 'initial_stock'
        const product_name = req.body.product_name || req.body.name;
        const { description, price, category, rating, reviews, image_url } = req.body;
        const initial_stock = req.body.initial_stock || req.body.stock;

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

        // Register in Inventory with default stock
        if (process.env.INVENTORY_API_URL) {
            try {
                await fetch(`${process.env.INVENTORY_API_URL}/api/inventory/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        product_id: product.product_id,
                        current_stock: initial_stock || 50,
                    }),
                });
                console.log(`[Inventory] Registered ${product.product_id}`);
            } catch (err) {
                console.warn(`[Inventory] Failed to register ${product.product_id}:`, err.message);
                // Don't fail the product creation — just log it
            }
        } else {
            console.log(`[Inventory] Skipped — INVENTORY_API_URL not set`);
        }

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

exports.deactivateProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { product_id: req.params.product_id },
            { is_active: false },
            { new: true }
        );

        if (!product) return res.status(404).json({ message: "Product not found." });

        // Set stock to 0 in Inventory so it doesn't appear available
        try {
            await fetch(`${process.env.INVENTORY_API_URL}/api/inventory/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_id: product.product_id,
                    current_stock: 0,
                }),
            });
            console.log(`[Inventory] Deactivated ${product.product_id}`);
        } catch (err) {
            console.warn(`[Inventory] Failed to deactivate ${product.product_id}:`, err.message);
        }

        res.status(200).json({ message: "Product deactivated.", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.seedProducts = async (req, res) => {
    try {
        const products = [
            { product_id: "P001", product_name: "HAVIT HV-G92 Gamepad", description: "Gaming controller with high precision", price: 200, category: "Electronics", rating: 5.0, reviews: "1.5k" },
            { product_id: "P002", product_name: "Demonia High Boots", description: "Gothic platform boots", price: 6500, category: "Clothing & Apparel", rating: 5.0, reviews: "1.5k" },
            { product_id: "P003", product_name: "Graduation Gown", description: "Academic regalia for ceremonies", price: 1500, category: "Clothing & Apparel", rating: 5.0, reviews: "1.5k" },
            { product_id: "P004", product_name: "Ergonomic Chair", description: "Office chair with lumbar support", price: 4500, category: "Home & Living", rating: 4.8, reviews: "800" },
            { product_id: "P005", product_name: "Wireless Mouse", description: "Bluetooth ergonomic mouse", price: 850, category: "Electronics", rating: 4.5, reviews: "2.1k" },
            { product_id: "P006", product_name: "Coffee Table", description: "Modern minimalist design", price: 3200, category: "Home & Living", rating: 4.7, reviews: "450" },
        ];

        // 1. Upsert into your own DB (if MongoDB is connected)
        if (isMongoConnected()) {
            for (const product of products) {
                await Product.findOneAndUpdate(
                    { product_id: product.product_id },
                    { ...product, image_url: "https://placehold.co/300x200", is_active: true },
                    { upsert: true, new: true }
                );
            }
        }

        // 2. Always update memoryProducts as fallback
        memoryProducts = products.map(p => ({ ...p, image_url: "https://placehold.co/300x200", is_active: true }));

        // 3. Register each product in the Inventory system
        const inventoryResults = { success: [], failed: [] };

        for (const product of products) {
            try {
                const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        product_id: product.product_id,
                        current_stock: 50, // default starting stock
                    }),
                });

                if (invRes.ok) {
                    inventoryResults.success.push(product.product_id);
                } else {
                    inventoryResults.failed.push(product.product_id);
                }
            } catch (err) {
                inventoryResults.failed.push(product.product_id);
                console.warn(`[Inventory] Failed to sync ${product.product_id}:`, err.message);
            }
        }

        return res.status(200).json({
            message: "Products seeded successfully.",
            products_count: products.length,
            inventory_sync: inventoryResults,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkInventorySync = async (req, res) => {
    try {
        // Your products
        const products = await Product.find({ is_active: true }).select("product_id product_name");

        // Their inventory
        let inventory = [];
        try {
            const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory`);
            if (invRes.ok) {
                inventory = await invRes.json();
            }
        } catch (err) {
            console.warn('[Inventory API unavailable for sync check]', err.message);
            return res.status(503).json({
                message: 'Inventory API is unavailable. Cannot perform sync check.',
            });
        }

        // Compare
        const synced = [];
        const missing = []; // in your DB but not in Inventory

        for (const product of products) {
            const found = inventory.find(i => i.product_id === product.product_id);
            if (found) {
                synced.push({
                    product_id: product.product_id,
                    product_name: product.product_name,
                    current_stock: found.current_stock,
                    status: found.status,
                });
            } else {
                missing.push({
                    product_id: product.product_id,
                    product_name: product.product_name,
                });
            }
        }

        res.status(200).json({
            total_your_products: products.length,
            total_inventory_records: inventory.length,
            synced_count: synced.length,
            missing_from_inventory: missing,
            synced,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
