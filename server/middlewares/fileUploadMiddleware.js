const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "./uploads";
        // Check if the directory exists
        fs.access(dir, fs.constants.F_OK, (err) => {
            if (err) {
                // Directory does not exist, create it
                fs.mkdir(dir, { recursive: true }, (err) => {
                    if (err) {
                        return cb(err); // Handle error
                    }
                    cb(null, dir);
                });
            } else {
                cb(null, dir);
            }
        });
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Set up multer with disk storage
module.exports.fileUploadMiddleware = multer({ storage }).single("file");
