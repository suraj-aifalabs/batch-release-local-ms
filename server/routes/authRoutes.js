const express = require("express");
const { getAuth, authAction, getUsers, createUsers } = require("../controllers/authController");
const router = express.Router();

router.get("/get_auth", getAuth);
router.get("/get_users", getUsers);
router.get("/create_users", createUsers);
router.post("/auth_action", authAction);

module.exports = router;
