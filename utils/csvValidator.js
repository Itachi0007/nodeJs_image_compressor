const validUrl = require("valid-url");

/**
 * Validate CSV data row-by-row.
 * @param {Array} rows - Parsed CSV rows
 * @returns {Object} { isValid: Boolean, errors: Array }
 */
function validateCSV(rows) {
    const errors = [];
    const seenSerialNumbers = new Set();

    rows.forEach((row, index) => {
        const serial = row["S. No."];
        const productName = row["Product Name"];
        const inputImages = row["Input Image Urls"] ? row["Input Image Urls"].split(",").map(url => url.trim()) : [];

        // Validate Serial Number
        if (!serial || isNaN(serial)) {
            errors.push(`Row ${index + 1}: Invalid 'S. No.' (must be a number).`);
        } else if (seenSerialNumbers.has(serial)) {
            errors.push(`Row ${index + 1}: Duplicate 'S. No.' found (${serial}).`);
        } else {
            seenSerialNumbers.add(serial);
        }

        // Validate Product Name
        if (!productName || productName.trim().length === 0) {
            errors.push(`Row ${index + 1}: 'Product Name' cannot be empty.`);
        }

        // Validate Input Image URLs
        if (inputImages.length === 0) {
            errors.push(`Row ${index + 1}: No 'Input Image Urls' provided.`);
        } else {
            inputImages.forEach((url, i) => {
                if (!validUrl.isUri(url)) {
                    errors.push(`Row ${index + 1}: Invalid URL at position ${i + 1} (${url}).`);
                }
            });
        }
    });

    return { isValid: errors.length === 0, errors };
}

module.exports = { validateCSV };