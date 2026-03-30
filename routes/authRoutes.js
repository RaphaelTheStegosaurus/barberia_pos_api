const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Solo '/' o '/login' dependiendo de cómo quieras la URL
router.post("/login", authController.login);
router.post("/register", authController.registerNewEmployee);
module.exports = router;
