/* eslint-disable no-undef */
/* eslint-env jest */
const { Sequelize, DataTypes } = require("sequelize");

jest.mock("../../server/models/batchDocumentModel", () =>
    jest.fn(() => ({ name: "batchDocumentModelMock" }))
);

const { dbConnection, db } = require("../../server/config/db");

jest.mock("sequelize");

describe("dbConnection", () => {
    let authenticateMock;
    let syncMock;
    let sequelizeInstance;

    beforeEach(() => {
        authenticateMock = jest.fn().mockResolvedValue();
        syncMock = jest.fn().mockResolvedValue();

        sequelizeInstance = {
            authenticate: authenticateMock,
            sync: syncMock,
        };

        Sequelize.mockImplementation(() => sequelizeInstance);

        // Clear db object before each test
        Object.keys(db).forEach(key => delete db[key]);
    });

    it("should connect to database and load models", async () => {
        process.env.DB_URL = "postgres://testuser:testpass@localhost:5432/testdb";
        process.env.NODE_ENV = "PRODUCTION";

        const result = await dbConnection();

        expect(Sequelize).toHaveBeenCalledWith(expect.stringContaining("postgres://"), expect.objectContaining({
            dialect: "postgres",
            protocol: "postgres",
            dialectOptions: expect.any(Object),
            logging: false,
            pool: expect.objectContaining({
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }),
        }));

        expect(authenticateMock).toHaveBeenCalled();
        expect(syncMock).toHaveBeenCalledWith({ force: false, alter: true });

        expect(result).toHaveProperty("db");
        expect(result).toHaveProperty("sequelize");

        expect(db).toHaveProperty("Sequelize");
        expect(db).toHaveProperty("sequelize");
        expect(db).toHaveProperty("batch_documents");
        expect(db.batch_documents.name).toBe("batchDocumentModelMock");
    });

    it("should enable logging when NODE_ENV is DEVELOPMENT", async () => {
        process.env.DB_URL = "postgres://testuser:testpass@localhost:5432/testdb";
        process.env.NODE_ENV = "DEVELOPMENT";

        await dbConnection();

        expect(Sequelize).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            logging: expect.any(Function) // console.log
        }));
    });

    it("should handle connection errors gracefully", async () => {
        authenticateMock.mockRejectedValue(new Error("Connection failed"));
        console.error = jest.fn();
        process.env.DB_URL = "postgres://failurl";

        const result = await dbConnection();

        expect(console.error).toHaveBeenCalledWith(
            "Unable to connect to the database:",
            expect.any(Error)
        );
        expect(result).toBeUndefined();
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.DB_URL;
        delete process.env.NODE_ENV;
    });
});
