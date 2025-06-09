/* eslint-disable no-undef */
/* eslint-disable quotes */
/* eslint-env jest */

const request = require("supertest");
const express = require("express");


describe("Error Handler Middleware", () => {
    let app;


    beforeAll(() => {
        app = express();

        app.get("/error", (req, res, next) => {
            const error = new Error('Something went wrong!');
            error.statusCode = 400;
            next(error);
        });

    });

    it('should return proper error response', async () => {
        const res = await request(app).get('/error');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({});
    });

});