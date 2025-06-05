/* eslint-disable no-undef */
/* eslint-disable quotes */
const { postRequest } = require('../../server/services/batchService');
const axios = require('axios');
const envUtils = require('../../server/utils/envUtils');

// Mock axios and envUtils
jest.mock('axios');
jest.mock('../../server/utils/envUtils', () => ({
    getApiUsername: jest.fn(),
    getApiPassword: jest.fn()
}));

describe('postRequest utility', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            CART_SERVICE_ENDPOINT: 'https://api.example.com',
            SERVICE_API_USERNAME: 'env_username',
            SERVICE_API_PASSWORD: 'env_password'
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should make a POST request with environment credentials', async () => {
        const mockResponse = { data: { success: true } };
        axios.post.mockResolvedValue(mockResponse);

        const result = await postRequest('test-endpoint', { key: 'value' });

        expect(axios.post).toHaveBeenCalledWith(
            'https://api.example.com/test-endpoint',
            { key: 'value' },
            {
                auth: {
                    username: 'env_username',
                    password: 'env_password'
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        expect(result).toEqual(mockResponse.data);
    });

    it('should use getApiUsername/getApiPassword when env vars not set', async () => {
        delete process.env.SERVICE_API_USERNAME;
        delete process.env.SERVICE_API_PASSWORD;
        envUtils.getApiUsername.mockResolvedValue('function_username');
        envUtils.getApiPassword.mockResolvedValue('function_password');

        const mockResponse = { data: { success: true } };
        axios.post.mockResolvedValue(mockResponse);

        await postRequest('test-endpoint', { key: 'value' });

        expect(envUtils.getApiUsername).toHaveBeenCalled();
        expect(envUtils.getApiPassword).toHaveBeenCalled();
        expect(axios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Object),
            {
                auth: {
                    username: 'function_username',
                    password: 'function_password'
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    });

    it('should handle errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        const error = new Error('Network error');
        axios.post.mockRejectedValue(error);

        const result = await postRequest('test-endpoint', { key: 'value' });

        expect(consoleSpy).toHaveBeenCalledWith('Error in API request', error);
        expect(result).toBeUndefined();
        consoleSpy.mockRestore();
    });



    it('should properly construct URLs with different endpoints', async () => {
        axios.post.mockResolvedValue({ data: {} });

        // Test with empty URL
        await postRequest('', {});
        expect(axios.post).toHaveBeenCalledWith(
            'https://api.example.com/',
            expect.any(Object),
            expect.any(Object)
        );

        // Test with nested path
        await postRequest('path/to/resource', {});
        expect(axios.post).toHaveBeenCalledWith(
            'https://api.example.com/path/to/resource',
            expect.any(Object),
            expect.any(Object)
        );
    });
});