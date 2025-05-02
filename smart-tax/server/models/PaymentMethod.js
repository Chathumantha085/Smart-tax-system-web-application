const db = require('../config/db');

class PaymentMethod {
  constructor({
    user_id,
    nickname = null,
    card_type,
    card_number,
    expiry_month,
    expiry_year,
    cvv,
    is_default = false,
    status = 'active'
  }) {
    this.user_id = user_id;
    this.nickname = nickname;
    this.card_type = card_type;  
    this.card_number = card_number;
    this.expiry_month = expiry_month;
    this.expiry_year = expiry_year;
    this.cvv = cvv;
    this.is_default = is_default;
    this.status = status;
  }

  static async create(paymentMethodData) {
    // Sanitize data - convert undefined to null
    const sanitizedData = {
      user_id: paymentMethodData.user_id,
      nickname: paymentMethodData.nickname || null,
      card_type: paymentMethodData.card_type,
      card_number: paymentMethodData.card_number,
      expiry_month: paymentMethodData.expiry_month,
      expiry_year: paymentMethodData.expiry_year,
      cvv: paymentMethodData.cvv,
      is_default: Boolean(paymentMethodData.is_default),
      status: paymentMethodData.status || 'active'
    };

    const query = `
      INSERT INTO payment_methods 
      (user_id, nickname, card_type, card_number, expiry_month, expiry_year, cvv, is_default, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      sanitizedData.user_id,
      sanitizedData.nickname,
      sanitizedData.card_type,
      sanitizedData.card_number,
      sanitizedData.expiry_month,
      sanitizedData.expiry_year,
      sanitizedData.cvv,
      sanitizedData.is_default,
      sanitizedData.status
    ];

    const [result] = await db.execute(query, values);
    return result.insertId;
  }

  static async findByUserId(userId) {
    const query = `
      SELECT 
        id, nickname, card_type, card_number,
        CONCAT('•••• •••• •••• ', RIGHT(card_number, 4)) as masked_number,
        CONCAT(expiry_month, '/', expiry_year) as expiry_date,
        is_default, status, created_at
      FROM payment_methods
      WHERE user_id = ? AND status = 'active'
      ORDER BY is_default DESC, created_at DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  }

  static async findById(id, userId) {
    const query = `
      SELECT * FROM payment_methods 
      WHERE id = ? AND user_id = ?
    `;
    const [rows] = await db.execute(query, [id, userId]);
    return rows[0];
  }

  static async update(id, userId, updateData) {
    // Ensure we don't accidentally update sensitive fields
    const { nickname, is_default, status } = updateData;
    
    const query = `
      UPDATE payment_methods 
      SET nickname = ?, is_default = ?, status = ?
      WHERE id = ? AND user_id = ?
    `;
    await db.execute(query, [nickname, is_default, status, id, userId]);
  }

  static async delete(id, userId) {
    const query = `
      UPDATE payment_methods 
      SET status = 'canceled'
      WHERE id = ? AND user_id = ?
    `;
    await db.execute(query, [id, userId]);
  }

  static async setDefault(id, userId) {
    // First reset any existing default
    await db.execute(
      'UPDATE payment_methods SET is_default = 0 WHERE user_id = ?',
      [userId]
    );
    
    // Then set the new default
    await db.execute(
      'UPDATE payment_methods SET is_default = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }
}

module.exports = PaymentMethod;