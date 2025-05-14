const express = require("express");
const { healthCheck, readyCheck, serverCheck } = require("../controllers/healthCheckController");
const router = express.Router();

router.get("/health", healthCheck);
router.get("/ready", readyCheck);
router.get("/", serverCheck);


module.exports = router;
