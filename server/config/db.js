/* eslint-disable no-undef */
const { Sequelize, DataTypes } = require("sequelize");

const db = {};

const dbConnection = async () => {
    try {
        const DB_URL = process.env.DB_URL ?? "";

        const sequelize = new Sequelize(
            DB_URL,
            {
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
            }
        );

        await sequelize.authenticate();

        db.Sequelize = Sequelize;
        db.sequelize = sequelize;

        // Load models
        db.batch_documents = require("../models/batchDocumentModel")(sequelize, DataTypes);

        // Sync models with database
        await sequelize.sync({
            force: false,
            alter: true
        });

        // eslint-disable-next-line no-console
        console.log("Database connection has been established successfully.");
        return { db, sequelize };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Unable to connect to the database:", error);
    }
};

module.exports = {
    dbConnection,
    db,
};