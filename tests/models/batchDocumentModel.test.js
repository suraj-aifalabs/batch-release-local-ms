/* eslint-disable no-undef */
const { DataTypes, Sequelize } = require("sequelize");
const defineBatchDocuments = require("../../server/models/batchDocumentModel");

describe("BatchDocuments Model", () => {
    let sequelize;
    let BatchDocuments;

    beforeAll(() => {
        sequelize = new Sequelize("postgres://user:password@localhost:5432/testdb", {
            logging: false,
        });
        BatchDocuments = defineBatchDocuments(sequelize, DataTypes);
    });

    test("should define the model with correct attributes", () => {
        const attributes = BatchDocuments.rawAttributes;

        expect(attributes.file_name).toBeDefined();
        expect(attributes.file_size).toBeDefined();
        expect(attributes.file_type).toBeDefined();
        expect(attributes.batch_number).toBeDefined();
        expect(attributes.s3_location).toBeDefined();
        expect(attributes.uploaded_by).toBeDefined();

        expect(attributes.file_name.allowNull).toBe(false);
        expect(attributes.file_size.allowNull).toBe(false);
        expect(attributes.file_type.allowNull).toBe(false);
        expect(attributes.batch_number.allowNull).toBe(false);
        expect(attributes.s3_location.allowNull).toBe(false);
        expect(attributes.uploaded_by.allowNull).toBe(false);
    });

    test("should have correct table and schema configuration", () => {
        expect(BatchDocuments.tableName).toBe("batch_documents");
        expect(BatchDocuments.options.schema).toBe("public");
        expect(BatchDocuments.options.createdAt).toBe("created_at");
        expect(BatchDocuments.options.updatedAt).toBe("updated_at");
        expect(BatchDocuments.options.freezeTableName).toBe(true);
        expect(BatchDocuments.options.underscored).toBe(true);
    });

    test("should create an instance successfully", async () => {
        //  await sequelize.sync({ force: true });

        const doc = await BatchDocuments.create({
            file_name: "document.pdf",
            file_size: "1MB",
            file_type: "application/pdf",
            batch_number: "BATCH123",
            s3_location: "s3://bucket/document.pdf",
            uploaded_by: "admin_user"
        });

        expect(doc.file_name).toBe("document.pdf");
        expect(doc.file_type).toBe("application/pdf");
        expect(doc.batch_number).toBe("BATCH123");
        expect(doc.s3_location).toBe("s3://bucket/document.pdf");
        expect(doc.uploaded_by).toBe("admin_user");
        expect(doc.created_at).toBeDefined();
        expect(doc.updated_at).toBeDefined();
    });
});
