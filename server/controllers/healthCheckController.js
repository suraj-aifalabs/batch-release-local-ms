/* eslint-disable no-undef */
const catchAsyncError = require("../middlewares/catchAsyncError");

exports.healthCheck = catchAsyncError(async (req, res) => {

    res.status(200).json({
        message: "Service is healthy",
        uptime: (process?.uptime() ?? 0) + " sec",
    });
});


exports.readyCheck = catchAsyncError(async (req, res) => {

    const env = process.env.NODE_ENV ?? "";
    res.status(200).json({
        message: "Application is ready",
        environment: env,
    });
});

exports.serverCheck = catchAsyncError(async (req, res) => {

    const env = process.env.NODE_ENV ?? "";
    const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "";
    res.status(200).json({
        message: "Application is running",
        environment: env,
        allowedOrigin
    });
});
