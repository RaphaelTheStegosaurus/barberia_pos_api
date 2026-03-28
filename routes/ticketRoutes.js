const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

router.post("/checkout", ticketController.processSale);
router.get("/:id", ticketController.getTicketDetails);

module.exports = router;
