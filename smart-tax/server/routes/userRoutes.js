const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get(
  '/',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  userController.getAllUsers
);

// Add these new routes
router.patch(
  '/approve/:id',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  userController.approveUser
);

router.patch(
  '/reject/:id',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  userController.cancelUserApproval
);

module.exports = router;  