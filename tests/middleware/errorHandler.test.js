/* eslint-disable no-undef */
/* eslint-disable quotes */
/* eslint-env jest */

const request = require("supertest");
const express = require("express");
const errorHandler = require("../../server/middlewares/ErrorHandler");

// eslint-disable-next-line no-undef
describe("Error Handler Middleware", () => {
    let app;

    // eslint-disable-next-line no-undef
    beforeAll(() => {
        app = express();

        app.get("/error", (req, res, next) => {
            const error = new Error('Something went wrong!');
            error.statusCode = 400;
            next(error);
        });

        app.use(errorHandler);
    });

    it('should return proper error response', async () => {
        const res = await request(app).get('/error');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: 'Something went wrong!',
        });
    });

});