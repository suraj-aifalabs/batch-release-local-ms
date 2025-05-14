const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const logger = require("morgan");
const { default: helmet } = require("helmet");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { dbConnection } = require("./config/db");
const ErrorHandler = require("./middlewares/ErrorHandler");
dotenv.config();

//db call
dbConnection();

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(logger("dev"));

const middlewares = {
    validateOauthToken: require("./middlewares/oauthMiddleware").validateOauthToken,
};

const corsOptions = {
    // eslint-disable-next-line no-undef
    origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(",").map(e => e.trim()) : [],
    methods: "GET,POST,PUT,DELETE",
};

app.use(cors(corsOptions));

// routes
app.use("/api/auth", middlewares.validateOauthToken, authRoutes);

app.use("/", healthRoutes);

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
}
);

app.use(ErrorHandler);