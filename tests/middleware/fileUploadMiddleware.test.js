/* eslint-disable no-undef */
const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { fileUploadMiddleware } = require("../../server/middlewares/fileUploadMiddleware");

const app = express();
app.post("/upload", fileUploadMiddleware, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.status(200).json({ success: true, filename: req.file.filename });
});

describe("Multer file upload middleware", () => {
    const testFilePath = path.join(__dirname, "dummy.pdf");
    const testTextFilePath = path.join(__dirname, "dummy.txt");

    beforeAll(() => {
        fs.writeFileSync(testFilePath, "Dummy PDF content");
        fs.writeFileSync(testTextFilePath, "Dummy Text content");
        if (!fs.existsSync("./uploads")) {
            fs.mkdirSync("./uploads");
        }
    });

    afterAll(() => {
        if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
        if (fs.existsSync(testTextFilePath)) fs.unlinkSync(testTextFilePath);
        if (fs.existsSync("./uploads")) {
            fs.readdirSync("./uploads").forEach(file => {
                fs.unlinkSync(`./uploads/${file}`);
            });
            fs.rmdirSync("./uploads");
        }
    });

    it("should upload a .pdf file successfully", async () => {
        const res = await request(app)
            .post("/upload")
            .attach("file", testFilePath);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.filename).toMatch(/^file-\d+-\d+\.pdf$/);
        expect(fs.existsSync(path.join("./uploads", res.body.filename))).toBe(true);
    });

    it("should upload a .txt file successfully", async () => {
        const res = await request(app)
            .post("/upload")
            .attach("file", testTextFilePath);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.filename).toMatch(/^file-\d+-\d+\.txt$/);
    });

    it("should return an error if no file is uploaded", async () => {
        const res = await request(app).post("/upload");

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("No file uploaded");
    });

    it("should handle multiple uploads in quick succession", async () => {
        const promises = Array.from({ length: 3 }, () =>
            request(app).post("/upload").attach("file", testFilePath)
        );

        const responses = await Promise.all(promises);

        responses.forEach((res) => {
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.filename).toMatch(/^file-\d+-\d+\.pdf$/);
        });
    });

    it("should handle fs.mkdir error gracefully", async () => {
        const originalMkdir = fs.mkdir;
        const mockError = new Error("Failed to create directory");

        // Force mkdir to fail
        fs.mkdir = jest.fn((dir, options, cb) => cb(mockError));

        // Remove uploads directory to trigger mkdir
        if (fs.existsSync("./uploads")) {
            fs.readdirSync("./uploads").forEach(file => {
                fs.unlinkSync(`./uploads/${file}`);
            });
            fs.rmdirSync("./uploads");
        }

        const res = await request(app)
            .post("/upload")
            .attach("file", testFilePath);

        expect(res.statusCode).toBe(500);

        // Restore original mkdir after the test
        fs.mkdir = originalMkdir;
    });
});
