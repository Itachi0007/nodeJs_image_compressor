const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Unique request ID
    status: { type: String, enum: ["pending", "processing", "completed"], default: "pending" },
    outputCSV: { type: String, default: null }, // Link to output CSV (optional)
}, { timestamps: true });

module.exports = mongoose.model("Request", RequestSchema);