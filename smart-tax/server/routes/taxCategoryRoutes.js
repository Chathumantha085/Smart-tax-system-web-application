const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const taxCategoryController = require('../controllers/taxCategory.controller');

router.get('/', taxCategoryController.getAllTaxCategories);

router.get('/:id', authMiddleware.protect,taxCategoryController.getTaxCategoryById);

router.post('/', authMiddleware.protect,taxCategoryController.createTaxCategory);

router.put('/:id', authMiddleware.protect,taxCategoryController.updateTaxCategory);
   
router.delete('/:id', authMiddleware.protect,taxCategoryController.deleteTaxCategory);

module.exports = router;