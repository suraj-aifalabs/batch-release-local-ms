/* eslint-disable quotes */
/* eslint-disable no-undef */
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');
const s3Service = require('../../server/utils/awsS3Utils');

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('axios');

describe('AWS S3 Service', () => {
    const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content')
    };

    beforeAll(() => {
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_BUCKET_NAME = 'test-bucket';
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateSignedURL', () => {
        it('should generate a signed URL for file upload', async () => {
            const mockSignedUrl = 'https://s3.signed.url';
            getSignedUrl.mockResolvedValue(mockSignedUrl);

            const result = await s3Service.generateSignedURL(mockFile);

            expect(PutObjectCommand).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: 'test-atara.pdf',
                ContentType: 'application/pdf'
            });
            expect(result).toEqual({
                signedURL: mockSignedUrl,
                filename: 'test-atara.pdf'
            });
        });

        it('should handle errors when generating signed URL', async () => {
            const error = new Error('Failed to generate URL');
            getSignedUrl.mockRejectedValue(error);

            const result = await s3Service.generateSignedURL(mockFile);

            expect(result).toBeUndefined();
        });
    });

    describe('uploadFileToS3', () => {
        it('should upload file to S3 using presigned URL', async () => {
            const mockResponse = { status: 200 };
            axios.put.mockResolvedValue(mockResponse);
            const presignedUrl = 'https://s3.signed.url';

            const result = await s3Service.uploadFileToS3(presignedUrl, mockFile.buffer);

            expect(axios.put).toHaveBeenCalledWith(presignedUrl, mockFile.buffer, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            expect(result).toEqual(mockResponse);
        });

        it('should handle errors when uploading file', async () => {
            const error = new Error('Upload failed');
            axios.put.mockRejectedValue(error);

            const result = await s3Service.uploadFileToS3('https://s3.signed.url', mockFile.buffer);

            expect(result).toBeUndefined();
        });
    });

    describe('getFileFromS3', () => {
        it('should generate a signed URL for file download', async () => {
            const mockSignedUrl = 'https://s3.download.url';
            getSignedUrl.mockResolvedValue(mockSignedUrl);
            const key = 'test-atara.pdf';

            const result = await s3Service.getFileFromS3(key);

            expect(GetObjectCommand).toHaveBeenCalledWith({
                Bucket: 'test-bucket',
                Key: key
            });
            expect(result).toBe(mockSignedUrl);
        });

        it('should handle errors when generating download URL', async () => {
            const error = new Error('Failed to generate URL');
            getSignedUrl.mockRejectedValue(error);

            const result = await s3Service.getFileFromS3('test-atara.pdf');

            expect(result).toBeUndefined();
        });
    });

    describe('listS3Files', () => {
        it('should list all files in the bucket', async () => {
            const mockObjects = [
                { Key: 'file1.pdf', Size: 100 },
                { Key: 'file2.pdf', Size: 200 }
            ];

            const mockS3Client = {
                send: jest.fn()
                    .mockResolvedValueOnce({
                        Contents: mockObjects.slice(0, 1),
                        NextContinuationToken: 'token'
                    })
                    .mockResolvedValueOnce({
                        Contents: mockObjects.slice(1),
                        NextContinuationToken: undefined
                    })
            };
            S3Client.mockImplementation(() => mockS3Client);

            const result = await s3Service.listS3Files();

            expect(ListObjectsV2Command).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockObjects);
        });

        it('should handle empty bucket', async () => {
            const mockS3Client = {
                send: jest.fn().mockResolvedValue({ Contents: [] })
            };
            S3Client.mockImplementation(() => mockS3Client);

            const result = await s3Service.listS3Files();

            expect(result).toEqual(undefined);
        });

        it('should handle errors when listing files', async () => {
            const mockS3Client = {
                send: jest.fn().mockRejectedValue(new Error('List failed'))
            };
            S3Client.mockImplementation(() => mockS3Client);

            const result = await s3Service.listS3Files();

            expect(result).toBeUndefined();
        });
    });
});