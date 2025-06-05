/* eslint-disable no-undef */
const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");

const { fileUploadMiddleware } = require("../../server/middlewares/fileUploadMiddleware");

const app = express();

// Create a temporary route for testing
app.post("/upload", fileUploadMiddleware, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.status(200).json({ success: true, filename: req.file.filename });
});

describe("Multer file upload middleware", () => {
    const testFilePath = path.join(__dirname, "dummy.pdf");

    // Create a dummy file before tests
    beforeAll(() => {
        fs.writeFileSync(testFilePath, "Dummy PDF content");
        if (!fs.existsSync("./uploads")) {
            fs.mkdirSync("./uploads");
        }
    });

    // Clean up dummy file and uploaded file(s)
    afterAll(() => {
        if (fs.existsSync(testFilePath)) {fs.unlinkSync(testFilePath);}

        fs.readdirSync("./uploads").forEach(file => {
            fs.unlinkSync(`./uploads/${file}`);
        });
        fs.rmdirSync("./uploads");
    });

    it("should upload a file and store it in the uploads directory", async () => {
        const res = await request(app)
            .post("/upload")
            .attach("file", testFilePath);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.filename).toMatch(/^file-\d+-\d+\.pdf$/);

        const uploadedPath = path.join("./uploads", res.body.filename);
        expect(fs.existsSync(uploadedPath)).toBe(true);
    });

    it("should return an error if no file is uploaded", async () => {
        const res = await request(app).post("/upload");

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("No file uploaded");
    });
});
