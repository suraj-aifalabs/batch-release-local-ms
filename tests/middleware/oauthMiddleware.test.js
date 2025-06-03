/* eslint-disable quotes */
/* eslint-disable no-undef */
/* eslint-env jest */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { validateOauthToken } = require("../../server/middlewares/oauthMiddleware.js");

jest.mock("jsonwebtoken");
jest.mock("jwks-rsa");

describe("validateOauthToken Middleware", () => {
    let app;

    beforeAll(async () => {
        app = express();
        app.use(express.json());


        const mockConfigs = {
            msalConfig: {
                auth: {
                    authority: "https://dummy.auth"
                }
            },
            tokenValidationConfig: {
                issuer: "https://dummy.issuer",
                audience: "dummyAudience"
            }
        };

        jest.spyOn(require("../../server/utils/msalConfig.js"), 'loadConfig').mockResolvedValue(mockConfigs);

        await require("../../server/middlewares/oauthMiddleware.js");

        app.use(validateOauthToken);
        app.get("/secure-endpoint", (req, res) => {
            res.status(200).json({ success: true, user: req.user });
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app).get("/secure-endpoint");

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            success: false,
            statusCode: 401,
            message: "No Token Found!",
        });
    });

    it('should return 401 if an invalid token is provided', async () => {
        const invalidToken = "Bearer invalidToken";

        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            callback(new Error("invalid token"), null);
        });

        const res = await request(app)
            .get("/secure-endpoint")
            .set("Authorization", invalidToken);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            success: false,
            statusCode: 401,
            message: "invalid token",
        });
    });

    it('should return 401 if the token is expired', async () => {
        const expiredToken = "Bearer expiredToken";

        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            callback(new Error("jwt expired"), null);
        });

        const res = await request(app)
            .get("/secure-endpoint")
            .set("Authorization", expiredToken);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            success: false,
            statusCode: 401,
            message: "Session Expired",
        });
    });

    it('should successfully validate the token and return user details', async () => {
        const validToken = "Bearer validToken";

        const decodedPayload = {
            name: "John Doe",
            preferred_username: "johndoe@example.com",
            oid: "user-oid",
            roles: ["user", "admin"]
        };

        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            callback(null, decodedPayload);
        });

        const res = await request(app)
            .get("/secure-endpoint")
            .set("Authorization", validToken);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            success: true,
            user: {
                name: "John Doe",
                email: "johndoe@example.com",
                userId: "user-oid",
                username: "johndoe",
                roles: ["user", "admin"]
            },
        });
    });

    it('should return 200 if configuration loading fails', async () => {
        const invalidLoadConfigMock = jest.spyOn(require("../../server/utils/msalConfig.js"), 'loadConfig');
        invalidLoadConfigMock.mockRejectedValue(new Error("Configuration error"));

        const invalidRes = await request(app)
            .get("/secure-endpoint")
            .set("Authorization", "Bearer validToken");

        expect(invalidRes.statusCode).toBe(200);
        expect(invalidRes.body).toEqual({
            success: true,
            user: {
                email: "johndoe@example.com",
                name: "John Doe",
                roles: ["user",
                    "admin"],
                userId: "user-oid",
                username: "johndoe",
            },
        });
    });
});
