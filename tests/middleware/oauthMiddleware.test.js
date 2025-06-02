/* eslint-disable no-undef */


/* eslint-env jest */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

jest.mock("jsonwebtoken");
jest.mock("jwks-rsa");

const mockLoadConfig = jest.fn();
jest.mock("../../server/utils/msalConfig.js", () => ({
    loadConfig: mockLoadConfig
}));

const { db } = require("../../server/config/db");
jest.mock("../../server/models/userSessionModel");

db.user_sessions = {
    findOne: jest.fn(),
};

mockLoadConfig.mockResolvedValue({
    msalConfig: {
        auth: {
            authority: "https://login.microsoftonline.com/tenant-id"
        }
    },
    tokenValidationConfig: {
        issuer: "https://login.microsoftonline.com/tenant-id/v2.0",
        audience: "api://test-app"
    }
});

const { validateOauthToken } = require("../../server/middlewares/oauthMiddleware.js");

describe("validateOauthToken Middleware", () => {
    let app;
    let consoleLogSpy;
    let mockClient;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use(validateOauthToken);

        app.get("/secure-endpoint", (req, res) => {
            res.status(200).json({
                success: true,
                user: req.user,
                isActiveSession: req.isActiveSession
            });
        });

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        mockClient = {
            getSigningKey: jest.fn()
        };
        jwksClient.mockReturnValue(mockClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.MOCK_ROLE;
    });

    afterAll(() => {
        consoleLogSpy.mockRestore();
    });

    describe("Authorization header validation", () => {
        it("should return 401 if Authorization header is missing", async () => {
            const res = await request(app).get("/secure-endpoint");

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({
                success: false,
                statusCode: 401,
                message: "No Token Found!",
            });
        });

        it("should return 401 if Authorization header doesn't start with Bearer", async () => {
            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Basic sometoken");

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({
                success: false,
                statusCode: 401,
                message: "No Token Found!",
            });
        });

        it("should return 401 if Authorization header is empty", async () => {
            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "");

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({
                success: false,
                statusCode: 401,
                message: "No Token Found!",
            });
        });
    });

    describe("JWT verification", () => {
        it("should return 401 if JWT is expired", async () => {
            const token = "expired.token.value";

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback({ message: "jwt expired" }, null)
            );

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", `Bearer ${token}`)
                .set("bid", "123");

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({
                success: false,
                statusCode: 401,
                message: "Session Expired",
            });
        });

        it("should return 401 with custom error message for other JWT errors", async () => {
            const token = "invalid.token.value";

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback({ message: "invalid signature" }, null)
            );

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", `Bearer ${token}`)
                .set("bid", "123");

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({
                success: false,
                statusCode: 401,
                message: "invalid signature",
            });
        });

        it("should handle JWT error without message property", async () => {
            const token = "invalid.token.value";

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback({ error: "some error" }, null)
            );

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", `Bearer ${token}`)
                .set("bid", "123");

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({
                success: false,
                statusCode: 401,
                message: undefined,
            });
        });
    });

    describe("Successful token validation", () => {
        it("should attach user and call next on valid token with active session", async () => {
            const decoded = {
                name: "John Doe [EXT]",
                preferred_username: "john@example.com",
                oid: "user-123",
                roles: ["user"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockResolvedValue({
                id: 1,
                username: "john",
                bid: "bid123",
                is_active: true,
            });

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(res.body.user).toEqual({
                name: "John Doe",
                email: "john@example.com",
                userId: "user-123",
                username: "john",
                roles: ["user"],
            });
            expect(res.body.isActiveSession).toBe(true);
        });

        it("should handle user with no active session", async () => {
            const decoded = {
                name: "Jane Doe",
                preferred_username: "jane@example.com",
                oid: "user-456",
                roles: ["admin"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(res.body.isActiveSession).toBe(false);
        });

        it("should use MOCK_ROLE when environment variable is set", async () => {
            process.env.MOCK_ROLE = "test-role";

            const decoded = {
                name: "Test User",
                preferred_username: "test@example.com",
                oid: "user-test",
                roles: ["original-role"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(res.body.user.roles).toEqual(["test-role"]);
        });

        it("should handle missing bid header", async () => {
            const decoded = {
                name: "No Bid User",
                preferred_username: "nobid@example.com",
                oid: "user-nobid",
                roles: ["user"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken");

            expect(res.statusCode).toBe(200);
            expect(db.user_sessions.findOne).toHaveBeenCalledWith({
                where: {
                    username: "nobid",
                    bid: "",
                    is_active: true
                }
            });
        });

        it("should handle decoded token with missing properties", async () => {
            const decoded = {
                // Missing name, preferred_username, oid, roles
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(res.body.user).toEqual({
                name: "",
                email: "",
                userId: "",
                username: "",
                roles: [],
            });
        });

        it("should handle username extraction from email", async () => {
            const decoded = {
                name: "Complex Name [EXT] [SOMETHING]",
                preferred_username: "complex.user+test@domain.com",
                oid: "user-complex",
                roles: ["user"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(res.body.user).toEqual({
                name: "Complex Name",
                email: "complex.user+test@domain.com",
                userId: "user-complex",
                username: "complex.user+test",
                roles: ["user"],
            });
        });

        it("should handle empty string MOCK_ROLE", async () => {
            process.env.MOCK_ROLE = "";

            const decoded = {
                name: "Test User",
                preferred_username: "test@example.com",
                oid: "user-test",
                roles: ["original-role"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(res.body.user.roles).toEqual(["original-role"]);
        });
    });

    describe("Database error handling", () => {
        it("should fallback gracefully if DB check fails", async () => {
            const decoded = {
                name: "Jane Doe",
                preferred_username: "jane@example.com",
                oid: "user-456",
                roles: ["admin"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockRejectedValue(new Error("DB error"));

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(res.body.isActiveSession).toBeUndefined();
            expect(consoleLogSpy).toHaveBeenCalledWith("error", expect.any(Error));
        });
    });

    describe("getKey function integration", () => {
        it("should successfully get signing key", async () => {
            const mockKey = {
                getPublicKey: jest.fn().mockReturnValue("mock-public-key")
            };

            mockClient.getSigningKey.mockImplementation((kid, callback) => {
                callback(null, mockKey);
            });

            const decoded = {
                name: "Test User",
                preferred_username: "test@example.com",
                oid: "user-test",
                roles: ["user"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) => {
                // Simulate the getKey function being called
                getKey({ kid: "test-kid" }, (err, key) => {
                    if (!err && key) {
                        callback(null, decoded);
                    } else {
                        callback(err || new Error("No key"), null);
                    }
                });
            });

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(jwksClient).toHaveBeenCalledWith({
                jwksUri: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys"
            });
        });

        it("should handle getSigningKey error", async () => {
            mockClient.getSigningKey.mockImplementation((kid, callback) => {
                callback(new Error("Key retrieval failed"), null);
            });

            jwt.verify.mockImplementation((token, getKey, options, callback) => {
                getKey({ kid: "test-kid" }, (err, key) => {
                    if (err) {
                        callback({ message: "Key error" }, null);
                    } else {
                        callback(null, {});
                    }
                });
            });

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe("Key error");
        });
    });

    describe("JWT verify options", () => {
        it("should call jwt.verify with correct options", async () => {
            const decoded = {
                name: "Test User",
                preferred_username: "test@example.com",
                oid: "user-test",
                roles: ["user"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) => {
                expect(options).toEqual({
                    algorithms: ["RS256"],
                    issuer: "https://login.microsoftonline.com/tenant-id/v2.0",
                    audience: "api://test-app"
                });
                callback(null, decoded);
            });

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(jwt.verify).toHaveBeenCalledWith(
                "validtoken",
                expect.any(Function),
                {
                    algorithms: ["RS256"],
                    issuer: "https://login.microsoftonline.com/tenant-id/v2.0",
                    audience: "api://test-app"
                },
                expect.any(Function)
            );
        });
    });

    describe("Configuration loading", () => {
        it("should handle successful configuration loading", async () => {
            // This test verifies that the configuration was loaded successfully
            // by checking that a valid request works
            const decoded = {
                name: "Config Test User",
                preferred_username: "config@example.com",
                oid: "user-config",
                roles: ["user"],
            };

            jwt.verify.mockImplementation((token, getKey, options, callback) =>
                callback(null, decoded)
            );

            db.user_sessions.findOne.mockResolvedValue(null);

            const res = await request(app)
                .get("/secure-endpoint")
                .set("Authorization", "Bearer validtoken")
                .set("bid", "bid123");

            expect(res.statusCode).toBe(200);
            expect(mockLoadConfig).toHaveBeenCalled();
        });
    });
});