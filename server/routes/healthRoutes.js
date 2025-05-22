const express = require("express");
const { healthCheck, readyCheck, serverCheck, getPDF } = require("../controllers/healthCheckController");
const router = express.Router();

router.get("/health", healthCheck);
router.get("/ready", readyCheck);

router.post("/getPDF", getPDF);
router.get("/", serverCheck);



module.exports = router;
