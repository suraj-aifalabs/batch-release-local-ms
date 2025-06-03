/* eslint-disable no-undef */
/* eslint-disable quotes */
const request = require('supertest');
const express = require('express');
const multer = require('multer');
const documentController = require('../../server/controllers/documentController');

jest.mock('../../server/middlewares/fileUploadMiddleware', () => {
    const multerMock = {
        single: () => (req, res, next) => {
            req.file = {
                originalname: 'test.pdf',
                mimetype: 'application/pdf',
                buffer: Buffer.from('test content')
            };
            next();
        }
    };
    return multerMock;
});

jest.mock('../../server/controllers/documentController', () => ({
    uploadFile: jest.fn((req, res) => res.status(200).send('upload success')),
    getFile: jest.fn((req, res) => res.status(200).send('get file success')),
    getBatchCertificate: jest.fn((req, res) => res.status(200).send('batch certificate success'))
}));

describe('Document Router', () => {
    let app;
    let fileUploadMiddleware;

    beforeAll(() => {
        jest.resetModules();
        fileUploadMiddleware = require('../../server/middlewares/fileUploadMiddleware');
        const documentRouter = require('../../server/routes/documentRoutes');

        app = express();
        app.use(express.json());
        app.use('/documents', documentRouter);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /documents/upload', () => {
        it('should call fileUploadMiddleware and uploadFile controller', async () => {
            const response = await request(app)
                .post('/documents/upload')
                .attach('file', Buffer.from('test content'), 'test.pdf')
                .expect(200);

            expect(documentController.uploadFile).toHaveBeenCalled();
            expect(response.text).toBe('upload success');
        });

        it('should handle file upload errors', async () => {
            fileUploadMiddleware.single = jest.fn(() => (req, res, next) => {
                next(new Error('File upload error'));
            });

            const response = await request(app)
                .post('/documents/upload')
                .attach('file', Buffer.from('test content'), 'test.pdf')
                .expect(400);

            expect(response.body.error).toBe('File upload error');
        });
    });

    describe('POST /documents/get_file', () => {
        it('should call fileUploadMiddleware and getFile controller', async () => {
            fileUploadMiddleware.single = jest.fn(() => (req, res, next) => {
                req.file = {
                    originalname: 'test.pdf',
                    mimetype: 'application/pdf',
                    buffer: Buffer.from('test content')
                };
                next();
            });

            const response = await request(app)
                .post('/documents/get_file')
                .attach('file', Buffer.from('test content'), 'test.pdf')
                .expect(200);

            expect(documentController.getFile).toHaveBeenCalled();
            expect(response.text).toBe('get file success');
        });
    });

    describe('POST /documents/get_batch_certificate', () => {
        it('should call getBatchCertificate without file middleware', async () => {
            const response = await request(app)
                .post('/documents/get_batch_certificate')
                .send({ batchId: '12345' })
                .expect(200);

            expect(documentController.getBatchCertificate).toHaveBeenCalled();
            expect(response.text).toBe('batch certificate success');
        });
    });
});