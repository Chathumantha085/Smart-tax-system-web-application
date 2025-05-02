const Expense = require('../models/Expense');
const upload = require('../utils/upload.js');

const expenseController = {
  getExpenses: async (req, res) => {
    try {
      const filters = {
        category: req.query.category,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        amountMin: req.query.amountMin,
        amountMax: req.query.amountMax
      };

      const expenses = await Expense.findAll(req.user.id, filters);
      res.json(expenses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  createExpense: async (req, res) => {
    try {
      const { description, amount, date, category, expenseType, isRecurring, recurringDay, setup_auto_pay, card_details,selectedPaymentMethod } = req.body;

      let receipt_path = null;
      if (req.file) {
        receipt_path = req.file.path;
      }

      // Convert the frontend date string to a MySQL compatible format
      const mysqlDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');
      // Example output: "2025-04-12 09:05:38" (UTC time)

      const expenseId = await Expense.create({
        user_id: req.user.id,
        description,
        amount,
        date: mysqlDate, // Use the converted date
        category_id: category,
        expense_type: expenseType,
        receipt_path,
        is_recurring: isRecurring,
        recurring_day:recurringDay,
        card_details: selectedPaymentMethod
      });

      res.status(201).json({ id: expenseId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const { description, amount, date, category, expenseType, is_recurring, recurring_day, setup_auto_pay, card_details } = req.body;

      const mysqlDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');
      let receipt_path = null;
      if (req.file) {
        receipt_path = req.file.path;
      }

      await Expense.update(id, req.user.id, {
        description,
        amount,
        date: mysqlDate,
        category_id: category,
        expense_type: expenseType,
        receipt_path,
        is_recurring: is_recurring,
        recurring_day,
        card_details: setup_auto_pay ? card_details : null
      });

      res.json({ message: 'Expense updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  deleteExpense: async (req, res) => {
    try {
      const { id } = req.params;
      await Expense.delete(id, req.user.id);
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = expenseController;