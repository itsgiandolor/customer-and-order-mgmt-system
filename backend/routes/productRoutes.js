const express = require("express");
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deactivateProduct,
    seedProducts,
    checkInventorySync,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/sync-check", checkInventorySync);
router.get("/seed", seedProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.put("/:product_id/deactivate", deactivateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
