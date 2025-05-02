const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create({
    name,
    email,
    password,
    address,
    contact_number,
    gender,
    nationality,
    id_number,
    role = 'user',
    isApproved = false // New field, default false
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users 
      (name, email, password, address, contact_number, gender, nationality, id_number, role, isApproved) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, address, contact_number, gender, nationality, id_number, role, isApproved]
    );
    return result.insertId;
  }

  // Add new method to approve users
  static async approveUser(id) {
    const [result] = await db.query(
      'UPDATE users SET isApproved = true WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Add method to get unapproved users
  static async getUnapprovedUsers() {
    const [users] = await db.query(
      'SELECT id, name, email FROM users WHERE isApproved = false'
    );
    return users;
  }

  static async findByEmail(email) {  
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT id, name, email, address, contact_number, gender, nationality, id_number, role 
      FROM users WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  static async comparePasswords(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async initializeAdmin() {
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await this.findByEmail(adminEmail);

    if (!existingAdmin) {
      await this.create({
        name: 'Admin',
        email: adminEmail,
        password: 'admin',
        role: 'admin',
        isApproved : true
      });  
      console.log('Admin user created successfully');
    }
  }
}

module.exports = User;  