const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    serialId: { type: Number, required: true },
    requestId: { type: String, required: true },  // Links to Request model
    productName: { type: String, required: true },
    inputImages: { type: [String], required: true },
    outputImages: { type: [String], default: [] }, // Processed images stored here
    status: { type: String, enum: ["pending", "processing", "completed"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);