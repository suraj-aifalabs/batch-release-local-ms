/* eslint-disable quotes */
/* eslint-disable no-undef */
const { Sequelize, DataTypes } = require("sequelize");
const { dbConnection, db } = require("../server/config/db"); // Adjust path as needed

// Mock Sequelize
jest.mock("sequelize", () => {
    const mockSequelize = {
        authenticate: jest.fn(),
        sync: jest.fn(),
        define: jest.fn(),
        close: jest.fn()
    };

    const SequelizeConstructor = jest.fn(() => mockSequelize);

    // Add static properties/methods
    SequelizeConstructor.DataTypes = {
        STRING: 'STRING',
        INTEGER: 'INTEGER',
        BOOLEAN: 'BOOLEAN',
        DATE: 'DATE'
    };

    return {
        Sequelize: SequelizeConstructor,
        DataTypes: SequelizeConstructor.DataTypes
    };
});

// Mock the user model
jest.mock("../server/models/userModel", () => {
    return jest.fn(() => ({
        findAll: jest.fn(),
        create: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn()
    }));
});

const mockUserModel = require("../server/models/userModel");

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe("Database Configuration Tests", () => {
    let mockSequelizeInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        // Get the mocked Sequelize instance
        mockSequelizeInstance = new Sequelize();

        // Mock console methods
        console.log = jest.fn();
        console.error = jest.fn();

        // Reset environment variables
        delete process.env.DB_URL;
        delete process.env.NODE_ENV;
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    describe("dbConnection function", () => {
        test("should establish database connection successfully", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            process.env.NODE_ENV = "development";

            //mockSequelizeInstance.authenticate.mockResolvedValue();
            mockUserModel.mockReturnValue({
                findAll: jest.fn(),
                create: jest.fn()
            });

            // Execute
            const result = await dbConnection();

            // Assertions
            expect(Sequelize).toHaveBeenCalledWith(
                "postgresql://user:password@localhost:5432/testdb",
                expect.objectContaining({
                    dialect: "postgres",
                    protocol: "postgres",
                    dialectOptions: {
                        ssl: {
                            require: true,
                            rejectUnauthorized: false
                        }
                    },
                    logging: console.log,
                    pool: {
                        max: 5,
                        min: 0,
                        acquire: 30000,
                        idle: 10000,
                    }
                })
            );

            expect(mockSequelizeInstance.authenticate).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(
                "Database connection has been established successfully."
            );
            expect(result).toHaveProperty('db');
            expect(result).toHaveProperty('sequelize');
            expect(result.db.Sequelize).toBe(Sequelize);
            expect(result.db.sequelize).toBe(mockSequelizeInstance);
        });

        test("should use empty string as default DB_URL when not provided", async () => {
            // Setup - Don't set DB_URL
            //mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            await dbConnection();

            // Assertions
            expect(Sequelize).toHaveBeenCalledWith(
                "",
                expect.any(Object)
            );
        });

        test("should disable logging in production environment", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            process.env.NODE_ENV = "production";

            //mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            await dbConnection();

            // Assertions
            expect(Sequelize).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    logging: false
                })
            );
        });

        test("should enable logging in development environment", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            process.env.NODE_ENV = "development";

            //mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            await dbConnection();

            // Assertions
            expect(Sequelize).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    logging: console.log
                })
            );
        });

        test("should handle authentication failure", async () => {
            // Setup
            const authError = new Error("Connection refused");
            //mockSequelizeInstance.authenticate.mockRejectedValue(authError);

            // Execute
            const result = await dbConnection();

            // Assertions
            expect(console.error).toHaveBeenCalledWith(
                "Unable to connect to the database:",
                authError
            );
            expect(result).toBeUndefined();
        });

        test("should configure SSL options correctly", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            // mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            await dbConnection();

            // Assertions
            expect(Sequelize).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    dialectOptions: {
                        ssl: {
                            require: true,
                            rejectUnauthorized: false
                        }
                    }
                })
            );
        });

        test("should configure connection pool correctly", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            //mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            await dbConnection();

            // Assertions
            expect(Sequelize).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    pool: {
                        max: 5,
                        min: 0,
                        acquire: 30000,
                        idle: 10000,
                    }
                })
            );
        });

        test("should initialize user model correctly", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            //mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            const result = await dbConnection();

            // Assertions
            expect(mockUserModel).toHaveBeenCalledWith(
                mockSequelizeInstance,
                DataTypes
            );
            expect(result.db.users).toBeDefined();
        });

        test("should handle model initialization error", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            //  mockSequelizeInstance.authenticate.mockResolvedValue();
            mockUserModel.mockImplementation(() => {
                throw new Error("Model initialization failed");
            });

            // Execute
            const result = await dbConnection();

            // Assertions
            expect(console.error).toHaveBeenCalledWith(
                "Unable to connect to the database:",
                expect.any(Error)
            );
            expect(result).toBeUndefined();
        });
    });

    describe("db object", () => {
        test("should initially be an empty object", () => {
            expect(db).toEqual({});
        });

        test("should be populated after successful connection", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            //  mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            await dbConnection();

            // Assertions
            expect(db.Sequelize).toBe(Sequelize);
            expect(db.sequelize).toBe(mockSequelizeInstance);
            expect(db.users).toBeDefined();
        });
    });

    describe("Error scenarios", () => {
        test("should handle Sequelize constructor error", async () => {
            // Setup
            const constructorError = new Error("Invalid connection string");
            Sequelize.mockImplementation(() => {
                throw constructorError;
            });

            // Execute
            const result = await dbConnection();

            // Assertions
            expect(console.error).toHaveBeenCalledWith(
                "Unable to connect to the database:",
                constructorError
            );
            expect(result).toBeUndefined();
        });

        test("should handle network timeout errors", async () => {
            // Setup
            const timeoutError = new Error("Connection timeout");
            timeoutError.name = "SequelizeConnectionError";
            //   mockSequelizeInstance.authenticate.mockRejectedValue(timeoutError);

            // Execute
            const result = await dbConnection();

            // Assertions
            expect(console.error).toHaveBeenCalledWith(
                "Unable to connect to the database:",
                timeoutError
            );
            expect(result).toBeUndefined();
        });

        test("should handle SSL connection errors", async () => {
            // Setup
            const sslError = new Error("SSL connection failed");
            sslError.code = "UNABLE_TO_VERIFY_LEAF_SIGNATURE";
            //   mockSequelizeInstance.authenticate.mockRejectedValue(sslError);

            // Execute
            const result = await dbConnection();

            // Assertions
            expect(console.error).toHaveBeenCalledWith(
                "Unable to connect to the database:",
                sslError
            );
            expect(result).toBeUndefined();
        });
    });

    describe("Environment-specific configurations", () => {
        test("should handle undefined NODE_ENV", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            // NODE_ENV is already undefined from beforeEach
            //  mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            await dbConnection();

            // Assertions
            expect(Sequelize).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    logging: false // Should default to false when NODE_ENV is not 'development'
                })
            );
        });

        test("should handle test environment", async () => {
            // Setup
            process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
            process.env.NODE_ENV = "test";
            //  mockSequelizeInstance.authenticate.mockResolvedValue();

            // Execute
            await dbConnection();

            // Assertions
            expect(Sequelize).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    logging: false
                })
            );
        });
    });

    describe("Module exports", () => {
        test("should export dbConnection function", () => {
            expect(typeof dbConnection).toBe('function');
        });

        test("should export db object", () => {
            expect(typeof db).toBe('object');
        });
    });
});

// Integration tests (these would run against a real test database)
describe("Database Integration Tests", () => {
    // These tests would be skipped in unit test runs and only run in integration test environment
    const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

    beforeEach(() => {
        if (!runIntegrationTests) {
            test.skip('Integration tests skipped - set RUN_INTEGRATION_TESTS=true to enable');
        }
    });

    test("should connect to real database", async () => {
        if (!runIntegrationTests) return;

        // Setup real test database URL
        process.env.DB_URL = process.env.TEST_DB_URL || "postgresql://test:test@localhost:5432/testdb";

        // This would test against a real database
        // const result = await dbConnection();
        // expect(result).toBeDefined();
        // expect(result.sequelize).toBeDefined();

        // Clean up
        // await result.sequelize.close();
    });
});

// Performance tests
describe("Database Performance Tests", () => {
    test("should establish connection within reasonable time", async () => {
        // Setup
        process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
        // mockSequelizeInstance.authenticate.mockResolvedValue();

        // Execute with timing
        const startTime = Date.now();
        await dbConnection();
        const endTime = Date.now();

        // Assertions
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle multiple connection attempts", async () => {
        // Setup
        process.env.DB_URL = "postgresql://user:password@localhost:5432/testdb";
        //  mockSequelizeInstance.authenticate.mockResolvedValue();

        // Execute multiple connections
        const promises = Array(5).fill().map(() => dbConnection());
        const results = await Promise.all(promises);

        // Assertions
        results.forEach(result => {
            expect(result).toBeDefined();
            expect(result.db).toBeDefined();
            expect(result.sequelize).toBeDefined();
        });
    });
});