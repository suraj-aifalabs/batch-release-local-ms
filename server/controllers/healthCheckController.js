/* eslint-disable no-undef */
const catchAsyncError = require("../middlewares/catchAsyncError");

exports.healthCheck = catchAsyncError(async (req, res) => {
    const estDate = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour12: true,
    });
    res.status(200).json({
        message: "Service is healthy",
        time: estDate,
        timezone: "EST (America/New_York)",
        uptime: (process?.uptime() ?? 0) + " sec",
    });
});

exports.readyCheck = catchAsyncError(async (req, res) => {
    const estDate = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour12: true,
    });
    const env = process.env.NODE_ENV ?? "";
    res.status(200).json({
        message: "Application is ready",
        time: estDate,
        timezone: "EST (America/New_York)",
        environment: env,
    });
});

exports.serverCheck = catchAsyncError(async (req, res) => {
    const estDate = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour12: true,
    });
    const env = process.env.NODE_ENV ?? "";
    const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "";
    res.status(200).json({
        message: "Application is running",
        time: estDate,
        timezone: "EST (America/New_York)",
        environment: env,
        allowedOrigin
    });
});
