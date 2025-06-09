/* eslint-disable no-undef */
/* eslint-disable quotes */
const {
    listS3Files,
    generateSignedURL,
    uploadFileToS3,
} = require('../../server/utils/awsS3Utils');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');

// Mock AWS SDK and axios
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('axios');

describe('S3 Utility Functions', () => {
    const originalEnv = process.env;
    const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test')
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            AWS_REGION: 'us-east-1',
            AWS_BUCKET_NAME: 'test-bucket'
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('generateSignedURL', () => {


        it('should handle errors', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            getSignedUrl.mockRejectedValue(new Error('Failed to generate URL'));

            const result = await generateSignedURL({ orgFile: mockFile });

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error generating signed url',
                expect.any(Error)
            );
            expect(result).toBeUndefined();
            consoleSpy.mockRestore();
        });
    });

    describe('uploadFileToS3', () => {
        it('should upload file using presigned URL', async () => {
            const mockResponse = { status: 200 };
            axios.put.mockResolvedValue(mockResponse);

            const result = await uploadFileToS3('https://s3.signed.url', mockFile);

            expect(axios.put).toHaveBeenCalledWith(
                'https://s3.signed.url',
                mockFile,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            expect(result).toEqual(mockResponse);
        });

        it('should handle upload errors', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            axios.put.mockRejectedValue(new Error('Upload failed'));

            const result = await uploadFileToS3('https://s3.signed.url', mockFile);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error uploading file to S3',
                expect.any(Error)
            );
            expect(result).toBeUndefined();
            consoleSpy.mockRestore();
        });
    });


    describe('listS3Files', () => {
        it('should list all files in bucket', async () => {
            const mockObjects = [
                { Key: 'file1.txt', Size: 100 },
                { Key: 'file2.txt', Size: 200 }
            ];

            // Mock paginated responses
            S3Client.prototype.send
                .mockImplementationOnce(() => Promise.resolve({
                    Contents: mockObjects.slice(0, 1),
                    NextContinuationToken: 'token'
                }))
                .mockImplementationOnce(() => Promise.resolve({
                    Contents: mockObjects.slice(1),
                    NextContinuationToken: undefined
                }));

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await listS3Files();

            expect(ListObjectsV2Command).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockObjects);
            expect(consoleSpy).toHaveBeenCalledWith('Total objects found: 2');
            consoleSpy.mockRestore();
        });

        it('should handle listing errors', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            S3Client.prototype.send.mockRejectedValue(new Error('Listing failed'));

            const result = await listS3Files();

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error listing objects:',
                expect.any(Error)
            );
            expect(result).toBeUndefined();
            consoleSpy.mockRestore();
        });
    });


});