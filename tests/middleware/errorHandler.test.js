/* eslint-disable no-undef */
const request = require("supertest");
const express = require("express");
const errorHandler = require("../../server/middlewares/errorHandler"); // Update path accordingly

describe("Error Handler Middleware", () => {
    let app;

    beforeEach(() => {
        app = express();

        app.get("/custom-error", (req, res, next) => {
            const error = new Error("Custom error occurred");
            error.statusCode = 400;
            next(error);
        });

        app.get("/default-error", (req, res, next) => {
            next(new Error());
        });

        app.use(errorHandler);
    });

    it("should return custom error response with provided status and message", async () => {
        const res = await request(app).get("/custom-error");

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: "Custom error occurred",
        });
    });

    it("should return default error response when no statusCode or message is set", async () => {
        const res = await request(app).get("/default-error");

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            success: false,
            message: "Internal Error",
        });
    });

    it("should call next after handling the error", (done) => {
        const mockNext = jest.fn();
        const err = new Error("Test error");
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(() => {
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.json).toHaveBeenCalledWith({
                    success: false,
                    message: "Test error",
                });
                expect(mockNext).toHaveBeenCalled();
                done();
            }),
        };

        errorHandler(err, req, res, mockNext);
    });
});
