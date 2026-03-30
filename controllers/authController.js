const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Petición de login recibida con cuerpo:", req.body);
  const { employee_id } = req.body; // En un sistema real usarías password también

  try {
    const [rows] = await db.execute(
      `SELECT u.*, e.FIRST_NAMES 
             FROM USERS u 
             JOIN EMPLOYEES e ON u.EMPLOYEE_ID = e.EMPLOYEE_ID 
             WHERE u.USERNAME = ?`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Empleado no encontrado" });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.PASSWORD);
    if (!validPassword) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }
    const sessionId = uuidv4();

    // Actualizamos el SESSION_ID en la base de datos (como en tu esquema)
    await db.execute(
      "UPDATE EMPLOYEES SET SESSION_ID = ? WHERE EMPLOYEE_ID = ?",
      [sessionId, employee_id]
    );

    // Generamos un Token JWT que el Frontend guardará
    const token = jwt.sign(
      { id: user.EMPLOYEE_ID, username: user.USERNAME },
      process.env.JWT_SECRET || "secreto_temporal",
      { expiresIn: "8h" }
    );

    res.json({
      message: "Bienvenido " + user.FIRST_NAMES,
      token,
      employee_id: user.EMPLOYEE_ID,
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
};
