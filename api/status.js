const express = require("express");
const Request = require("../models/Request");
const router = express.Router();

router.get("/:requestId", async (req, res) => {
    const request = await Request.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    res.json({
        status: request.status,
        outputCSV: request.outputCSV || "Processing...",
    });
});

module.exports = router;