/* eslint-disable no-undef */
/* eslint-disable quotes */
const express = require('express');
const request = require('supertest');
const healthCheckRoutes = require('../../server/routes/healthRoutes');

describe('Health Check Controllers', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use('/', healthCheckRoutes);
    });

    describe('GET /health', () => {
        it('should return service health status', async () => {
            const res = await request(app).get('/health');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Service is healthy');
            expect(res.body).toHaveProperty('uptime');
            expect(res.body.uptime).toMatch(/ sec$/);
        });
    });

    describe('GET /ready', () => {
        it('should return application readiness status with environment', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'test';

            const res = await request(app).get('/ready');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Application is ready');
            expect(res.body).toHaveProperty('environment', 'test');

            process.env.NODE_ENV = originalEnv;
        });

        it('should handle missing NODE_ENV', async () => {
            const originalEnv = process.env.NODE_ENV;
            delete process.env.NODE_ENV;

            const res = await request(app).get('/ready');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('environment', '');

            if (originalEnv !== undefined) {
                process.env.NODE_ENV = originalEnv;
            }
        });
    });

    describe('GET /server', () => {
        it('should return server status with environment and allowed origin', async () => {
            const originalEnv = process.env.NODE_ENV;
            const originalOrigin = process.env.ALLOWED_ORIGIN;
            process.env.NODE_ENV = 'test';
            process.env.ALLOWED_ORIGIN = 'http://example.com';

            const res = await request(app).get('/');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Application is running');
            expect(res.body).toHaveProperty('environment', 'test');
            expect(res.body).toHaveProperty('allowedOrigin', 'http://example.com');

            process.env.NODE_ENV = originalEnv;
            if (originalOrigin !== undefined) {
                process.env.ALLOWED_ORIGIN = originalOrigin;
            } else {
                delete process.env.ALLOWED_ORIGIN;
            }
        });

        it('should handle missing environment variables', async () => {
            const originalEnv = process.env.NODE_ENV;
            const originalOrigin = process.env.ALLOWED_ORIGIN;
            delete process.env.NODE_ENV;
            delete process.env.ALLOWED_ORIGIN;

            const res = await request(app).get('/');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('environment', '');
            expect(res.body).toHaveProperty('allowedOrigin', '');

            // Restore original environment variables
            if (originalEnv !== undefined) {
                process.env.NODE_ENV = originalEnv;
            }
            if (originalOrigin !== undefined) {
                process.env.ALLOWED_ORIGIN = originalOrigin;
            }
        });
    });
});