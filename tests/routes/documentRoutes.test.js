/* eslint-disable no-undef */
const express = require("express");
const request = require("supertest");

// Mock middleware and controller
jest.mock("../../server/controllers/documentController", () => ({
    uploadFile: jest.fn((req, res) => res.status(200).json({ message: "uploadFile called" })),
    getFile: jest.fn((req, res) => res.status(200).json({ message: "getFile called" })),
    getBatchCertificate: jest.fn((req, res) => res.status(200).json({ message: "getBatchCertificate called" })),
    getBatchDocuments: jest.fn((req, res) => res.status(200).json({ message: "getBatchDocuments called" })),
}));

jest.mock("../../server/middlewares/fileUploadMiddleware", () => ({
    fileUploadMiddleware: jest.fn((req, res, next) => next()),
}));

const documentRoutes = require("../../server/routes/documentRoutes");

describe("Document Routes", () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use("/", documentRoutes);
    });

    it("POST /upload should call fileUploadMiddleware and uploadFile", async () => {
        const res = await request(app).post("/upload");
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("uploadFile called");
    });

    it("POST /get_file should call fileUploadMiddleware and getFile", async () => {
        const res = await request(app).post("/get_file");
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("getFile called");
    });

    it("POST /get_batch_certificate should call getBatchCertificate", async () => {
        const res = await request(app).post("/get_batch_certificate");
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("getBatchCertificate called");
    });

    it("POST /get_batch_documents should call getBatchDocuments", async () => {
        const res = await request(app).post("/get_batch_documents");
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("getBatchDocuments called");
    });
});
