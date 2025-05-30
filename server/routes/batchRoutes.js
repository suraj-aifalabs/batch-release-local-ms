const express = require("express");
const router = express.Router();
const { getPDF } = require("../controllers/batchController");
router.post("/getPDF", getPDF);



module.exports = router;