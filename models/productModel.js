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
  update: async (id, data) => {
    const fields = [];
    const values = [];

    // Solo agregamos al array lo que realmente viene en el "data"
    if (data.name !== undefined) {
      fields.push("NAME = ?");
      values.push(data.name);
    }
    if (data.price !== undefined) {
      fields.push("PRICE = ?");
      values.push(data.price);
    }
    if (data.category !== undefined) {
      fields.push("CATEGORY = ?");
      values.push(data.category);
    }
    if (data.active !== undefined) {
      fields.push("ACTIVE = ?");
      values.push(data.active);
    }

    // Si no mandaron nada para actualizar, salimos temprano
    if (fields.length === 0 && data.stock === undefined) return;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Actualizar tabla PRODUCTS (si hay campos)
      if (fields.length > 0) {
        const sql = `UPDATE PRODUCTS SET ${fields.join(
          ", "
        )} WHERE PRODUCT_ID = ?`;
        values.push(id); // El ID siempre va al final para el WHERE
        await conn.execute(sql, values);
      }

      // 2. Actualizar tabla INVENTORY (si viene el stock)
      if (data.stock !== undefined) {
        await conn.execute(
          "UPDATE INVENTORY SET STOCK = ? WHERE PRODUCT_ID = ?",
          [data.stock, id]
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
