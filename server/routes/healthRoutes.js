const express = require("express");
const { healthCheck, readyCheck, serverCheck } = require("../controllers/healthCheckController");
const { getFileAndSendResponse } = require("../controllers/documentController");
const router = express.Router();

router.get("/health", healthCheck);
router.get("/ready", readyCheck);
router.get("/", serverCheck);
router.get("/getFile", getFileAndSendResponse);


module.exports = router;
