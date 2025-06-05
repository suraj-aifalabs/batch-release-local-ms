/* eslint-disable no-undef */
/* eslint-disable quotes */
const express = require('express');
const request = require('supertest');
const healthRoutes = require('../../server/routes/healthRoutes');

// Mock controller responses
jest.mock('../../server/controllers/healthCheckController', () => ({
    healthCheck: (req, res) => res.status(200).json({ status: 'ok', check: 'health' }),
    readyCheck: (req, res) => res.status(200).json({ status: 'ok', check: 'ready' }),
    serverCheck: (req, res) => res.status(200).json({ status: 'ok', check: 'server' }),
}));

describe('Health Check Routes', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use('/', healthRoutes);
    });

    it('GET /health should return 200 and health status', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'ok', check: 'health' });
    });

    it('GET /ready should return 200 and ready status', async () => {
        const res = await request(app).get('/ready');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'ok', check: 'ready' });
    });

    it('GET / should return 200 and server status', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'ok', check: 'server' });
    });
});