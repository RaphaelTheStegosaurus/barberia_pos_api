const db = require("../config/db");
const authModel = require("../models/authModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

exports.login = async (req, res) => {
  const { username, password, connectionData } = req.body;
  try {
    const user = await authModel.findByUsername(username);

    if (!user) {
      return res.status(401).json({ error: "Empleado no encontrado" });
    }

    const validPassword = await bcrypt.compare(password, user.PASSWORD);
    if (!validPassword) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }
    const sessionId = uuidv4();
    await authModel.createSessionLog(sessionId, user.USER_ID, connectionData);
    const token = jwt.sign(
      { id: user.EMPLOYEE_ID, username: user.USERNAME },
      process.env.JWT_SECRET || "secreto_temporal",
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "Bienvenido " + user.FIRST_NAMES,
      token,
      employee_id: user.EMPLOYEE_ID,
      username: user.USERNAME,
      sessionId: sessionId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.logout = async (req, res) => {
  const { sessionId, source } = req.body;
  try {
    await authModel.updateSessionLogout(sessionId, source || "USER");
    res.json({ success: true, message: `Sesión cerrada por ${source}` });
  } catch (error) {
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};

exports.registerNewEmployee = async (req, res) => {
  const { firstName, middleName, lastName, username, password } = req.body;

  const employeeId = uuidv4();
  const userId = uuidv4();

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    await conn.execute(
      `INSERT INTO EMPLOYEES (EMPLOYEE_ID, FIRST_NAMES, MIDDLE_NAME, LAST_NAME, START_DATE) 
             VALUES (?, ?, ?, ?, CURDATE())`,
      [employeeId, firstName, middleName, lastName]
    );
    const hashedPassword = await bcrypt.hash(password, 10);
    await conn.execute(
      `INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, EMPLOYEE_ID) 
             VALUES (?, ?, ?, ?)`,
      [userId, username, hashedPassword, employeeId]
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: "Empleado y Usuario creados",
      employeeId,
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Error al registrar. El usuario ya existe o faltan datos.",
    });
  } finally {
    conn.release();
  }
};

exports.listEmployees = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.FIRST_NAMES, e.LAST_NAME, u.USERNAME, e.START_DATE 
             FROM EMPLOYEES e
             JOIN USERS u ON e.EMPLOYEE_ID = u.EMPLOYEE_ID`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Error al obtener la lista" });
  }
};

exports.getOnlineStatus = async (req, res) => {
  try {
    const rows = await authModel.getUsersStatus(); //
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estados" });
  }
};
