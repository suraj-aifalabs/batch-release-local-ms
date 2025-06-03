/* eslint-disable quotes */
/* eslint-disable no-undef */
// __tests__/fileController.test.js

process.env.NODE_ENV = 'test';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_SDK_LOAD_CONFIG = '0';

const mockGenerateSignedURL = jest.fn();
const mockUploadFileToS3 = jest.fn();
const mockGetFileFromS3 = jest.fn();
const mockSanitizeInput = jest.fn();
const mockDbCreate = jest.fn();
const mockFsReadFile = jest.fn();
const mockFsUnlink = jest.fn();

jest.doMock('../../server/utils/awsS3Utils', () => ({
    generateSignedURL: mockGenerateSignedURL,
    uploadFileToS3: mockUploadFileToS3,
    getFileFromS3: mockGetFileFromS3
}));

jest.doMock('../../server/config/db', () => ({
    db: {
        batch_documents: {
            create: mockDbCreate
        }
    }
}));

jest.doMock('../../server/utils/sanitizeRules', () => ({
    sanitizeInput: mockSanitizeInput
}));

jest.doMock('../../server/middlewares/catchAsyncError', () => {
    return jest.fn((fn) => fn);
});

jest.doMock('fs', () => ({
    promises: {
        readFile: mockFsReadFile,
        unlink: mockFsUnlink
    }
}));

jest.doMock('path', () => ({
    join: jest.fn((...args) => args.join('/'))
}));

const mockPDFDoc = {
    embedFont: jest.fn().mockResolvedValue({}),
    embedPng: jest.fn().mockResolvedValue({}),
    getPages: jest.fn().mockReturnValue([{
        getSize: jest.fn().mockReturnValue({ height: 800 }),
        drawText: jest.fn(),
        drawImage: jest.fn()
    }]),
    save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
};

jest.doMock('pdf-lib', () => ({
    PDFDocument: {
        load: jest.fn().mockResolvedValue(mockPDFDoc)
    },
    StandardFonts: {
        Helvetica: 'Helvetica'
    }
}));

const fileController = require('../../server/controllers/documentController');

describe('File Controller Tests', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            file: null,
            body: {},
            query: {},
            method: 'POST',
            user: {
                username: 'testuser',
                name: 'Test User',
                email: 'test@example.com'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
            send: jest.fn()
        };
    });

    describe('uploadFile', () => {
        test('should upload file successfully', async () => {
            const mockFile = {
                originalname: 'test.pdf',
                size: 1024 * 1024,
                mimetype: 'application/pdf',
                path: '/tmp/test.pdf',
                destination: '/tmp',
                filename: 'test-123.pdf'
            };
            req.file = mockFile;

            mockGenerateSignedURL.mockResolvedValue({
                signedURL: 'https://s3.amazonaws.com/signed-url',
                filename: 'test-123.pdf'
            });
            mockUploadFileToS3.mockResolvedValue({ status: 200 });
            mockFsReadFile.mockResolvedValue(Buffer.from('mock file content'));
            mockFsUnlink.mockResolvedValue();
            mockDbCreate.mockResolvedValue({});

            await fileController.uploadFile(req, res);

            expect(mockGenerateSignedURL).toHaveBeenCalledWith(mockFile);
            expect(mockUploadFileToS3).toHaveBeenCalled();
            expect(mockDbCreate).toHaveBeenCalledWith({
                file_name: 'test-123.pdf',
                file_size: 1024 * 1024,
                file_type: 'application/pdf',
                batch_number: '123',
                s3_location: '123',
                uploaded_by: 'system'
            });
            expect(mockFsUnlink).toHaveBeenCalledWith('/tmp/test-123.pdf');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Document uploaded successfully',
                file_name: 'test-123.pdf',
                file_type: 'application/pdf'
            });
        });

        test('should return 400 when no file provided', async () => {
            req.file = null;

            await fileController.uploadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Please attach a file'
            });
        });

        test('should return 400 when file size exceeds limit', async () => {
            req.file = {
                size: 51 * 1024 * 1024,
                originalname: 'large-file.pdf'
            };


            await fileController.uploadFile(req, res);


            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Supported file size is 50MB'
            });
        });

        test('should return 500 when signed URL generation fails', async () => {

            req.file = {
                size: 1024,
                originalname: 'test.pdf'
            };
            mockGenerateSignedURL.mockResolvedValue({ signedURL: null });


            await fileController.uploadFile(req, res);


            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error generating URL for S3 upload'
            });
        });

        test('should return 500 when S3 upload fails', async () => {

            req.file = {
                size: 1024,
                originalname: 'test.pdf',
                path: '/tmp/test.pdf'
            };
            mockGenerateSignedURL.mockResolvedValue({
                signedURL: 'https://s3.amazonaws.com/signed-url',
                filename: 'test.pdf'
            });
            mockUploadFileToS3.mockResolvedValue({ status: 500 });
            mockFsReadFile.mockResolvedValue(Buffer.from('content'));

            // Act
            await fileController.uploadFile(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error Uploading File to S3'
            });
        });
    });

    describe('getFile', () => {
        test('should retrieve file successfully', async () => {
            // Arrange
            req.method = 'GET';
            req.query = { file_name: 'test.pdf' };
            mockSanitizeInput.mockReturnValue({ file_name: 'test.pdf' });
            mockGetFileFromS3.mockResolvedValue('https://s3.amazonaws.com/file-url');

            // Act
            await fileController.getFile(req, res);

            // Assert
            expect(mockSanitizeInput).toHaveBeenCalledWith(req.query);
            expect(mockGetFileFromS3).toHaveBeenCalledWith('test.pdf');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'File retrieved successfully',
                url: 'https://s3.amazonaws.com/file-url'
            });
        });

        test('should return 400 when file_name not provided', async () => {
            // Arrange
            req.query = {};
            mockSanitizeInput.mockReturnValue({});

            // Act
            await fileController.getFile(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Please provide a file name (ex: example_image.png)'
            });
        });

        test('should return 400 when getFileFromS3 fails', async () => {
            // Arrange
            req.query = { file_name: 'test.pdf' };
            mockSanitizeInput.mockReturnValue({ file_name: 'test.pdf' });
            mockGetFileFromS3.mockResolvedValue(null);

            // Act
            await fileController.getFile(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error generating URL for file'
            });
        });
    });

    describe('getBatchCertificate', () => {
        beforeEach(() => {
            mockFsReadFile
                .mockResolvedValueOnce(Buffer.from('pdf template content'))
                .mockResolvedValueOnce(Buffer.from('image content'));
        });

        test('should generate batch certificate successfully', async () => {
            // Arrange
            req.body = {
                exception: false,
                sign: false
            };

            // Act
            await fileController.getBatchCertificate(req, res);

            // Assert
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
        });

        test('should generate certificate with signing', async () => {
            // Arrange
            req.body = {
                exception: true,
                sign: true
            };

            // Act
            await fileController.getBatchCertificate(req, res);

            // Assert
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
        });

        test('should handle PDF generation errors', async () => {
            // Arrange
            mockFsReadFile.mockRejectedValue(new Error('File read error'));

            // Act
            await fileController.getBatchCertificate(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'File read error'
            });
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing user information', async () => {
            // Arrange
            req.user = null;
            req.body = { sign: true };
            mockFsReadFile
                .mockResolvedValueOnce(Buffer.from('pdf'))
                .mockResolvedValueOnce(Buffer.from('image'));

            // Act
            await fileController.getBatchCertificate(req, res);

            // Assert
            expect(res.send).toHaveBeenCalled();
        });

        test('should handle file size boundary (exactly 50MB)', async () => {
            // Arrange
            req.file = { size: 50 * 1024 * 1024 };

            // Act
            await fileController.uploadFile(req, res);

            expect(mockGenerateSignedURL).toHaveBeenCalled();
        });
    });
});