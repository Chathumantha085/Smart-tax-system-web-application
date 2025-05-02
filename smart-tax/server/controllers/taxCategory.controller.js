const TaxCategory = require('../models/taxCategory.model');

exports.getAllTaxCategories = async (req, res) => {
  try {
    const taxCategories = await TaxCategory.findAll();
    res.json(taxCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTaxCategoryById = async (req, res) => {
  try {
    const taxCategory = await TaxCategory.findById(req.params.id);
    if (!taxCategory) {
      return res.status(404).json({ error: 'Tax category not found' });
    }
    res.json(taxCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTaxCategory = async (req, res) => {
  try {
    const { name, description, tax_percentage, is_active } = req.body;
    if (!name || !tax_percentage) {
      return res.status(400).json({ error: 'Name and tax percentage are required' });
    }
    const newTaxCategory = await TaxCategory.create({
      name,
      description,
      tax_percentage,
      is_active
    });
    res.status(201).json(newTaxCategory);  
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTaxCategory = async (req, res) => {
  try {
    const { name, description, tax_percentage, is_active } = req.body;
    const updatedTaxCategory = await TaxCategory.update(req.params.id, {
      name,
      description,
      tax_percentage,
      is_active
    });
    res.json(updatedTaxCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTaxCategory = async (req, res) => {
  try {
    await TaxCategory.delete(req.params.id);
    res.json({ message: 'Tax category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};