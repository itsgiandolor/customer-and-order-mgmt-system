const express = require("express");
const router = express.Router();

const {
    confirmPayment,
    getPayments,
    getPaymentById,
    getPaymentByOrderId,
    confirmCODPayment,
} = require("../controllers/paymentController");

router.post("/confirm", confirmPayment);
router.post("/cod-confirm/:order_id", confirmCODPayment);
router.get("/", getPayments);
router.get("/order/:order_id", getPaymentByOrderId);
router.get("/:payment_id", getPaymentById);

module.exports = router;