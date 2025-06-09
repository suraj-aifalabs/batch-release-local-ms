/* eslint-disable no-undef */

/* eslint-env jest */
const { Sequelize } = require("sequelize");

jest.mock("../../server/models/batchDocumentModel", () => jest.fn(() => ({ name: "batchDocumentModelMock" })));

const { dbConnection, db } = require("../../server/config/db");

jest.mock("sequelize");

describe("dbConnection", () => {
    let authenticateMock;
    let syncMock;

    beforeEach(() => {

        authenticateMock = jest.fn().mockResolvedValue();

        syncMock = jest.fn().mockResolvedValue();

        Sequelize.mockImplementation(() => ({
            authenticate: authenticateMock,
            sync: syncMock,
        }));

        // Reset db object keys before each test
        Object.keys(db).forEach(key => delete db[key]);
    });

    it("should handle connection errors gracefully", async () => {
        authenticateMock.mockRejectedValue(new Error("Connection failed"));
        console.error = jest.fn();

        const result = await dbConnection();

        expect(console.error).toHaveBeenCalledWith(
            "Unable to connect to the database:",

            expect.any(Error)
        );
        expect(result).toBeUndefined();
    });
});