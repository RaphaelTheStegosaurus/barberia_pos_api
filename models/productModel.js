const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const UPDATE_PRODUCT_QUERY = {
  price: "UPDATE PRODUCTS SET PRICE = ? WHERE PRODUCT_ID = ?",
  name: "UPDATE PRODUCTS SET NAME = ? WHERE PRODUCT_ID = ?",
  category: "UPDATE PRODUCTS SET CATEGORY = ? WHERE PRODUCT_ID = ?",
  stock: "UPDATE PRODUCTS SET STOCK=? WHERE PRODUCT_ID = ?",
  all: "UPDATE PRODUCTS SET NAME = ?, PRICE = ?, CATEGORY = ?, STOCK=? WHERE PRODUCT_ID = ?",
};
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
  update: async (id, data) => {
    const { name, price, category, stock } = data;
    console.log(name == null);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Actualizar tabla principal
      await conn.execute(
        "UPDATE PRODUCTS SET NAME = ?, PRICE = ?, CATEGORY = ?, STOCK=? WHERE PRODUCT_ID = ?",
        [name, price, category, stock, id]
      );

      // 2. Si es producto, actualizar su stock en INVENTORY
      if (category === "PRODUCTO") {
        await conn.execute(
          "UPDATE INVENTORY SET STOCK = ? WHERE PRODUCT_ID = ?",
          [stock, id]
        );
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  delete: async (id) => {
    // Al usar ON DELETE CASCADE en tu base de datos,
    // borrar de PRODUCTS borrará automáticamente de INVENTORY y detalles.
    const [result] = await db.execute(
      "DELETE FROM PRODUCTS WHERE PRODUCT_ID = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Product;
