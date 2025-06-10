/* eslint-disable no-undef */
/* eslint-disable quotes */
const {
    listS3Files,
    generateSignedURL,
    uploadFileToS3,
    getFileFromS3,
    listFolderFiles
} = require('../../server/utils/awsS3Utils');
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
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

        it('should handle file without extension', async () => {
            const mockSignedUrl = 'https://s3.signed.url';
            getSignedUrl.mockResolvedValue(mockSignedUrl);

            const fileWithoutExt = {
                originalname: 'testfile',
                mimetype: 'text/plain'
            };

            const result = await generateSignedURL({ orgFile: fileWithoutExt });

            expect(result.filename).toBe('default_loc/testfile-atara-.testfile');
        });

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

        it('should handle network timeout errors', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            const timeoutError = new Error('Network timeout');
            timeoutError.code = 'ECONNABORTED';
            axios.put.mockRejectedValue(timeoutError);

            const result = await uploadFileToS3('https://s3.signed.url', mockFile);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error uploading file to S3',
                expect.any(Error)
            );
            expect(result).toBeUndefined();
            consoleSpy.mockRestore();
        });
    });

    describe('getFileFromS3', () => {

        it('should handle errors when getting file', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            getSignedUrl.mockRejectedValue(new Error('File not found'));

            const result = await getFileFromS3('nonexistent/file.pdf');

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error getting file from S3',
                expect.any(Error)
            );
            expect(result).toBeUndefined();
            consoleSpy.mockRestore();
        });

        it('should handle AWS permission errors', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            const permissionError = new Error('Access Denied');
            permissionError.code = 'AccessDenied';
            getSignedUrl.mockRejectedValue(permissionError);

            const result = await getFileFromS3('restricted/file.pdf');

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error getting file from S3',
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

        it('should handle empty bucket', async () => {
            S3Client.prototype.send.mockResolvedValue({
                Contents: [],
                NextContinuationToken: undefined
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await listS3Files();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Total objects found: 0');
            consoleSpy.mockRestore();
        });

        it('should handle bucket with no Contents property', async () => {
            S3Client.prototype.send.mockResolvedValue({
                NextContinuationToken: undefined
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await listS3Files();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Total objects found: 0');
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

        it('should handle multiple pages correctly', async () => {
            const page1Objects = [{ Key: 'file1.txt', Size: 100 }];
            const page2Objects = [{ Key: 'file2.txt', Size: 200 }];
            const page3Objects = [{ Key: 'file3.txt', Size: 300 }];

            S3Client.prototype.send
                .mockImplementationOnce(() => Promise.resolve({
                    Contents: page1Objects,
                    NextContinuationToken: 'token1'
                }))
                .mockImplementationOnce(() => Promise.resolve({
                    Contents: page2Objects,
                    NextContinuationToken: 'token2'
                }))
                .mockImplementationOnce(() => Promise.resolve({
                    Contents: page3Objects,
                    NextContinuationToken: undefined
                }));

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await listS3Files();

            expect(ListObjectsV2Command).toHaveBeenCalledTimes(3);
            expect(result).toEqual([...page1Objects, ...page2Objects, ...page3Objects]);
            expect(consoleSpy).toHaveBeenCalledWith('Total objects found: 3');
            consoleSpy.mockRestore();
        });
    });

    describe('listFolderFiles', () => {
        const mockGetFileFromS3 = require('../../server/utils/awsS3Utils').getFileFromS3;

        beforeEach(() => {
            // Mock getFileFromS3 for listFolderFiles tests
            jest.doMock('../../server/utils/awsS3Utils', () => ({
                ...jest.requireActual('../../server/utils/awsS3Utils'),
                getFileFromS3: jest.fn()
            }));
        });



        it('should handle empty folder', async () => {
            S3Client.prototype.send.mockResolvedValue({
                Contents: [],
                NextContinuationToken: undefined
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await listFolderFiles({ folderPrefix: 'empty-folder/' });

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Total objects found: 0');
            consoleSpy.mockRestore();
        });

        it('should handle folder with no Contents', async () => {
            S3Client.prototype.send.mockResolvedValue({
                NextContinuationToken: undefined
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await listFolderFiles({ folderPrefix: 'no-contents/' });

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('Total objects found: 0');
            consoleSpy.mockRestore();
        });



        it('should handle pagination in folder listing', async () => {
            const page1Objects = [{ Key: 'docs/file1.pdf', Size: 1000 }];
            const page2Objects = [{ Key: 'docs/file2.pdf', Size: 2000 }];

            S3Client.prototype.send
                .mockImplementationOnce(() => Promise.resolve({
                    Contents: page1Objects,
                    NextContinuationToken: 'token1'
                }))
                .mockImplementationOnce(() => Promise.resolve({
                    Contents: page2Objects,
                    NextContinuationToken: undefined
                }));

            getSignedUrl
                .mockResolvedValueOnce('https://signed.url/file1.pdf')
                .mockResolvedValueOnce('https://signed.url/file2.pdf');

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await listFolderFiles({ folderPrefix: 'docs/' });

            expect(ListObjectsV2Command).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(2);
            expect(result[0].signedUrl).toBe('https://signed.url/file1.pdf');
            expect(result[1].signedUrl).toBe('https://signed.url/file2.pdf');
            expect(consoleSpy).toHaveBeenCalledWith('Total objects found: 2');
            consoleSpy.mockRestore();
        });

        it('should handle errors in folder listing', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            S3Client.prototype.send.mockRejectedValue(new Error('Folder listing failed'));

            const result = await listFolderFiles({ folderPrefix: 'error-folder/' });

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error listing objects:',
                expect.any(Error)
            );
            expect(result).toBeUndefined();
            consoleSpy.mockRestore();
        });

        it('should handle errors when generating signed URLs for folder files', async () => {
            const mockObjects = [{ Key: 'folder/file.pdf', Size: 1000 }];

            S3Client.prototype.send.mockResolvedValue({
                Contents: mockObjects,
                NextContinuationToken: undefined
            });

            // Mock getFileFromS3 to throw error
            getSignedUrl.mockRejectedValue(new Error('Failed to generate signed URL'));

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await listFolderFiles({ folderPrefix: 'folder/' });

            // The function should still return the object, but without signedUrl
            expect(result).toHaveLength(1);
            expect(result[0].Key).toBe('folder/file.pdf');
            expect(result[0].signedUrl).toBeUndefined();
            consoleSpy.mockRestore();
        });
    });

    describe('Environment Variables', () => {
        it('should handle missing AWS_REGION', async () => {
            delete process.env.AWS_REGION;

            // This test ensures the module can handle undefined env vars
            // The S3Client will be created but may fail during actual operations
            expect(() => {
                const { generateSignedURL } = require('../../server/utils/awsS3Utils');
                return generateSignedURL;
            }).not.toThrow();
        });

        it('should handle missing AWS_BUCKET_NAME', async () => {
            delete process.env.AWS_BUCKET_NAME;

            expect(() => {
                const { generateSignedURL } = require('../../server/utils/awsS3Utils');
                return generateSignedURL;
            }).not.toThrow();
        });
    });
});