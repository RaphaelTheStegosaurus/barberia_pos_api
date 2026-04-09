const Ticket = require("../models/ticketModel");

exports.processSale = async (req, res) => {
  try {
    const folio = await Ticket.create(req.body);
    res.status(201).json({
      success: true,
      message: "Venta procesada correctamente",
      folio: folio,
    });
  } catch (error) {
    console.error("Error en controlador de venta:", error);
    res.status(500).json({
      success: false,
      message: "Hubo un error al procesar la venta",
      error: error.message,
    });
  }
};

exports.getTicketDetails = async (req, res) => {
  try {
    const data = await Ticket.getById(req.params.id);
    if (data.length === 0)
      return res.status(404).json({ message: "Ticket no encontrado" });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.listTickets = async (req, res) => {
  try {
    const history = await Ticket.getAll();
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el historial",
      error: error.message,
    });
  }
};
