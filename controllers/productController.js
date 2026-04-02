const Product = require("../models/productModel");

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const id = await Product.create(req.body);
    res.status(201).json({ message: "Producto creado", id });
  } catch (error) {
    res.status(500).json({ error: "Error al crear producto" });
  }
};

exports.registerProduct = async (req, res) => {
  let { name, price, category, stock } = req.body;
  const catUpper = category.toUpperCase();

  const validCategories = ["SERVICIO", "PRODUCTO"];
  if (!validCategories.includes(category.toUpperCase())) {
    return res
      .status(400)
      .json({ error: "La categoría debe ser SERVICIO o PRODUCTO." });
  }

  // Si es servicio, forzamos stock a null o 0 para la lógica de validación
  if (catUpper === "SERVICIO") {
    stock = 0;
  } else if (parseInt(stock) < 0) {
    return res
      .status(400)
      .json({ error: "El stock de un producto no puede ser negativo" });
  }

  if (parseFloat(price) <= 0) {
    return res.status(400).json({ error: "El precio debe ser mayor a 0.00." });
  }

  try {
    const id = await Product.create({ name, price, category: catUpper, stock });
    res.status(201).json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
