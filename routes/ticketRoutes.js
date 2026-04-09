const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const { validateSale } = require("../middlewares/ticketValidator");
const { protect } = require("../middlewares/authMiddleware");

router.post("/checkout", protect, validateSale, ticketController.processSale);
router.get("/history", protect, ticketController.listTickets);
router.get("/detail/:id", protect, ticketController.getTicketDetails);

module.exports = router;
