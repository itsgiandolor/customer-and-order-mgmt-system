const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: [
    'https://customer-and-order-mgmt-system.vercel.app',
    'http://localhost:3000',
  ],
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Customer Order Management API is running");
});

app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/deliveries", require("./routes/deliveryRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;