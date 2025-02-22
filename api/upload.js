const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const { Queue } = require("bullmq");
const Request = require("../models/Request.js");
const Product = require("../models/Product.js");
const { processQueue } = require("../services/worker.js");

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const imageQueue = new Queue("imageProcessingQueue");

router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const requestId = `req_${Date.now()}`;
    await Request.create({ _id: requestId, status: "processing" });

    const products = [];

    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on("data", (row) => {
            console.log(row);
            
            const { "S. No.": serial, "Product Name": name, "Input Image Uris": urls } = row;
            const inputImages = urls.split(",").map(url => url.trim());

            const product = new Product({
                serialId: serial,
                requestId,
                productName: name,
                inputImages,
                outputImages: [],
                status: "processing",
            });

            products.push(product);
            imageQueue.add("processImages", { productId: product._id, inputImages, requestId })
                      .then(() => console.log(`✅ Job added to queue for product: ${name}`))
                      .catch((err) => console.error(`❌ Failed to add job: ${err.message}`));
        })
        .on("end", async () => {
            await Product.insertMany(products);
            fs.unlinkSync(req.file.path); // Delete CSV after processing
        });

    res.json({ requestId });
});

module.exports = router;