const express = require("express");
const { uploadFile, getFile, getBatchCertificate } = require("../controllers/documentController");
const { fileUploadMiddleware } = require("../middlewares/fileUploadMiddleware");
const router = express.Router();

router.post("/upload", fileUploadMiddleware, uploadFile);
router.post("/get_file", fileUploadMiddleware, getFile);
router.post("/get_batch_certificate", getBatchCertificate);

module.exports = router;
