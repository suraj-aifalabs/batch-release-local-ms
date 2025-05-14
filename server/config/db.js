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
                        rejectUnauthorized: false // For self-signed certificates if needed
                    }
                },
                // eslint-disable-next-line no-console
                logging: process.env.NODE_ENV === "development" ? console.log : false,
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

        db.users = require("../models/userModel")(sequelize, DataTypes);

        // eslint-disable-next-line no-console
        console.log("Database connection has been established successfully.");
        // await sequelize.sync({ force: false, alter: true });

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