const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const { Queue } = require("bullmq");

const Request = require("../models/Request.js");
const Product = require("../models/Product.js");
const { processQueue } = require("../services/worker.js");
const { validateCSV } = require("../utils/csvValidator");

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const imageQueue = new Queue("imageProcessingQueue");


router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const requestId = `req_${Date.now()}`;
    await Request.create({ _id: requestId, status: "processing" });

    const rows = [];
    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on("data", (row) => rows.push(row))
        .on("end", async () => {
            // 🚀 Validate CSV Data
            const { isValid, errors } = validateCSV(rows);
            if (!isValid) {
                fs.unlinkSync(req.file.path); // Delete the invalid CSV file
                console.log({ error: "Invalid CSV data", details: errors });
                await Request.findByIdAndUpdate(requestId, { status: "rejected", outputCSV: null });
                return res.status(400).json({ error: "Invalid CSV data", details: errors });
            }

            // 🚀 Process Valid Data
            const products = rows.map((row) => {
                const { "S. No.": serial, "Product Name": name} = row;
                const inputImages = row["Input Image Urls"].split(",").map(url => url.trim());

                return {
                    serialId: serial,
                    requestId,
                    productName: name,
                    inputImages,
                    outputImages: [],
                    status: "processing",
                };
            });

            const insertedProducts = await Product.insertMany(products);
            insertedProducts.forEach(product =>
                imageQueue.add("processImages", { productId: product._id, inputImages: product.inputImages, requestId: product.requestId })
            );

            fs.unlinkSync(req.file.path); // Delete CSV after successful processing
            res.json({ requestId });
        });
});

module.exports = router;