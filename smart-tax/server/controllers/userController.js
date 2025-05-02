const db = require('../config/db');
const User = require('../models/User');

class UserController {
  static async getAllUsers(req, res) {
    try {
      // Only admin can access all users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const [users] = await db.query(
        'SELECT * FROM users WHERE role != "admin"'
      );
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async approveUser(req, res) {
    try {
      const userId = req.params.id;
      
      // Update the user's isApproved status to 1 (approved)
      const [result] = await db.query(
        'UPDATE users SET isApproved = 1 WHERE id = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User approved successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async cancelUserApproval(req, res) {
    try {
      const userId = req.params.id;
      
      // Update the user's isApproved status to 0 (not approved)
      const [result] = await db.query(
        'UPDATE users SET isApproved = 0 WHERE id = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User approval canceled successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = UserController;