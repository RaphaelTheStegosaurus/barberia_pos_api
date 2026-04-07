const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Solo '/' o '/login' dependiendo de cómo quieras la URL
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/register", authController.registerNewEmployee);
router.get("/list", authController.listEmployees);
router.get("/status", authController.getOnlineStatus);
module.exports = router;
