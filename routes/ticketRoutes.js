const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const { validateSale } = require("../middlewares/ticketValidator");

router.post("/checkout", validateSale, ticketController.processSale);
router.get("/:id", ticketController.getTicketDetails);

module.exports = router;
