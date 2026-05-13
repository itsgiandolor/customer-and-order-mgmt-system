const Product = require("../models/Product");

const isMongoConnected = () => {
    const mongoose = require("mongoose");
    return mongoose.connection.readyState === 1;
};

// Syncs inventory products into our catalog on every load
// If an inventory product doesn't exist in our DB, it auto-creates it
const syncInventoryProducts = async () => {
    if (!process.env.INVENTORY_API_URL) return [];

    try {
        const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory`);
        if (!invRes.ok) return [];
        const inventoryData = await invRes.json();

        if (!isMongoConnected()) return inventoryData;

        for (const invItem of inventoryData) {
            const exists = await Product.findOne({ product_id: invItem.product_id });
            if (!exists) {
                // Auto-create a catalog entry for new inventory products
                await Product.create({
                    product_id: invItem.product_id,
                    product_name: invItem.product_name,
                    description: "No description yet.",
                    price: 0,
                    category: "Uncategorized",
                    rating: 5.0,
                    reviews: "0",
                    image_url: "https://placehold.co/300x200",
                    is_active: true,
                });
                console.log(`[Sync] Auto-created product: ${invItem.product_id}`);
            }
        }

        return inventoryData;
    } catch (err) {
        console.warn("[Sync] Inventory sync failed:", err.message);
        return [];
    }
};

exports.getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;

        // 1. Sync inventory products into our DB (auto-adds missing ones)
        const inventoryData = await syncInventoryProducts();

        // 2. Get our product catalog
        let products = [];
        if (isMongoConnected()) {
            let query = { is_active: true };
            if (category) query.category = category;
            if (search) query.product_name = { $regex: search, $options: "i" };
            products = await Product.find(query).sort({ createdAt: -1 });
        }

        // 3. Merge stock data by product_id
        const merged = products.map(product => {
            const productObj = product.toObject ? product.toObject() : product;
            const invRecord = inventoryData.find(inv => inv.product_id === productObj.product_id);
            return {
                ...productObj,
                current_stock: invRecord?.current_stock ?? null,
                stock_status: invRecord?.status ?? "UNKNOWN",
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

        if (isMongoConnected()) {
            product = await Product.findOne({ product_id: req.params.id });
        }

        if (!product) return res.status(404).json({ message: "Product not found." });

        let inventoryData = { current_stock: null, stock_status: "UNKNOWN" };
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
                console.warn("[Inventory API unavailable]", err.message);
            }
        }

        const productObj = product.toObject ? product.toObject() : product;
        res.status(200).json({ ...productObj, ...inventoryData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const product_name = req.body.product_name || req.body.name;
        const { description, price, category, rating, reviews, image_url } = req.body;
        const initial_stock = req.body.initial_stock || req.body.stock || 50;

        if (!product_name || !price || !category) {
            return res.status(400).json({ message: "Product name, price, and category are required." });
        }

        const product = await Product.create({
            product_id: "P" + String(Date.now()).slice(-6),
            product_name,
            description: description || "",
            price,
            category,
            rating: rating || 5.0,
            reviews: reviews || "0",
            image_url: image_url || "https://placehold.co/300x200",
        });

        // Sync to Inventory API
        if (process.env.INVENTORY_API_URL) {
            try {
                const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        product_id: product.product_id,
                        product_name: product.product_name,  // ← added this
                        current_stock: initial_stock,
                    }),
                });

                if (invRes.ok) {
                    console.log(`[Inventory] Successfully registered ${product.product_id} - ${product.product_name}`);
                } else {
                    const err = await invRes.json();
                    console.warn(`[Inventory] Registration failed for ${product.product_id}:`, err.message);
                }
            } catch (err) {
                console.warn(`[Inventory] Failed to reach inventory API for ${product.product_id}:`, err.message);
            }
        }

        res.status(201).json({ message: "Product created successfully.", product });
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

        if (!product) return res.status(404).json({ message: "Product not found." });

        res.status(200).json({ message: "Product updated successfully.", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ product_id: req.params.id });
        if (!product) return res.status(404).json({ message: "Product not found." });
        res.status(200).json({ message: "Product deleted successfully." });
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

        if (process.env.INVENTORY_API_URL) {
            try {
                await fetch(`${process.env.INVENTORY_API_URL}/api/inventory/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ product_id: product.product_id, current_stock: 0 }),
                });
            } catch (err) {
                console.warn(`[Inventory] Failed to deactivate ${product.product_id}:`, err.message);
            }
        }

        res.status(200).json({ message: "Product deactivated.", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Seed: Uses the Inventory team's actual product IDs + adds catalog details
exports.seedProducts = async (req, res) => {
    try {
        if (!process.env.INVENTORY_API_URL) {
            return res.status(503).json({ message: "INVENTORY_API_URL is not set." });
        }

        // Pull the live product list directly from the Inventory API
        let inventoryProducts = [];
        try {
            const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory`);
            if (!invRes.ok) throw new Error("Inventory API returned an error.");
            inventoryProducts = await invRes.json();
        } catch (err) {
            return res.status(503).json({ message: "Could not reach Inventory API: " + err.message });
        }

        if (!inventoryProducts.length) {
            return res.status(200).json({ message: "Inventory API returned no products. Nothing to seed." });
        }

        if (!isMongoConnected()) {
            return res.status(503).json({ message: "MongoDB is not connected." });
        }

        const results = { upserted: [], skipped: [] };

        for (const invItem of inventoryProducts) {
            // Only upsert if product_id doesn't already exist
            // This preserves all manually added products and their custom details
            const existing = await Product.findOne({ product_id: invItem.product_id });

            if (!existing) {
                await Product.create({
                    product_id: invItem.product_id,
                    product_name: invItem.product_name,
                    description: "No description yet.",
                    price: 0,
                    category: "Uncategorized",
                    rating: 5.0,
                    reviews: "0",
                    image_url: "https://placehold.co/300x200",
                    is_active: true,
                });
                results.upserted.push(invItem.product_id);
            } else {
                results.skipped.push(invItem.product_id); // already exists, don't touch it
            }
        }

        return res.status(200).json({
            message: "Seed complete. Existing products were not overwritten.",
            added: results.upserted.length,
            skipped_already_exist: results.skipped.length,
            added_ids: results.upserted,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkInventorySync = async (req, res) => {
    try {
        const products = await Product.find({ is_active: true }).select("product_id product_name");

        let inventory = [];
        try {
            const invRes = await fetch(`${process.env.INVENTORY_API_URL}/api/inventory`);
            if (invRes.ok) inventory = await invRes.json();
        } catch (err) {
            return res.status(503).json({ message: "Inventory API is unavailable." });
        }

        const synced = [];
        const missing = [];

        for (const product of products) {
            const found = inventory.find(i => i.product_id === product.product_id);
            if (found) {
                synced.push({ product_id: product.product_id, product_name: product.product_name, current_stock: found.current_stock, status: found.status });
            } else {
                missing.push({ product_id: product.product_id, product_name: product.product_name });
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