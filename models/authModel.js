const db = require("../config/db");

const AuthModel = {
  // Buscar usuario para login
  findByUsername: async (username) => {
    const [rows] = await db.execute(
      `SELECT u.*, e.FIRST_NAMES 
       FROM USERS u 
       JOIN EMPLOYEES e ON u.EMPLOYEE_ID = e.EMPLOYEE_ID 
       WHERE u.USERNAME = ?`,
      [username]
    );
    return rows[0];
  },

  // Registrar entrada en logs
  createSessionLog: async (sessionId, userId, connectionData) => {
    return await db.execute(
      `INSERT INTO SESSION_LOGS (SESSION_ID, USER_ID, START_DATE, DATA_CONNECTION) 
       VALUES (?, ?, NOW(), ?)`,
      [sessionId, userId, connectionData]
    );
  },

  // Registrar salida (Logout)
  updateSessionLogout: async (sessionId, source) => {
    return await db.execute(
      `UPDATE SESSION_LOGS 
       SET END_DATE = NOW(), CLOSE_SOURCE = ? 
       WHERE SESSION_ID = ? AND END_DATE IS NULL`,
      [source, sessionId]
    );
  },

  // Obtener estados de conexión
  getUsersStatus: async () => {
    const [rows] = await db.execute(`
      SELECT 
        s.SESSION_ID, e.FIRST_NAMES, e.LAST_NAME, u.USERNAME,
        s.START_DATE, s.DATA_CONNECTION,
        CASE 
          WHEN s.END_DATE IS NULL AND s.START_DATE > DATE_SUB(NOW(), INTERVAL 8 HOUR) THEN 'ONLINE'
          ELSE 'OFFLINE'
        END AS STATUS
      FROM EMPLOYEES e
      JOIN USERS u ON e.EMPLOYEE_ID = u.EMPLOYEE_ID
      LEFT JOIN SESSION_LOGS s ON u.USER_ID = s.USER_ID 
      AND s.SESSION_ID = (
          SELECT SESSION_ID FROM SESSION_LOGS 
          WHERE USER_ID = u.USER_ID 
          ORDER BY START_DATE DESC LIMIT 1
      )`);
    return rows;
  },
  // Registrar un nuevo empleado con transacción
  registerEmployee: async (employeeData, userData) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insertar en EMPLOYEES
      await conn.execute(
        `INSERT INTO EMPLOYEES (EMPLOYEE_ID, FIRST_NAMES, MIDDLE_NAME, LAST_NAME, START_DATE) 
         VALUES (?, ?, ?, ?, CURDATE())`,
        [
          employeeData.id,
          employeeData.firstName,
          employeeData.middleName,
          employeeData.lastName,
        ]
      );

      // 2. Insertar en USERS
      await conn.execute(
        `INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, EMPLOYEE_ID) 
         VALUES (?, ?, ?, ?)`,
        [userData.id, userData.username, userData.password, employeeData.id]
      );

      await conn.commit();
      return { success: true, employeeId: employeeData.id };
    } catch (error) {
      await conn.rollback();
      throw error; // Re-lanzamos el error para que el controlador lo maneje
    } finally {
      conn.release();
    }
  },

  // Obtener todos los empleados
  getAllEmployees: async () => {
    const [rows] = await db.execute(
      `SELECT e.FIRST_NAMES, e.LAST_NAME, u.USERNAME, e.START_DATE 
       FROM EMPLOYEES e
       JOIN USERS u ON e.EMPLOYEE_ID = u.EMPLOYEE_ID`
    );
    return rows;
  },
};

module.exports = AuthModel;
