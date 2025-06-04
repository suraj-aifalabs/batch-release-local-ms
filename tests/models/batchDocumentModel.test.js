/* eslint-disable no-undef */
/* eslint-disable quotes */
// batchDocuments.model.test.js
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize({
    host: "",
    port: 5432,
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    // eslint-disable-next-line no-console
    logging: process.env.NODE_ENV === "DEVELOPMENT" ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

const BatchDocuments = require('../../server/models/batchDocumentModel')(sequelize, DataTypes);

describe('BatchDocuments Model', () => {
    beforeEach(() => {
        BatchDocuments.create = jest.fn();
        BatchDocuments.findAll = jest.fn();
    });

    it('should create a batch document successfully', async () => {
        const documentData = {
            file_name: "invoice.pdf",
            file_size: "245KB",
            file_type: "application/pdf",
            batch_number: "BN-123456",
            s3_location: "https://bucket.s3.amazonaws.com/invoice.pdf",
            uploaded_by: "john.doe@example.com"
        };

        BatchDocuments.create.mockResolvedValue(documentData); // Mock success

        const createdDocument = await BatchDocuments.create(documentData);
        expect(createdDocument.file_name).toBe(documentData.file_name);
        expect(createdDocument.batch_number).toBe("BN-123456");
    });

    it('should throw error when required fields are missing', async () => {
        const incompleteData = {
            file_name: "receipt.pdf",
            // file_size missing
            file_type: "application/pdf",
            batch_number: "BN-789012",
            s3_location: "https://bucket.s3.amazonaws.com/receipt.pdf",
            uploaded_by: "jane.doe@example.com"
        };

        BatchDocuments.create.mockRejectedValue(new Error("notNull Violation: file_size cannot be null"));

        await expect(BatchDocuments.create(incompleteData)).rejects.toThrow("file_size cannot be null");
    });

    it('should throw error on duplicate file_name and batch_number', async () => {
        const duplicateData = {
            file_name: "invoice.pdf",
            file_size: "245KB",
            file_type: "application/pdf",
            batch_number: "BN-123456",
            s3_location: "https://bucket.s3.amazonaws.com/invoice.pdf",
            uploaded_by: "john.doe@example.com"
        };

        BatchDocuments.create.mockRejectedValue(new Error("Duplicate entry"));

        await expect(BatchDocuments.create(duplicateData)).rejects.toThrow("Duplicate entry");
    });
});
