const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const logger = require("morgan");
const { default: helmet } = require("helmet");
const bodyParser = require("body-parser");
const healthRoutes = require("./routes/healthRoutes");
const documentRoutes = require("./routes/documentRoutes.js");

const { dbConnection } = require("./config/db");
const ErrorHandler = require("./middlewares/errorHandler");
dotenv.config();

//db call
dbConnection();

const app = express();
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        frameguard: { action: "deny" },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: "no-referrer" },
        permissionsPolicy: {
            features: {
                camera: ["()"],
                microphone: ["()"],
                geolocation: ["()"]
            }
        }
    })
);
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(logger("dev"));

const middlewares = {
    validateOauthToken: require("./middlewares/oauthMiddleware").validateOauthToken,
    noCacheHeaders: require("./middlewares/noCacheHeaders.js").noCacheHeaders,
};

const corsOptions = {
    // eslint-disable-next-line no-undef
    origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(",").map(e => e.trim()) : [],
    methods: "GET,POST,PUT,DELETE",
};

app.use(cors(corsOptions));

// routes
app.use("/", healthRoutes);
app.use("/document", middlewares.noCacheHeaders, middlewares.validateOauthToken, documentRoutes);

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
}
);

app.use(ErrorHandler);