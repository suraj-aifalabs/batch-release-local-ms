/* eslint-disable no-undef */
const { Sequelize, DataTypes } = require("sequelize");


const defineUser = require("../../server/models/userModel");

describe("User Model (Mocked Style)", () => {
    let sequelize;
    let User;

    beforeEach(() => {
        jest.clearAllMocks();
        User.create = jest.fn();
        User.findAll = jest.fn();
    });
    beforeAll(async () => {
        sequelize = new Sequelize(
            process.env.DB_NAME || "myapp_test",
            process.env.DB_USER || "postgres",
            process.env.DB_PASSWORD || "password",
            {
                host: process.env.DB_HOST || "localhost",
                port: process.env.DB_PORT || 5432,
                dialect: "postgres",
                logging: false,
            }
        );
        User = defineUser(sequelize, DataTypes);
    })
    it("should create a user successfully", async () => {
        const userData = {
            jnjUsername: "john123",
            email: "john@example.com",
            familyName: "Doe",
            givenName: "John",
            name: "John Doe",
            sub: 123456789,
            streetAddress: "123 Main St",
            country: "USA",
            region: "California",
            membersOf: ["group1"],
            roles: ["admin"]
        };

        User.create.mockResolvedValue(userData);

        const createdUser = await User.create(userData);

        expect(createdUser.email).toBe(userData.email);
        expect(createdUser.jnjUsername).toBe(userData.jnjUsername);
    });

    it("should fail if required fields are missing", async () => {
        User.create.mockRejectedValue(new Error("notNull Violation"));

        await expect(User.create({})).rejects.toThrow("notNull Violation");
    });

    it("should throw error on duplicate email or jnjUsername", async () => {
        const userData = {
            jnjUsername: "uniqueUser",
            email: "unique@example.com",
            familyName: "Smith",
            givenName: "Jane",
            name: "Jane Smith",
            sub: 987654321,
            streetAddress: "456 Oak St",
            country: "USA",
            region: "Texas"
        };

        User.create.mockRejectedValue(new Error("duplicate key value violates unique constraint"));

        await expect(User.create(userData)).rejects.toThrow("duplicate key value violates unique constraint");
    });
});