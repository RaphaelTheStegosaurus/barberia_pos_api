const Ticket = require("../models/ticketModel");

const validateSale = async (req, res, next) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ error: "La venta debe tener al menos un producto." });
  }
  for (const item of items) {
    if (item.unit_price <= 0) {
      return res.status(400).json({
        error: `El producto ${item.product_id} tiene un precio inválido ($0 o menos).`,
      });
    }
    if (item.quantity <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0." });
    }
    const currentStock = await Ticket.checkProductStock(item.product_id);
    if (currentStock !== null && currentStock < item.quantity) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${currentStock}`,
      });
    }
    // 3. Verificar Stock en tiempo real (DB)
    // const [rows] = await db.execute(
    //   "SELECT STOCK FROM INVENTORY WHERE PRODUCT_ID = ?",
    //   [item.product_id]
    // );

    // if (rows.length > 0) {
    //   const currentStock = rows[0].STOCK;
    //   if (currentStock < item.quantity) {
    //     return res.status(400).json({
    //       error: `Stock insuficiente para el producto. Disponible: ${currentStock}`,
    //     });
    //   }//
    // }
  }
  next();
};

module.exports = { validateSale };
