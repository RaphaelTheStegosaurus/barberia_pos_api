const express = require("express");
const app = express();
const productRoutes = require("./routes/productRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

app.use(express.json());

// Prefijo para todas las rutas de productos
app.use("/api/products", productRoutes);
app.use("/api/tickets", ticketRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor POS corriendo en http://localhost:${PORT}`);
});
