/* eslint-disable no-undef */
/* eslint-disable quotes */
const { describe, test, expect } = require("@jest/globals");
const request = require('supertest');
const express = require('express');
const app = express();
const { readyCheck, serverCheck, healthCheck } = require("../../server/controllers/healthCheckController")
app.get('/ready', readyCheck);

describe('GET /ready-check', () => {
    it('should return readiness message with EST time and environment', async () => {
        const response = await request(app).get('/ready');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Platform Application is ready');
        expect(response.body).toHaveProperty('time');
        expect(response.body).toHaveProperty('timezone', 'America/New_York');
        expect(response.body).toHaveProperty('environment');

        const estTime = new Date(response.body.time);
        expect(estTime.toString()).not.toBe('Invalid Date');
    });
});

app.get('/', serverCheck);

describe('GET /', () => {
    it('should return platform running status with metadata', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Platform Application is running');
        expect(response.body).toHaveProperty('time');
        expect(response.body).toHaveProperty('timezone', 'America/New_York');
        expect(response.body).toHaveProperty('environment');
        expect(response.body).toHaveProperty('allowedOrigin');

        expect(typeof response.body.time).toBe('string');
    });
});

app.get('/health', healthCheck);
describe('GET /health', () => {
    it('should return health status with meta data', async () => {
        const response = await request(app).get('/health')
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'time', 'timezone', 'uptime');
    })
})