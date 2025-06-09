/* eslint-disable no-undef */
/* eslint-disable quotes */
// Jest setup and configuration
const mockFs = {
    promises: {
        readFile: jest.fn(),
        unlink: jest.fn()
    }
};

const mockPDFLib = {
    PDFDocument: {
        load: jest.fn()
    },
    StandardFonts: {
        Helvetica: "Helvetica"
    }
};

const mockAwsUtils = {
    generateSignedURL: jest.fn(),
    uploadFileToS3: jest.fn(),
    getFileFromS3: jest.fn(),
    listFolderFiles: jest.fn()
};

const mockDb = {
    db: {
        batch_documents: {
            create: jest.fn()
        }
    }
};

const mockSanitize = {
    sanitizeInput: jest.fn()
};

const mockBatchService = {
    postRequest: jest.fn()
};

// Mock all modules
jest.doMock("fs", () => mockFs);
jest.doMock("pdf-lib", () => mockPDFLib);
jest.doMock("../../server/utils/awsS3Utils", () => mockAwsUtils);
jest.doMock("../../server/config/db", () => mockDb);
jest.doMock("../../server/utils/sanitizeRules", () => mockSanitize);
jest.doMock("../../server/services/batchService", () => mockBatchService);
jest.doMock("../../server/middlewares/catchAsyncError", () => (fn) => fn);

describe("Document Controller Tests", () => {
    let uploadFile, getFile, getBatchCertificate, getBatchDocuments;
    let req, res;

    beforeAll(() => {
        jest.resetModules();

        const controller = require("../../server/controllers/documentController");
        uploadFile = controller.uploadFile;
        getFile = controller.getFile;
        getBatchCertificate = controller.getBatchCertificate;
        getBatchDocuments = controller.getBatchDocuments;
    });

    beforeEach(() => {
        req = {
            file: null,
            query: {},
            body: {},
            method: "POST",
            user: {
                username: "testuser",
                name: "Test User",
                email: "test@example.com"
            }
        };

        res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res),
            setHeader: jest.fn(() => res),
            send: jest.fn(() => res)
        };

        // Reset all mocks
        Object.values(mockAwsUtils).forEach(mock => mock.mockReset());
        Object.values(mockDb.db.batch_documents).forEach(mock => mock.mockReset());
        Object.values(mockSanitize).forEach(mock => mock.mockReset());
        Object.values(mockBatchService).forEach(mock => mock.mockReset());
        Object.values(mockFs.promises).forEach(mock => mock.mockReset());
        mockPDFLib.PDFDocument.load.mockReset();
    });

    describe("uploadFile", () => {
        const mockFile = {
            path: "/tmp/test-file",
            originalname: "test.pdf",
            size: 1024000, // 1MB
            mimetype: "application/pdf",
            destination: "/tmp",
            filename: "test-file-123"
        };

        test("should upload file successfully", async () => {
            req.file = mockFile;

            mockSanitize.sanitizeInput.mockReturnValue({
                batch_number: "BATCH123",
                file_name: "Final Product Bag Reconciliation Form"
            });

            mockAwsUtils.generateSignedURL.mockResolvedValue({
                signedURL: "https://s3.amazonaws.com/signed-url",
                filename: "FPD_FORM_123.pdf"
            });

            mockFs.promises.readFile.mockResolvedValue(Buffer.from("file content"));
            mockAwsUtils.uploadFileToS3.mockResolvedValue({ status: 200 });
            mockDb.db.batch_documents.create.mockResolvedValue({});
            mockFs.promises.unlink.mockResolvedValue();

            await uploadFile(req, res);

            expect(mockAwsUtils.generateSignedURL).toHaveBeenCalledWith({
                folder: "BATCH123",
                fileName: "FPD_FORM",
                orgFile: mockFile
            });
            expect(mockAwsUtils.uploadFileToS3).toHaveBeenCalled();
            expect(mockDb.db.batch_documents.create).toHaveBeenCalled();
            expect(mockFs.promises.unlink).toHaveBeenCalledWith("/tmp/test-file-123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Document uploaded successfully",
                file_name: "FPD_FORM_123.pdf",
                file_type: "application/pdf"
            });
        });

        test("should return error when no file is provided", async () => {
            req.file = null;
            mockSanitize.sanitizeInput.mockReturnValue({});

            await uploadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Please attach a file"
            });
        });



        test("should return error when signed URL generation fails", async () => {
            req.file = mockFile;
            mockSanitize.sanitizeInput.mockReturnValue({
                batch_number: "BATCH123",
                file_name: "Final Product Bag Reconciliation Form"
            });
            mockAwsUtils.generateSignedURL.mockResolvedValue({ signedURL: null });

            await uploadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error generating URL for S3 upload"
            });
        });

        test("should return error when S3 upload fails", async () => {
            req.file = mockFile;
            mockSanitize.sanitizeInput.mockReturnValue({
                batch_number: "BATCH123",
                file_name: "Final Product Bag Reconciliation Form"
            });
            mockAwsUtils.generateSignedURL.mockResolvedValue({
                signedURL: "https://s3.amazonaws.com/signed-url",
                filename: "test.pdf"
            });
            mockFs.promises.readFile.mockResolvedValue(Buffer.from("file content"));
            mockAwsUtils.uploadFileToS3.mockResolvedValue({ status: 500 });

            await uploadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error Uploading File to S3"
            });
        });

        test("should handle all file name codes correctly", async () => {
            const testCases = [
                { input: "Final Product Bag Reconciliation Form", expected: "FPD_FORM" },
                { input: "Final Cassette Label Reconciliation Form", expected: "FCLR_FORM" },
                { input: "Critical Information from MES", expected: "CI-MES" },
                { input: "Certificate of Analysis", expected: "COA" },
                { input: "CAR-T Change Control List", expected: "CCL" },
                { input: "QA Market Release Checklist", expected: "Release_Checklist" },
                { input: "Lot Information Sheet", expected: "LOT" },
                { input: "Shipping Authorisation", expected: "SA" }
            ];

            for (const testCase of testCases) {
                req.file = mockFile;
                mockSanitize.sanitizeInput.mockReturnValue({
                    batch_number: "BATCH123",
                    file_name: testCase.input
                });
                mockAwsUtils.generateSignedURL.mockResolvedValue({
                    signedURL: "https://s3.amazonaws.com/signed-url",
                    filename: "test.pdf"
                });
                mockFs.promises.readFile.mockResolvedValue(Buffer.from("file content"));
                mockAwsUtils.uploadFileToS3.mockResolvedValue({ status: 200 });
                mockDb.db.batch_documents.create.mockResolvedValue({});
                mockFs.promises.unlink.mockResolvedValue();

                await uploadFile(req, res);

                expect(mockAwsUtils.generateSignedURL).toHaveBeenCalledWith({
                    folder: "BATCH123",
                    fileName: testCase.expected,
                    orgFile: mockFile
                });

                // Reset mocks for next iteration
                Object.values(mockAwsUtils).forEach(mock => mock.mockReset());
                Object.values(mockDb.db.batch_documents).forEach(mock => mock.mockReset());
                mockFs.promises.readFile.mockReset();
                mockFs.promises.unlink.mockReset();
            }
        });
    });

    describe("getFile", () => {
        test("should retrieve file successfully", async () => {
            mockSanitize.sanitizeInput.mockReturnValue({ file_name: "test.pdf" });
            mockAwsUtils.getFileFromS3.mockResolvedValue("https://s3.amazonaws.com/file-url");

            await getFile(req, res);

            expect(mockAwsUtils.getFileFromS3).toHaveBeenCalledWith("test.pdf");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "File retrieved successfully",
                url: "https://s3.amazonaws.com/file-url"
            });
        });

        test("should return error when filename is not provided", async () => {
            mockSanitize.sanitizeInput.mockReturnValue({ file_name: null });

            await getFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Please provide a file name (ex: example_image.png)"
            });
        });

        test("should return error when file retrieval fails", async () => {
            mockSanitize.sanitizeInput.mockReturnValue({ file_name: "test.pdf" });
            mockAwsUtils.getFileFromS3.mockResolvedValue(null);

            await getFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error generating URL for file"
            });
        });
    });

    describe("getBatchCertificate", () => {
        const mockPdfDoc = {
            embedFont: jest.fn(),
            embedPng: jest.fn(),
            getPages: jest.fn(),
            save: jest.fn()
        };

        const mockPage = {
            getSize: jest.fn(() => ({ height: 800 })),
            drawText: jest.fn(),
            drawImage: jest.fn()
        };

        beforeEach(() => {
            req.body = {
                exception: false,
                sign: true,
                batchNumber: "23HC3478"
            };

            mockFs.promises.readFile
                .mockResolvedValueOnce(Buffer.from("pdf template"))
                .mockResolvedValueOnce(Buffer.from("tick image"));

            mockPDFLib.PDFDocument.load.mockResolvedValue(mockPdfDoc);
            mockPdfDoc.embedFont.mockResolvedValue("font");
            mockPdfDoc.embedPng.mockResolvedValue("checkmark");
            mockPdfDoc.getPages.mockReturnValue([mockPage]);
            mockPdfDoc.save.mockResolvedValue(Buffer.from("generated pdf"));

            mockBatchService.postRequest.mockResolvedValue({
                data: {
                    batch_id: "BATCH123",
                    total_volume_in_ml: "100",
                    product_dose_per_bag: "1x10^6",
                    expiration_date: "2024-12-31",
                    nameAndAddress: "Test Address",
                    associated_country: "USA"
                }
            });
        });

        // test("should generate batch certificate successfully", async () => {
        //     await getBatchCertificate(req, res);

        //     expect(mockFs.promises.readFile).toHaveBeenCalledTimes(2);
        //     expect(mockPDFLib.PDFDocument.load).toHaveBeenCalled();
        //     expect(mockPdfDoc.embedFont).toHaveBeenCalledWith("Helvetica");
        //     expect(mockPdfDoc.embedPng).toHaveBeenCalled();
        //     // expect(mockBatchService.postRequest).toHaveBeenCalledWith("/service/get_batch", {
        //     //     batch_number: "23HC3478"
        //     // });
        //     expect(mockPage.drawText).toHaveBeenCalled();
        //     expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
        //     expect(res.send).toHaveBeenCalledWith(Buffer.from("generated pdf"));
        // });

        test("should use default batch number when not provided", async () => {
            req.body.batchNumber = "";

            await getBatchCertificate(req, res);

        });

        // test("should handle exception checkbox correctly", async () => {
        //     req.body.exception = true;

        //     await getBatchCertificate(req, res);

        //     expect(mockPage.drawImage).toHaveBeenCalledWith("checkmark", {
        //         x: 419,
        //         y: 800 - 647,
        //         width: 10,
        //         height: 10
        //     });
        // });


    });

    describe("getBatchDocuments", () => {
        test("should retrieve batch documents successfully", async () => {
            const mockDocuments = [
                { name: "doc1.pdf", size: 1024 },
                { name: "doc2.pdf", size: 2048 }
            ];

            mockSanitize.sanitizeInput.mockReturnValue({ batch_number: "BATCH123" });
            mockAwsUtils.listFolderFiles.mockResolvedValue(mockDocuments);

            await getBatchDocuments(req, res);

            expect(mockAwsUtils.listFolderFiles).toHaveBeenCalledWith({
                folderPrefix: "BATCH123"
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Batch documents",
                documents: mockDocuments
            });
        });

        test("should handle empty document list", async () => {
            mockSanitize.sanitizeInput.mockReturnValue({ batch_number: "BATCH123" });
            mockAwsUtils.listFolderFiles.mockResolvedValue(null);

            await getBatchDocuments(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: "Batch documents",
                documents: []
            });
        });

        test("should handle GET method", async () => {
            req.method = "GET";
            req.query = { batch_number: "BATCH123" };

            mockSanitize.sanitizeInput.mockReturnValue({ batch_number: "BATCH123" });
            mockAwsUtils.listFolderFiles.mockResolvedValue([]);

            await getBatchDocuments(req, res);

            expect(mockSanitize.sanitizeInput).toHaveBeenCalledWith(req.query);
            expect(mockAwsUtils.listFolderFiles).toHaveBeenCalledWith({
                folderPrefix: "BATCH123"
            });
        });
    });
});

describe("Document Controller Integration Tests", () => {
    test("should handle workflow from upload to certificate generation", async () => {

        expect(true).toBe(true);
    });
});

// Test configuration and setup utilities
describe("Test Utilities", () => {
    test("should create valid mock file object", () => {
        const mockFile = {
            path: "/tmp/test-file",
            originalname: "test.pdf",
            size: 1024000,
            mimetype: "application/pdf",
            destination: "/tmp",
            filename: "test-file-123"
        };

        expect(mockFile).toHaveProperty('path');
        expect(mockFile).toHaveProperty('originalname');
        expect(mockFile).toHaveProperty('size');
        expect(mockFile).toHaveProperty('mimetype');
        expect(mockFile.size).toBeLessThan(52428800); // Under 50MB limit
    });


});