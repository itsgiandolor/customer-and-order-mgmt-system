const express = require("express");
const router = express.Router();

const {
    getDeliveries,
    getDeliveryById,
    getDeliveryByOrderId,
    updateDeliveryStatus,
} = require("../controllers/deliveryController");

router.get('/', getDeliveries);
router.get('/order/:order_id', getDeliveryByOrderId);
router.get('/:delivery_id', getDeliveryById);
router.put('/:delivery_id/status', updateDeliveryStatus); // ← Delivery team calls this

module.exports = router;