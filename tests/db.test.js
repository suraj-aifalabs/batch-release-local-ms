/* eslint-disable quotes */
/* eslint-disable no-undef */
const { dbConnection, db } = require('../server/config/db'); // Adjust path
const { Sequelize } = require('sequelize');

// Mock Sequelize and its methods
jest.mock('sequelize');

// Mock the model file
jest.mock('../server/models/batchDocumentModel', () => {
    return jest.fn(() => ({
        name: 'batch_documents',
        // Mock model methods if needed
    }));
});

describe('Database Connection Tests', () => {
    let mockSequelize;
    let mockAuthenticate;
    let mockSync;
    let consoleSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock console methods
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Create mock methods
        mockAuthenticate = jest.fn();
        mockSync = jest.fn();

        // Mock Sequelize constructor
        mockSequelize = {
            authenticate: mockAuthenticate,
            sync: mockSync
        };

        Sequelize.mockImplementation(() => mockSequelize);
    });

    afterEach(() => {
        // Restore console methods
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();

        // Clear environment variables
        delete process.env.DB_URL;
        delete process.env.NODE_ENV;
    });

    describe('Successful Database Connection', () => {
        test('should establish database connection successfully with valid DB_URL', async () => {
            // Arrange
            process.env.DB_URL = 'postgresql://user:password@localhost:5432/testdb';
            mockAuthenticate.mockResolvedValue();
            mockSync.mockResolvedValue();

            // Act
            const result = await dbConnection();

            // Assert
            expect(Sequelize).toHaveBeenCalledWith(
                'postgresql://user:password@localhost:5432/testdb',
                expect.objectContaining({
                    dialect: 'postgres',
                    protocol: 'postgres',
                    dialectOptions: {
                        ssl: {
                            require: true,
                            rejectUnauthorized: false
                        }
                    },
                    logging: false,
                    pool: {
                        max: 5,
                        min: 0,
                        acquire: 30000,
                        idle: 10000,
                    }
                })
            );

            expect(mockAuthenticate).toHaveBeenCalledTimes(1);
            expect(mockSync).toHaveBeenCalledWith({
                force: false,
                alter: true
            });
            expect(consoleSpy).toHaveBeenCalledWith('Database connection has been established successfully.');
            expect(result).toEqual({
                db: expect.objectContaining({
                    Sequelize: Sequelize,
                    sequelize: mockSequelize,
                    batch_documents: expect.any(Object)
                }),
                sequelize: mockSequelize
            });
        });

        test('should use empty string for DB_URL when not provided', async () => {
            // Arrange
            mockAuthenticate.mockResolvedValue();
            mockSync.mockResolvedValue();

            // Act
            await dbConnection();

            // Assert
            expect(Sequelize).toHaveBeenCalledWith(
                '',
                expect.any(Object)
            );
        });

        test('should enable logging in DEVELOPMENT environment', async () => {
            // Arrange
            process.env.NODE_ENV = 'DEVELOPMENT';
            process.env.DB_URL = 'postgresql://user:password@localhost:5432/testdb';
            mockAuthenticate.mockResolvedValue();
            mockSync.mockResolvedValue();

            // Act
            await dbConnection();

            // Assert
            expect(Sequelize).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    logging: console.log
                })
            );
        });

        test('should disable logging in non-DEVELOPMENT environment', async () => {
            // Arrange
            process.env.NODE_ENV = 'PRODUCTION';
            process.env.DB_URL = 'postgresql://user:password@localhost:5432/testdb';
            mockAuthenticate.mockResolvedValue();
            mockSync.mockResolvedValue();

            // Act
            await dbConnection();

            // Assert
            expect(Sequelize).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    logging: false
                })
            );
        });
    });

    describe('Database Connection Errors', () => {
        test('should handle authentication failure', async () => {
            // Arrange
            const authError = new Error('Authentication failed');
            mockAuthenticate.mockRejectedValue(authError);

            // Act
            const result = await dbConnection();

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to connect to the database:', authError);
            expect(mockSync).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        test('should handle sync failure', async () => {
            // Arrange
            const syncError = new Error('Sync failed');
            mockAuthenticate.mockResolvedValue();
            mockSync.mockRejectedValue(syncError);

            // Act
            const result = await dbConnection();

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to connect to the database:', syncError);
            expect(result).toBeUndefined();
        });

        test('should handle Sequelize constructor failure', async () => {
            // Arrange
            const constructorError = new Error('Invalid connection string');
            Sequelize.mockImplementation(() => {
                throw constructorError;
            });

            // Act
            const result = await dbConnection();

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to connect to the database:', constructorError);
            expect(result).toBeUndefined();
        });
    });

    describe('Configuration Tests', () => {
        test('should set correct Sequelize configuration options', async () => {
            // Arrange
            process.env.DB_URL = 'postgresql://user:password@localhost:5432/testdb';
            mockAuthenticate.mockResolvedValue();
            mockSync.mockResolvedValue();

            // Act
            await dbConnection();

            // Assert
            const expectedConfig = {
                dialect: 'postgres',
                protocol: 'postgres',
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                },
                logging: false,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                }
            };

            expect(Sequelize).toHaveBeenCalledWith(
                'postgresql://user:password@localhost:5432/testdb',
                expectedConfig
            );
        });

        test('should call sync with correct options', async () => {
            // Arrange
            mockAuthenticate.mockResolvedValue();
            mockSync.mockResolvedValue();

            // Act
            await dbConnection();

            // Assert
            expect(mockSync).toHaveBeenCalledWith({
                force: false,
                alter: true
            });
        });
    });

    describe('Model Loading Tests', () => {
        test('should load batch_documents model', async () => {
            // Arrange
            const mockModel = jest.fn(() => ({ name: 'batch_documents' }));
            jest.doMock('../server/models/batchDocumentModel', () => mockModel);

            mockAuthenticate.mockResolvedValue();
            mockSync.mockResolvedValue();

            // Act
            const result = await dbConnection();

            // Assert
            expect(result.db.batch_documents).toBeDefined();
        });
    });

    describe('Global db Object Tests', () => {
        test('should populate global db object correctly', async () => {
            // Arrange
            mockAuthenticate.mockResolvedValue();
            mockSync.mockResolvedValue();

            // Act
            const result = await dbConnection();

            // Assert
            expect(result.db.Sequelize).toBe(Sequelize);
            expect(result.db.sequelize).toBe(mockSequelize);
            expect(result.db.batch_documents).toBeDefined();
        });
    });
});

// Integration Test Example (requires actual database)
describe('Database Connection Integration Tests', () => {
    // These tests should be run against a test database
    // and might be skipped in regular unit test runs

    test.skip('should connect to real test database', async () => {
        // This test would require a real database connection
        // Set up test database URL
        process.env.DB_URL = 'postgresql://testuser:testpass@localhost:5432/testdb';

        const result = await dbConnection();

        expect(result).toBeDefined();
        expect(result.sequelize).toBeDefined();

        // Clean up
        await result.sequelize.close();
    });
});

// Performance Tests
describe('Database Connection Performance Tests', () => {
    test('should complete connection within reasonable time', async () => {
        // Arrange
        const startTime = Date.now();
        mockAuthenticate = jest.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(resolve, 100))
        );
        mockSync = jest.fn().mockResolvedValue();
        // mockSequelize.authenticate = mockAuthenticate;
        //  mockSequelize.sync = mockSync;

        // Act
        await dbConnection();
        const endTime = Date.now();

        // Assert
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
});

