const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

class AuthController {
  static async register(req, res) {
    try {
      const {
        name,
        email,
        password,
        address,
        contact_number,
        gender,
        nationality,
        id_number
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const userId = await User.create({
        name,
        email,
        password,
        address,
        contact_number,
        gender,
        nationality,
        id_number,
        isApproved: false
      });

      const user = await User.findById(userId);

      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address,
          contact_number: user.contact_number,  
          gender: user.gender,
          nationality: user.nationality,
          id_number: user.id_number,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await User.comparePasswords(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user is approved
      if (!user.isApproved) {
        return res.status(403).json({ 
          message: 'Account not approved yet. Please wait for admin approval.' 
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, role: user.role }, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,  
          contact_number: user.contact_number,
          gender: user.gender,
          nationality: user.nationality,
          id_number: user.id_number,
        },
        token
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = AuthController;