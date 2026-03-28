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
