const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const Ticket = {
  create: async (ticketData) => {
    const { employee_id, subtotal, tax, total, payment, items } = ticketData;
    const folioId = uuidv4();

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Insertar Cabecera del Ticket
      await conn.execute(
        "INSERT INTO TICKETS (FOLIO_ID, SUBTOTAL, TAX, TOTAL, PAYMENT, EMPLOYEE_ID) VALUES (?, ?, ?, ?, ?, ?)",
        [folioId, subtotal, tax, total, payment, employee_id]
      );

      // 2. Insertar Detalles y Actualizar Inventario
      for (const item of items) {
        const detailId = uuidv4();

        // Registro del detalle
        await conn.execute(
          "INSERT INTO TICKET_DETAILS (DETAIL_ID, FOLIO_ID, PRODUCT_ID, QUANTITY, UNIT_PRICE) VALUES (?, ?, ?, ?, ?)",
          [detailId, folioId, item.product_id, item.quantity, item.unit_price]
        );

        // 2. Verificar la categoría antes de intentar actualizar stock
        const [product] = await conn.execute(
          "SELECT CATEGORY FROM PRODUCTS WHERE PRODUCT_ID = ?",
          [item.product_id]
        );

        // 3. Actualización de Stock SOLO si es PRODUCTO
        if (product.length > 0 && product[0].CATEGORY === "PRODUCTO") {
          await conn.execute(
            "UPDATE INVENTORY SET STOCK = STOCK - ? WHERE PRODUCT_ID = ?",
            [item.quantity, item.product_id]
          );
        } else {
          console.log(
            `El item ${item.product_id} es un SERVICIO, se omite resta de inventario.`
          );
        }
      }

      await conn.commit();
      return folioId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  getById: async (folioId) => {
    // Obtenemos el ticket y sus detalles en una sola consulta con JOIN
    const [rows] = await db.execute(
      `SELECT t.*, td.product_id, td.quantity, td.unit_price, p.name 
             FROM TICKETS t
             JOIN TICKET_DETAILS td ON t.FOLIO_ID = td.FOLIO_ID
             JOIN PRODUCTS p ON td.PRODUCT_ID = p.PRODUCT_ID
             WHERE t.FOLIO_ID = ?`,
      [folioId]
    );
    return rows;
  },
};

module.exports = Ticket;
