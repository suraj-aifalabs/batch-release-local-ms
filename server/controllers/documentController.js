const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const { generateSignedURL, uploadFileToS3, getFileFromS3, listFolderFiles } = require("../utils/awsS3Utils");
const catchAsyncError = require("../middlewares/catchAsyncError");
const { db } = require("../config/db");
const { sanitizeInput } = require("../utils/sanitizeRules");
const { postRequest } = require("../services/batchService");
// eslint-disable-next-line no-undef
const template = path.join(__dirname, "../assets/TV-FRM-58719.pdf");
// eslint-disable-next-line no-undef
const Tick_Image = path.join(__dirname, "../assets/Tick_Image.png");

exports.uploadFile = catchAsyncError(async (req, res) => {
    const file = req?.file;
    const byte = 1048576;
    const reqbody = sanitizeInput(req.method === "GET" ? req.query : req.body);
    const { batch_number, file_name } = reqbody;

    if (!file) {
        return res.status(400).json({
            success: false,
            message: "Please attach a file"
        });
    }

    const limit = file?.size / byte;

    if (limit > 50) {
        return res.status(400).json({
            success: false,
            message: "Supported file size is 50MB"
        });
    }
    const fileNameCodes = {
        "Final Product Bag Reconciliation Form": "FPD_FORM",
        "Final Cassette Label Reconciliation Form": "FCLR_FORM",
        "Critical Information from MES": "CI-MES",
        "Certificate of Analysis": "COA",
        "CAR-T Change Control List": "CCL",
        "QA Market Release Checklist": "Release_Checklist",
        "Lot Information Sheet": "LOT",
        "Shipping Authorisation": "SA"
    };

    const resObj = await generateSignedURL({ folder: batch_number, fileName: fileNameCodes[file_name?.trim()], orgFile: file });

    if (!resObj?.signedURL) {
        return res.status(500).json({
            success: false,
            message: "Error generating URL for S3 upload"
        });
    }
    const fileBuffer = await fs.promises.readFile(file.path);

    const responseData = await uploadFileToS3(resObj?.signedURL, fileBuffer);

    if (responseData.status !== 200) {
        return res.status(500).json({
            success: false,
            message: "Error Uploading File to S3"
        });
    }

    const fileObj = {
        file_name: resObj?.filename ?? file?.originalname,
        file_size: file?.size,
        file_type: file.mimetype,
        batch_number: "123",
        s3_location: "123",
        uploaded_by: "system",
    };

    await db.batch_documents.create(fileObj);

    // remove file once uploaded 
    const filePath = `${file.destination}/${file?.filename}`;
    await fs.promises.unlink(filePath);

    res.status(200).json({
        success: true,
        message: "Document uploaded successfully",
        file_name: fileObj?.file_name,
        file_type: fileObj?.file_type
    });
});

exports.getFile = catchAsyncError(async (req, res) => {
    const reqbody = sanitizeInput(req.method === "GET" ? req.query : req.body);

    const filename = reqbody?.file_name;
    if (!filename) {
        return res.status(400).json({
            success: false,
            message: "Please provide a file name (ex: example_image.png)"
        });
    }

    const resObj = await getFileFromS3(filename);
    if (!resObj) {
        return res.status(400).json({
            success: false,
            message: "Error generating URL for file"
        });
    }

    return res.status(200).json({
        success: true,
        message: "File retrieved successfully",
        url: resObj
    });
});

exports.getBatchCertificate = catchAsyncError(async (req, res) => {
    try {
        const username = req.user?.username ?? "system";
        const fullName = req.user?.name ?? "system";
        const email = req.user?.email ?? "";
        const exception = req.body?.exception ?? false;
        const sign = req.body?.sign ?? false;
        const batchNumber = req.body?.batchNumber ?? false;

        const existingPdfBytes = await fs.promises.readFile(template);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { height } = firstPage.getSize();
        const checkmarkBytes = await fs.promises.readFile(Tick_Image);
        const checkmarkImage = await pdfDoc.embedPng(checkmarkBytes);
        let text = "";

        const b_no = batchNumber && batchNumber !== "" ? batchNumber : "23HC3478";
        const realBatchInfo = await postRequest("/service/get_batch", { batch_number: b_no });
        const data = realBatchInfo?.data ?? {};

        data.patientName = "Mathew";
        data.patientDOB = "1972-10-14T06:13:05.105Z";
        data.cquenceDIN = "TY55YU765H";
        data.patientWeight = "86";
        data.cquenceDIN = "DIN7867";
        data.coicBagId = "COICY67";
        data.productNDC = "NDC4R5R";
        data.pccNumber = "PCC56IUY";
        data.marketAuthorizationNumber = "MAN777";

        const points = [
            { key: "patientName", x: 210, y: 187 },
            { key: "patientDOB", x: 210, y: 205 },
            { key: "cquenceDIN", x: 210, y: 222 },
            { key: "data_cart_order_id", x: 210, y: 239 },
            { key: "patientWeight", x: 210, y: 257 },
            { key: "batch_id", x: 95, y: 315 },
            { key: "coicBagId", x: 210, y: 315 },
            { key: "total_volume_in_ml", x: 345, y: 315 },
            { key: "product_dose_per_bag", x: 450, y: 315 },
            { key: "expiration_date", x: 210, y: 335 },
            { key: "productNDC", x: 210, y: 366 },
            { key: "pccNumber", x: 210, y: 382 },
            { key: "nameAndAddress", x: 210, y: 420 },
            { key: "marketAuthorizationNumber", x: 210, y: 435 },
            { key: "associated_country", x: 210, y: 452 },
            { key: "exception", x: 419, y: 647 },
            { key: "username", x: 260, y: 680 },
            { key: "email", x: 350, y: 685 },
            { key: "signedAt", x: 350, y: 695 },
            { key: "signedBy", x: 350, y: 675 }
        ];
        points.forEach(({ key, x, y }) => {
            if (key === "username" && sign) {
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
                if (exception === true) {

                    firstPage.drawImage(checkmarkImage, {
                        x,
                        y: height - y,
                        width: 10,
                        height: 10
                    });
                }
                else if (exception === false) {

                    firstPage.drawImage(checkmarkImage, {
                        x,
                        y: height - y + 14,
                        width: 10,
                        height: 10
                    });
                }
            }
            else if (key === "signedBy" && sign) {
                if (username) {
                    text = "Digitally signed by " + fullName.split(" [")[0] + " (WWID)";
                    firstPage.drawText(text, {
                        x,
                        y: height - y,
                        size: 8,
                        font,
                    });
                }
            }
            else if (key === "email" && sign) {
                if (email) {
                    text = email;
                    firstPage.drawText(text, {
                        x,
                        y: height - y,
                        size: 8,
                        font,
                    });
                }
            }
            else if (key === "signedAt" && sign) {
                if (username) {
                    const date = new Date();

                    const day = String(date.getDate()).padStart(2, "0");
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const month = monthNames[date.getMonth()];
                    const year = date.getFullYear();

                    const options = { timeZoneName: "short" };
                    const timeString = date.toLocaleTimeString("en-US", options); // e.g., "4:53:12 PM IST"
                    const [time, tzAbbrRaw] = timeString.split(" ");
                    const timeZoneAbbr = tzAbbrRaw.replace(/[^A-Z]/g, ""); // Clean abbreviation if needed

                    const text = `${day} ${month} ${year} ${time} (${timeZoneAbbr})`;

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
                            size: 8,
                            font,
                        });
                    }

                    else {
                        firstPage.drawText(text, {
                            x,
                            y: height - y,
                            size: 8,
                            font,
                        });
                    }
                }
            }
        });

        const pdfBytes = await pdfDoc.save();
        res.setHeader("Content-Type", "application/pdf");
        // eslint-disable-next-line no-undef
        res.send(Buffer.from(pdfBytes));
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

exports.getBatchDocuments = catchAsyncError(async (req, res) => {
    const reqbody = sanitizeInput(req.method === "GET" ? req.query : req.body);
    const { batch_number } = reqbody;
    const docs_data = await listFolderFiles({ folderPrefix: batch_number });
    res.status(200).json({
        message: "Batch documents",
        documents: docs_data ?? []
    });
});