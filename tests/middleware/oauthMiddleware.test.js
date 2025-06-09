/* eslint-disable quotes */
/* eslint-disable no-undef */
/* eslint-env jest */

const request = require("supertest");
const express = require("express");
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

});
