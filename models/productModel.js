const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const Product = {
  create: async (data) => {
    const { name, price, category, stock } = data;
    const productId = uuidv4();

    // Usamos una transacción para insertar en PRODUCTOS e INVENTARIO al mismo tiempo
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();
      // 1. Siempre se inserta en PRODUCTS
      await conn.execute(
        "INSERT INTO PRODUCTS (PRODUCT_ID, NAME, PRICE, CATEGORY) VALUES (?, ?, ?, ?)",
        [productId, name, price, category]
      );

      // 2. Insertar en INVENTORY SOLO si es PRODUCTO
      if (category.toUpperCase() === "PRODUCTO") {
        await conn.execute(
          "INSERT INTO INVENTORY (PRODUCT_ID, STOCK) VALUES (?, ?)",
          [productId, stock || 0]
        );
      }

      await conn.commit();
      return productId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },
  getAll: async () => {
    // Usamos LEFT JOIN para traer el stock si existe, si no, mostrará NULL o 0
    const [rows] = await db.execute(`
            SELECT p.*, IFNULL(i.STOCK, 'N/A') as STOCK 
            FROM PRODUCTS p
            LEFT JOIN INVENTORY i ON p.PRODUCT_ID = i.PRODUCT_ID
    `);
    return rows;
  },
};

module.exports = Product;
