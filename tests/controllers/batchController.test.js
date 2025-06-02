/* eslint-disable no-undef */
const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

jest.mock("fs", () => ({
    promises: {
        readFile: jest.fn()
    }
}));

jest.mock("pdf-lib", () => ({
    PDFDocument: {
        load: jest.fn()
    },
    StandardFonts: {
        Helvetica: "Helvetica"
    }
}));

jest.mock("../../server/middlewares/catchAsyncError", () => (fn) => fn);

const { getPDF } = require("../../server/controllers/batchController");

describe("getPDF Controller Tests", () => {
    let app;
    let mockReq;
    let mockRes;
    let mockPdfDoc;
    let mockFirstPage;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use(express.json());
        app.post("/pdf", getPDF);

        mockRes = {
            setHeader: jest.fn(),
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockFirstPage = {
            getSize: jest.fn().mockReturnValue({ height: 800 }),
            drawText: jest.fn(),
            drawImage: jest.fn()
        };

        mockPdfDoc = {
            embedFont: jest.fn().mockResolvedValue("mock-font"),
            embedPng: jest.fn().mockResolvedValue("mock-checkmark-image"),
            getPages: jest.fn().mockReturnValue([mockFirstPage]),
            save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
        };

        fs.promises.readFile
            .mockResolvedValueOnce(Buffer.from("mock-pdf-template"))
            .mockResolvedValueOnce(Buffer.from("mock-checkmark-image"));

        PDFDocument.load.mockResolvedValue(mockPdfDoc);
    });

    describe("Successful PDF Generation", () => {
        test("should generate PDF with all required fields", async () => {
            const requestBody = {
                username: "John Doe",
                email: "john.doe@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
            expect(fs.promises.readFile).toHaveBeenCalledWith(
                expect.stringContaining("TV-FRM-58719.pdf")
            );
            expect(fs.promises.readFile).toHaveBeenCalledWith(
                expect.stringContaining("Tick_Image.png")
            );

            expect(PDFDocument.load).toHaveBeenCalled();
            expect(mockPdfDoc.embedFont).toHaveBeenCalled();
            expect(mockPdfDoc.embedPng).toHaveBeenCalled();
            expect(mockPdfDoc.save).toHaveBeenCalled();

            expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
            expect(mockRes.send).toHaveBeenCalledWith(expect.any(Buffer));
        });

        test("should handle exception=true correctly", async () => {
            const requestBody = {
                username: "Jane Smith",
                email: "jane@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockFirstPage.drawImage).toHaveBeenCalledWith(
                "mock-checkmark-image",
                expect.objectContaining({
                    x: 419,
                    y: 800 - 647,
                    width: 10,
                    height: 10
                })
            );
        });

        test("should handle exception=false correctly", async () => {
            const requestBody = {
                username: "Bob Wilson",
                email: "bob@example.com",
                exception: "false"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockFirstPage.drawImage).toHaveBeenCalledWith(
                "mock-checkmark-image",
                expect.objectContaining({
                    x: 419,
                    y: 800 - 647 + 14,
                    width: 10,
                    height: 10
                })
            );
        });

        test("should generate digital signature text correctly", async () => {
            const requestBody = {
                username: "Digital Signer",
                email: "signer@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockFirstPage.drawText).toHaveBeenCalledWith(
                "Digitally signed by Digital Signer(9821)",
                expect.objectContaining({
                    x: 350,
                    y: 800 - 675,
                    size: 8
                })
            );

            expect(mockFirstPage.drawText).toHaveBeenCalledWith(
                "Digital Signer",
                expect.objectContaining({
                    x: 260,
                    y: 800 - 680,
                    size: 12
                })
            );
        });

        test("should format and display current date correctly", async () => {
            const requestBody = {
                username: "Date Tester",
                email: "date@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            const drawTextCalls = mockFirstPage.drawText.mock.calls;
            const dateCall = drawTextCalls.find(call =>
                call[0] && call[0].includes("2025")
            );

            expect(dateCall).toBeDefined();
        });

        test("should populate static data fields correctly", async () => {
            const requestBody = {
                username: "Field Tester",
                email: "field@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            const drawTextCalls = mockFirstPage.drawText.mock.calls;
            const textValues = drawTextCalls.map(call => call[0]);


            expect(textValues).toContain("Sanjay");
            expect(textValues).toContain("78");
            expect(textValues).toContain("DIN00777");
            expect(textValues).toContain("ORD15");
            expect(textValues).toContain("B114AF");
            expect(textValues).toContain("COIC883");
            expect(textValues).toContain("100");
            expect(textValues).toContain("10mg");
            expect(textValues).toContain("PCC8787");
            expect(textValues).toContain("IN");
        });
    });

    describe("Edge Cases and Error Handling", () => {
        test("should handle missing username", async () => {
            const requestBody = {
                email: "test@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
            expect(mockRes.send).toHaveBeenCalled();
        });

        test("should handle missing email", async () => {
            const requestBody = {
                username: "Test User",
                exception: "false"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
            expect(mockRes.send).toHaveBeenCalled();
        });

        test("should handle missing exception field", async () => {
            const requestBody = {
                username: "Test User",
                email: "test@example.com"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockFirstPage.drawImage).not.toHaveBeenCalled();
            expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
        });

        test("should handle empty request body", async () => {
            const requestBody = {};

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
            expect(mockRes.send).toHaveBeenCalled();
        });

        test("should handle invalid exception values", async () => {
            const requestBody = {
                username: "Test User",
                email: "test@example.com",
                exception: "invalid_value"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockFirstPage.drawImage).not.toHaveBeenCalled();
            expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
        });

        test("should handle file read error", async () => {
            jest.clearAllMocks();
            fs.promises.readFile.mockRejectedValue(new Error("File not found"));

            const requestBody = {
                username: "Test User",
                email: "test@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "File not found"
            });
        });

        test("should handle PDF document load error", async () => {
            jest.clearAllMocks();
            fs.promises.readFile
                .mockResolvedValueOnce(Buffer.from("mock-pdf-template"))
                .mockResolvedValueOnce(Buffer.from("mock-checkmark-image"));
            PDFDocument.load.mockRejectedValue(new Error("Invalid PDF"));

            const requestBody = {
                username: "Test User",
                email: "test@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Invalid PDF"
            });
        });

        test("should handle PDF save error", async () => {
            // Reset mocks and setup error
            jest.clearAllMocks();
            fs.promises.readFile
                .mockResolvedValueOnce(Buffer.from("mock-pdf-template"))
                .mockResolvedValueOnce(Buffer.from("mock-checkmark-image"));

            mockPdfDoc.save.mockRejectedValue(new Error("Save failed"));
            PDFDocument.load.mockResolvedValue(mockPdfDoc);

            const requestBody = {
                username: "Test User",
                email: "test@example.com",
                exception: "true"
            };

            mockReq = { body: requestBody };
            await getPDF(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Save failed"
            });
        });
    });

    describe("Integration Tests", () => {
        test("should handle complete request flow with supertest", async () => {
            const response = await request(app)
                .post("/pdf")
                .send({
                    username: "Integration Test",
                    email: "integration@test.com",
                    exception: "true"
                });


            expect(response.status).toBe(200);
        });
    });
});

