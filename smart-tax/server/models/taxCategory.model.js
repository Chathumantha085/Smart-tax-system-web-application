const db = require('../config/db');

class TaxCategory {
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM tax_categories');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM tax_categories WHERE id = ?', [id]);
    return rows[0];
  }

  static async create({ name, description, tax_percentage, is_active = 1 }) {
    const [result] = await db.query(
      'INSERT INTO tax_categories (name, description, tax_percentage, is_active) VALUES (?, ?, ?, ?)',
      [name, description, tax_percentage, is_active]
    );
    return { id: result.insertId, name, description, tax_percentage, is_active };
  }

  static async update(id, { name, description, tax_percentage, is_active }) {
    await db.query(
      'UPDATE tax_categories SET name = ?, description = ?, tax_percentage = ?, is_active = ? WHERE id = ?',
      [name, description, tax_percentage, is_active, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await db.query('DELETE FROM tax_categories WHERE id = ?', [id]);
    return true;
  }
}

module.exports = TaxCategory;