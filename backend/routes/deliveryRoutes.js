const express = require("express");
const router = express.Router();

const {
    createDelivery,
    getDeliveries,
    getDeliveryById,
    getDeliveryByOrderId,
    updateDeliveryStatus,
    deleteDelivery,
} = require("../controllers/deliveryController");

router.post("/", createDelivery);
router.get("/", getDeliveries);
router.get("/order/:order_id", getDeliveryByOrderId);
router.get("/:delivery_id", getDeliveryById);
router.put("/:delivery_id", updateDeliveryStatus);
router.delete("/:delivery_id", deleteDelivery);

module.exports = router;