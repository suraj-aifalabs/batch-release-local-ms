const multer = require("multer");
const path = require("path");
// const storage = multer.memoryStorage()
// const fileUploadMiddleware = multer({ storage }).single('file')
// export default fileUploadMiddleware

// ************************************** 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads"); // Adjust the destination directory as needed
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Set up multer with disk storage
module.exports.fileUploadMiddleware = multer({ storage }).single("file");