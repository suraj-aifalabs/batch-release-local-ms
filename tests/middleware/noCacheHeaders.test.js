/* eslint-disable no-undef */
/* eslint-disable quotes */
/* eslint-env jest */

const request = require("supertest");
const express = require("express");
const { noCacheHeaders } = require("../../server/middlewares/noCacheHeaders");

describe("No Cache Headers Middleware", () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(noCacheHeaders);

        app.get("/test-endpoint", (req, res) => {
            res.status(200).json({ success: true });
        });
    });

    it('should set correct no-cache headers', async () => {
        const res = await request(app).get("/test-endpoint");

        expect(res.headers['cache-control']).toBe("no-store, no-cache, must-revalidate, proxy-revalidate");
        expect(res.headers['pragma']).toBe("no-cache");
        expect(res.headers['expires']).toBe("0");
        expect(res.headers['surrogate-control']).toBe("no-store");
    });

    it('should allow requests to proceed to the next middleware', async () => {
        const res = await request(app).get("/test-endpoint");

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ success: true });
    });
});
