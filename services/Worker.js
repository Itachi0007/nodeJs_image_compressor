const { Worker } = require("bullmq");
const sharp = require("sharp");
const IORedis = require("ioredis");
const fs = require("fs");
const path = require("path");
const { parse } = require("json2csv");

const Product = require("../models/Product");
const Request = require("../models/Request");

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const processQueue = () => {
    console.log("🔄 Image processing worker started!");

    const redisConnection = new IORedis({
        host: "localhost",
        port: 6379,
        maxRetriesPerRequest: null,
    });

    const worker = new Worker(
        "imageProcessingQueue",
        async (job) => {
            console.log(`🛠 Processing job ${job.id} with data:`, job.data);
            const { productId, inputImages, requestId } = job.data;
            const outputImages = [];

            for (let url of inputImages) {
                const fileName = `compressed_${Date.now()}.jpg`;
                const outputPath = path.join(__dirname, "../output/images/", fileName);

                const imageBuffer = await fetch(url)
                    .then((res) => res.arrayBuffer())
                    .then((buffer) => Buffer.from(buffer));

                await sharp(imageBuffer).jpeg({ quality: 50 }).toFile(outputPath);

                outputImages.push(`${__dirname}/output/images/${fileName}`);
            }

            await Product.findByIdAndUpdate(productId, { outputImages, status: "completed" });
        },
        { connection: redisConnection }
    );

    worker
        .on("completed", async (job) => {
            console.log(`✅ Processing job ${job.id} completed!`);
            const requestId = job.data.requestId;
            const products = await Product.find({ requestId });

            if (products.every((p) => p.status === "completed")) {
                console.log(`📄 Generating CSV for request: ${requestId}`);

                const csvData = products.map((p) => ({
                    "S. No.": p._id,
                    "Product Name": p.productName,
                    "Input Image Urls": p.inputImages.join(", "),
                    "Output Image Urls": p.outputImages.join(", "),
                }));

                const csv = parse(csvData);
                const outputPath = path.join(__dirname, `../output/csv/${requestId}.csv`);

                fs.writeFileSync(outputPath, csv);

                console.log(`✅ CSV saved: ${outputPath}`);

                await Request.findByIdAndUpdate(requestId, { status: "completed", outputCSV: outputPath });
            }
        })
        .on("failed", async (job, err) => {
            console.error(`💥 Job ${job.id} failed: ${err.message}`);
        });
};

module.exports = { processQueue };