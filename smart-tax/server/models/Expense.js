const pool = require('../config/db');

class Expense {
  static async findAll(userId, filters = {}) {
    let query = `
      SELECT e.*, tc.name as category_name, tc.tax_percentage 
      FROM expenses e
      JOIN tax_categories tc ON e.category_id = tc.id
      WHERE e.user_id = ?
    `;
    const params = [userId];

    if (filters.category) {
      query += ' AND e.category_id = ?';
      params.push(filters.category);
    }

    if (filters.dateFrom) {
      query += ' AND e.date >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ' AND e.date <= ?';
      params.push(filters.dateTo);
    }

    if (filters.amountMin) {
      query += ' AND e.amount >= ?';
      params.push(filters.amountMin);
    }

    if (filters.amountMax) {
      query += ' AND e.amount <= ?';
      params.push(filters.amountMax);
    }

    query += ' ORDER BY e.date DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  }

  static async create(expenseData) {
    const {
      user_id,
      description,
      amount,
      date,
      category_id,
      expense_type,
      receipt_path,
      is_recurring,
      recurring_day,
      card_details
    } = expenseData;

    const [result] = await pool.query(
      `INSERT INTO expenses 
      (user_id, description, amount, date, category_id, expense_type, receipt_path, is_recurring, recurring_day, card_details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        description,
        amount,
        date,
        category_id,
        expense_type,
        receipt_path,
        is_recurring,
        recurring_day,
        // card_details ? JSON.stringify(card_details) : null
        card_details

      ]
    );
    return result.insertId;
  }

  static async update(id, userId, expenseData) {
    const {
      description,
      amount,
      date,
      category_id,
      expense_type,
      receipt_path,
      is_recurring,
      recurring_day,
      card_details
    } = expenseData;

    await pool.query(
      `UPDATE expenses SET 
      description = ?, 
      amount = ?, 
      date = ?, 
      category_id = ?, 
      expense_type = ?, 
      receipt_path = ?, 
      is_recurring = ?, 
      recurring_day = ?, 
      card_details = ?
      WHERE id = ? AND user_id = ?`,
      [
        description,
        amount,
        date,
        category_id,
        expense_type,
        receipt_path,
        is_recurring,
        recurring_day,
        card_details ? JSON.stringify(card_details) : null,
        id,
        userId
      ]
    );
  }

  static async delete(id, userId) {
    await pool.query(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }
}

module.exports = Expense;