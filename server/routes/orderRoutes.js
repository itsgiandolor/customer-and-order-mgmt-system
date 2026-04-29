const express = require("express");
const router = express.Router();

const {
    createOrder,
    getOrders,
    getOrderById,
    trackOrder,
    updateOrderStatus,
    cancelOrder,
} = require("../controllers/orderController");

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/track", trackOrder);
router.get("/:order_id", getOrderById);
router.put("/:order_id/status", updateOrderStatus);
router.delete("/:order_id", cancelOrder);

module.exports = router;