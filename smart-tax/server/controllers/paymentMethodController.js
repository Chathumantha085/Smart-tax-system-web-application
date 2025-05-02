const PaymentMethod = require('../models/PaymentMethod');

exports.getUserPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.findByUserId(req.user.id);
    res.json(paymentMethods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id, req.user.id);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    res.json(paymentMethod);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPaymentMethod = async (req, res) => {
  try {
    const { cardNumber, cardType, cvv, expiryDate, isDefault, nickname } = req.body;

    // Validate required fields
    if (!cardNumber || !cardType || !cvv || !expiryDate) {
      return res.status(400).json({ message: 'Missing required card details' });
    }

    // Split expiryDate into month and year
    const [expiryMonth, expiryYear] = expiryDate.split('/');

    // Basic validation for expiry date
    if (!expiryMonth || !expiryYear || expiryMonth.length !== 2 || expiryYear.length !== 2) {
      return res.status(400).json({ message: 'Invalid expiry date format. Use MM/YY' });
    }

    const paymentMethodData = {
      user_id: req.user.id,
      nickname: nickname || null, // Explicit null instead of undefined
      card_type: cardType,
      card_number: cardNumber,
      expiry_month: expiryMonth,
      expiry_year: `20${expiryYear}`,
      cvv: cvv,
      is_default: Boolean(isDefault), // Ensure boolean value
      status: 'active'
    };

    const id = await PaymentMethod.create(paymentMethodData);

    if (paymentMethodData.is_default) {
      await PaymentMethod.setDefault(id, req.user.id);
    }

    res.status(201).json({
      id,
      message: 'Payment method added successfully',
      lastFour: cardNumber.slice(-4)
    });
  } catch (error) {
    console.error('Payment method creation error:', error);
    res.status(500).json({
      message: 'Failed to add payment method',
      error: error.message // Include the actual error message
    });
  }
};

exports.updatePaymentMethod = async (req, res) => {
  try {
    const { nickname, isDefault, expiryDate } = req.body;

    const updateData = {
      nickname: nickname || null, // Convert to null if undefined
      is_default: Boolean(isDefault), // Ensure boolean
      status: 'active' // Default status
    };

    if (expiryDate) {
      const [expiryMonth, expiryYear] = expiryDate.split('/');
      if (!expiryMonth || !expiryYear || expiryMonth.length !== 2 || expiryYear.length !== 2) {
        return res.status(400).json({ message: 'Invalid expiry date format. Use MM/YY' });
      }
      updateData.expiry_month = expiryMonth;
      updateData.expiry_year = `20${expiryYear}`;
    }

    await PaymentMethod.update(
      req.params.id,
      req.user.id,
      updateData
    );

    if (updateData.is_default) {
      await PaymentMethod.setDefault(req.params.id, req.user.id);
    }

    res.json({ message: 'Payment method updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      message: 'Failed to update payment method',
      error: error.message
    });
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    await PaymentMethod.delete(req.params.id, req.user.id);
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    await PaymentMethod.setDefault(req.params.id, req.user.id);
    res.json({ message: 'Default payment method updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};