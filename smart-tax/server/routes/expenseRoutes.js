const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const upload = require('../utils/upload.js');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/',  authMiddleware.protect,expenseController.getExpenses);
router.post('/',  authMiddleware.protect,upload.single('receipt'), expenseController.createExpense);
router.put('/:id',  authMiddleware.protect,upload.single('receipt'), expenseController.updateExpense);
router.delete('/:id',  authMiddleware.protect,expenseController.deleteExpense);

module.exports = router;