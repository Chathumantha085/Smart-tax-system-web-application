const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config({ path: './.env' });

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tax-categories', require('./routes/taxCategoryRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/uploads', express.static('uploads'));
app.use('/api/payment-methods', require('./routes/paymentMethodRoutes'));
  

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Initialize admin user  
User.initializeAdmin();

// Database connection
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {  
  console.log(`Server running on port ${PORT}`);
});