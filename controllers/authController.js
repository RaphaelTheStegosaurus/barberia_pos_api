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
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeData = {
      id: uuidv4(),
      firstName,
      middleName,
      lastName,
    };
    const userData = {
      id: uuidv4(),
      username,
      password: hashedPassword,
    };
    const result = await authModel.registerEmployee(employeeData, userData);
    res.status(201).json({
      success: true,
      message: "Empleado y Usuario creados correctamente",
      employeeId: result.employeeId,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      error: "Error al registrar. Es posible que el usuario ya exista.",
    });
  }
};

exports.listEmployees = async (req, res) => {
  try {
    const employees = await authModel.getAllEmployees();
    res.json({ success: true, data: employees });
  } catch (error) {
    console.error("Error al listar:", error);
    res.status(500).json({
      success: false,
      error: "No se pudo obtener la lista de empleados",
    });
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
