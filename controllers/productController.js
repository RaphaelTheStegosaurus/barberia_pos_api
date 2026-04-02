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
  const { name, price, category, stock } = req.body;

  const validCategories = ["SERVICIO", "PRODUCTO"];
  if (!validCategories.includes(category.toUpperCase())) {
    return res
      .status(400)
      .json({ error: "La categoría debe ser SERVICIO o PRODUCTO." });
  }

  if (parseFloat(price) <= 0) {
    return res.status(400).json({ error: "El precio debe ser mayor a 0.00." });
  }

  if (parseInt(stock) < 0) {
    return res.status(400).json({ error: "El stock no puede ser negativo." });
  }

  try {
    const productId = await Product.create({
      name,
      price,
      category: category.toUpperCase(),
      stock,
    });

    res.status(201).json({
      success: true,
      message: "Producto/Servicio registrado",
      id: productId,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el producto." });
  }
};
