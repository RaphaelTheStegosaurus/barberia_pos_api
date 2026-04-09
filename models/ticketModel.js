const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const Ticket = {
  create: async (ticketData) => {
    const { employee_id, subtotal, tax, total, payment, items } = ticketData;
    const folioId = uuidv4();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();
      await conn.execute(
        "INSERT INTO TICKETS (FOLIO_ID, SUBTOTAL, TAX, TOTAL, PAYMENT, EMPLOYEE_ID) VALUES (?, ?, ?, ?, ?, ?)",
        [folioId, subtotal, tax, total, payment, employee_id]
      );

      for (const item of items) {
        const detailId = uuidv4();

        await conn.execute(
          "INSERT INTO TICKET_DETAILS (DETAIL_ID, FOLIO_ID, PRODUCT_ID, QUANTITY, UNIT_PRICE) VALUES (?, ?, ?, ?, ?)",
          [detailId, folioId, item.product_id, item.quantity, item.unit_price]
        );

        // Usamos la nueva función interna del modelo
        const category = await Ticket.getProductCategory(conn, item.product_id);

        if (category === "PRODUCTO") {
          await conn.execute(
            "UPDATE INVENTORY SET STOCK = STOCK - ? WHERE PRODUCT_ID = ?",
            [item.quantity, item.product_id]
          );
        }

        // // 2. Verificar la categoría antes de intentar actualizar stock
        // const [product] = await conn.execute(
        //   "SELECT CATEGORY FROM PRODUCTS WHERE PRODUCT_ID = ?",
        //   [item.product_id]
        // );

        // // 3. Actualización de Stock SOLO si es PRODUCTO
        // if (product.length > 0 && product[0].CATEGORY === "PRODUCTO") {
        //   await conn.execute(
        //     "UPDATE INVENTORY SET STOCK = STOCK - ? WHERE PRODUCT_ID = ?",
        //     [item.quantity, item.product_id]
        //   );
        // } else {
        //   console.log(
        //     `El item ${item.product_id} es un SERVICIO, se omite resta de inventario.`
        //   );
        // }
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

  checkProductStock: async (productId) => {
    const [rows] = await db.execute(
      "SELECT STOCK FROM INVENTORY WHERE PRODUCT_ID = ?",
      [productId]
    );
    return rows.length > 0 ? rows[0].STOCK : null;
  },

  getProductCategory: async (conn, productId) => {
    const [product] = await conn.execute(
      "SELECT CATEGORY FROM PRODUCTS WHERE PRODUCT_ID = ?",
      [productId]
    );
    return product.length > 0 ? product[0].CATEGORY : null;
  },
  // Obtener historial de todos los tickets
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT 
        t.FOLIO_ID, 
        t.TOTAL, 
        t.PAYMENT, 
        t.DATE, 
        e.FIRST_NAMES AS BARBERO
          FROM TICKETS AS t
          LEFT JOIN EMPLOYEES AS e ON t.EMPLOYEE_ID = e.EMPLOYEE_ID
          ORDER BY t.DATE DESC;
      `);
    return rows;
  },
};

module.exports = Ticket;
