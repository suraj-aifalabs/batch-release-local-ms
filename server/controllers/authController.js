const Joi = require("joi");
const catchAsyncError = require("../middlewares/catchAsyncError");
const { db } = require("../config/db");

exports.getAuth = catchAsyncError(async (req, res) => {
    const istDate = new Date();

    res.status(200).json({
        message: "success",
        time: istDate,
    });
});

exports.authAction = catchAsyncError(async (req, res) => {

    const reqbody = req.method === "GET" ? req.query : req.body;

    const { action } = reqbody;
    const email = req?.user?.email ?? "";
    const name = req?.user?.name ?? "";
    const username = req.user?.username || "system";

    const reqBodyValidation = Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().trim().required(),
        username: Joi.string().trim().required(),
        action: Joi.string().valid("login", "logout").required(),
    });

    const validationBody = {
        email,
        name,
        action,
        username
    };

    const validationResult = reqBodyValidation.validate(validationBody);

    if (validationResult.error) {
        return res.status(400).json({
            flag: "error",
            message: "fail",
            error: validationResult.error?.message.replace(
                /"([^"]+)"/,
                (match, p1) =>
                    p1
                        .replace(/([a-z])([A-Z])/g, "$1 $2")
                        .replace(/^\w/, (c) => c.toUpperCase())
            ),
        });
    }
    return res.status(200).json({
        flag: "success",
        message: "API Executed Successfully",
        data: [],
    });
});

exports.getUsers = catchAsyncError(async (req, res) => {
    const istDate = new Date();

    const users = await db.users.findAll({});

    res.status(200).json({
        message: "success",
        time: istDate,
        users
    });
});

exports.createUsers = catchAsyncError(async (req, res) => {
    const istDate = new Date();

    const users = await db.users.create({
        userName: "user1",
        email: "user1@example.com"
    });

    res.status(200).json({
        message: "success",
        time: istDate,
        users
    });
});