const express = require("express");
const cors = require("cors");

const app = express();
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const db = require("./config/db");

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

// Limpieza de sesiones huérfanas
setInterval(async () => {
  console.log("REVISION");

  await db.execute(`
    UPDATE SESSION_LOGS 
    SET END_DATE = DATE_ADD(START_DATE, INTERVAL 8 HOUR), 
        CLOSE_SOURCE = 'API_EXPIRED' 
    WHERE END_DATE IS NULL 
    AND START_DATE < DATE_SUB(NOW(), INTERVAL 8 HOUR)
  `);
}, 1000 * 60 * 60); // Cada hora
