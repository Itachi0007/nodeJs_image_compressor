require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const uploadRoutes = require("./api/upload.js");
const statusRoutes = require("./api/status.js");
const { processQueue } = require("./services/worker");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("📦 Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

app.use("/api/upload", uploadRoutes);
app.use("/api/status", statusRoutes);

processQueue(); // Start the worker

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));