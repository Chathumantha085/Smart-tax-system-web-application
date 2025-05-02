const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const paymentMethodController = require('../controllers/paymentMethodController');

// Payment Method Routes
router.get('/', authMiddleware.protect, paymentMethodController.getUserPaymentMethods);
router.post('/', authMiddleware.protect, paymentMethodController.createPaymentMethod);
router.get('/:id', authMiddleware.protect, paymentMethodController.getPaymentMethod);
router.put('/:id', authMiddleware.protect, paymentMethodController.updatePaymentMethod);
router.delete('/:id', authMiddleware.protect, paymentMethodController.deletePaymentMethod);
router.patch('/:id/set-default', authMiddleware.protect, paymentMethodController.setDefaultPaymentMethod);

module.exports = router;