const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

app.use(cors());
app.use(express.json());
// Prefijo para todas las rutas de productos
app.use("/api/products", productRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor POS corriendo en http://localhost:${PORT}`);
});
