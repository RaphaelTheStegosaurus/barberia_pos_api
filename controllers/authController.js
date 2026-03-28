const db = require("../config/db");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

exports.login = async (req, res) => {
  console.log("Petición de login recibida con cuerpo:", req.body);
  const { employee_id } = req.body; // En un sistema real usarías password también

  try {
    const [rows] = await db.execute(
      "SELECT * FROM EMPLOYEES WHERE EMPLOYEE_ID = ?",
      [employee_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Empleado no encontrado" });
    }

    const employee = rows[0];
    const sessionId = uuidv4();

    // Actualizamos el SESSION_ID en la base de datos (como en tu esquema)
    await db.execute(
      "UPDATE EMPLOYEES SET SESSION_ID = ? WHERE EMPLOYEE_ID = ?",
      [sessionId, employee_id]
    );

    // Generamos un Token JWT que el Frontend guardará
    const token = jwt.sign(
      { id: employee.EMPLOYEE_ID, session: sessionId },
      process.env.JWT_SECRET || "secreto_temporal",
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login exitoso",
      token,
      user: { name: employee.FIRST_NAMES, id: employee.EMPLOYEE_ID },
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
};
