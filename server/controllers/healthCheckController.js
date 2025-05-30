/* eslint-disable no-undef */
const catchAsyncError = require("../middlewares/catchAsyncError");
const pkg = require("pdf-to-printer");
const fs = require("fs");
const path = require("path");
const template = path.join(__dirname, "../../assets/TV-FRM-58719.pdf");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const Tick_Image = path.join(__dirname, "../../assets/Tick_Image.png");

exports.healthCheck = catchAsyncError(async (req, res) => {
    const estDate = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour12: true,
    });
    res.status(200).json({
        message: "Service is healthy",
        time: estDate,
        timezone: "EST (America/New_York)",
        uptime: (process?.uptime() ?? 0) + " sec",
    });
});


exports.readyCheck = catchAsyncError(async (req, res) => {
    const estDate = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour12: true,
    });
    const env = process.env.NODE_ENV ?? "";
    res.status(200).json({
        message: "Application is ready",
        time: estDate,
        timezone: "EST (America/New_York)",
        environment: env,
    });
});

exports.serverCheck = catchAsyncError(async (req, res) => {
    const estDate = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour12: true,
    });
    const env = process.env.NODE_ENV ?? "";
    const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "";
    res.status(200).json({
        message: "Application is running",
        time: estDate,
        timezone: "EST (America/New_York)",
        environment: env,
        allowedOrigin
    });
});

exports.getPDF = catchAsyncError(async (req, res) => {
    try {
        const { username, email, exception } = req.body;
        const existingPdfBytes = await fs.promises.readFile(template);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { height } = firstPage.getSize();
        const checkmarkBytes = await fs.promises.readFile(Tick_Image);
        const checkmarkImage = await pdfDoc.embedPng(checkmarkBytes);
        const data = {
            "_id": "670cb671eb96e6534cd889da",
            "stage": "ATLAS",
            "status": "Ready for Sign",
            "cequenceId_Hashed": "2119fdc4d0c0444318bfc5a7e8e2ac7c:351e4e7960f9a3a377a0e28e9ae103e5a4aa47f73cb2f7c1ff4f790409444edd9a7fab1b23a029faf789b11f115fa3ea",
            "patientName": "Sanjay",
            "patientDOB": "2024-10-14T06:13:05.105Z",
            "patientWeight": "78",
            "cquenceDIN": "DIN00777",
            "cquenceOrderId": "ORD15",
            "country": "IN",
            "coicBagId": "COIC883",
            "batchNumber": "B114AF",
            "createdAt": "2024-10-14T06:13:05.105Z",
            "updatedAt": "2024-10-14T06:14:55.512Z",
            "__v": 0,
            "pccNumber": "PCC8787",
            "totalVolume": "100",
            "productDose": "10mg",
            "marketAuthorizationNumber": "123564",
            "nameAndAddress": "David Laid Seattle WA 90878",
            "productNDC": "123",
            "expirationDate": "2024-10-14T06:13:05.105Z"
        };

        const points = [
            { key: "patientName", x: 210, y: 187 },
            { key: "patientDOB", x: 210, y: 205 },
            { key: "cquenceDIN", x: 210, y: 220 },
            { key: "cquenceOrderId", x: 210, y: 237 },
            { key: "patientWeight", x: 210, y: 255 },
            { key: "batchNumber", x: 100, y: 315 },
            { key: "coicBagId", x: 215, y: 315 },
            { key: "totalVolume", x: 350, y: 315 },
            { key: "productDose", x: 450, y: 315 },
            { key: "expirationDate", x: 210, y: 335 },
            { key: "productNDC", x: 210, y: 365 },
            { key: "pccNumber", x: 210, y: 380 },
            { key: "nameAndAddress", x: 210, y: 420 },
            { key: "marketAuthorizationNumber", x: 210, y: 435 },
            { key: "country", x: 210, y: 450 },
            { key: "exception", x: 419, y: 647 },
            { key: "username", x: 260, y: 680 },
            { key: "signedAt", x: 350, y: 690 },
            { key: "signedBy", x: 350, y: 680 }
        ];
        points.forEach(({ key, x, y }) => {
            if (key === "username") {
                if (username) {
                    firstPage.drawText(username, {
                        x,
                        y: height - y,
                        size: 12,
                        font,
                    });
                }
            }
            else if (key === "exception") {
                if (exception === "true") {

                    firstPage.drawImage(checkmarkImage, {
                        x,
                        y: height - y,
                        width: 10,
                        height: 10
                    });
                }
                else if (exception === "false") {

                    firstPage.drawImage(checkmarkImage, {
                        x,
                        y: height - y + 14,
                        width: 10,
                        height: 10
                    });
                }
            }
            else if (key === "signedBy") {
                if (username) {
                    text = "Digitally signed by " + username;
                    firstPage.drawText(text, {
                        x,
                        y: height - y,
                        size: 8,
                        font,
                    });
                }
            }
            else if (key === "signedAt") {
                if (username) {
                    const date = new Date();

                    const day = String(date.getDate()).padStart(2, "0");
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const month = monthNames[date.getMonth()];
                    const year = date.getFullYear();

                    const options = { timeZoneName: "short" };
                    const timeString = date.toLocaleTimeString("en-US", options);
                    const timeZoneAbbr = timeString.split(" ").pop().replace(/[^A-Z]/g, "");

                    const text = `${day} ${month} ${year} (${timeZoneAbbr})`;

                    firstPage.drawText(text, {
                        x,
                        y: height - y,
                        size: 8,
                        font,
                    });
                }
            }

            else {
                const value = data[key];
                if (value) {
                    let text = value;

                    if (key === "expirationDate" || key === "patientDOB") {
                        const date = new Date(value);
                        const day = String(date.getDate()).padStart(2, "0");
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const year = date.getFullYear();
                        text = `${day}/${month}/${year}`;
                        firstPage.drawText(text, {
                            x,
                            y: height - y,
                            size: 7,
                            font,
                        });
                    }

                    else {
                        firstPage.drawText(text, {
                            x,
                            y: height - y,
                            size: 7,
                            font,
                        });
                    }
                }
            }
        });

        const pdfBytes = await pdfDoc.save();
        res.setHeader("Content-Type", "application/pdf");
        res.send(Buffer.from(pdfBytes));
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});