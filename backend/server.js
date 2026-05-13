const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");


dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    // Allow all Vercel deployments (your frontend)
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // Allow all Render deployments (your backend on Render + other subsystems)
    if (origin.endsWith('.onrender.com')) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));


app.use(express.json());

app.get("/", (req, res) => {
  res.send("Customer Order Management API is running");
});

app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const partnerBase =
    process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_CUSTOMER_API_URL;
  if (partnerBase) {
    const b = String(partnerBase).replace(/\/+$/, "");
    console.log(
      `[Integration] Delivery subsystem: set ORDER_MGMT_URL on Render to ${b}`
    );
  }
});

module.exports = app;