const db = require("../config/db");

const validateSale = async (req, res, next) => {
  const { items, subtotal } = req.body;

  // 1. Validar que vengan productos
  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ error: "La venta debe tener al menos un producto." });
  }

  // 2. Validar precios y stock
  for (const item of items) {
    // Regla: Precio mayor a 0
    if (item.unit_price <= 0) {
      return res.status(400).json({
        error: `El producto ${item.product_id} tiene un precio inválido ($0 o menos).`,
      });
    }

    // Regla: Cantidad mayor a 0
    if (item.quantity <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0." });
    }

    // 3. Verificar Stock en tiempo real (DB)
    const [rows] = await db.execute(
      "SELECT STOCK FROM INVENTORY WHERE PRODUCT_ID = ?",
      [item.product_id]
    );

    if (rows.length > 0) {
      const currentStock = rows[0].STOCK;
      if (currentStock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para el producto. Disponible: ${currentStock}`,
        });
      }
    }
  }

  // Si todo está bien, pasamos al siguiente paso (el controlador)
  next();
};

module.exports = { validateSale };
