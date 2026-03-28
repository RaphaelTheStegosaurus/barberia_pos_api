const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const Product = {
  getAll: async () => {
    const [rows] = await db.execute("SELECT * FROM PRODUCTS");
    return rows;
  },

  create: async (data) => {
    const { name, price, category, stock } = data;
    const productId = uuidv4();

    // Usamos una transacción para insertar en PRODUCTOS e INVENTARIO al mismo tiempo
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        "INSERT INTO PRODUCTS (PRODUCT_ID, NAME, PRICE, CATEGORY) VALUES (?, ?, ?, ?)",
        [productId, name, price, category]
      );
      await conn.execute(
        "INSERT INTO INVENTORY (PRODUCT_ID, STOCK) VALUES (?, ?)",
        [productId, stock || 0]
      );
      await conn.commit();
      return productId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },
};

module.exports = Product;
