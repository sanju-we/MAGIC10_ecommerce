const Wallet = require('../../models/walletSchema')
const User = require('../../models/userSchema')
const Transaction = require('../../models/transactionSchema')

const loadTransaction = async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.transactionType) {
      filters.transactionType = req.query.transactionType;
    }
    if (req.query.paymentMethod) {
      filters.paymentMethod = req.query.paymentMethod;
    }
    if (req.query.purpose) {
      filters.purpose = req.query.purpose;
    }
    if (req.query.userId) {
      filters.userId = req.query.userId;
    }
    if (req.query.startDate && req.query.endDate) {
      filters.createdAt = { 
        $gte: new Date(req.query.startDate), 
        $lte: new Date(req.query.endDate) 
      };
    }

    const transactions = await Transaction.find(filters).populate("userId orders");

    res.render("transaction", { transactions });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Server error" });
  }
}

const transactionDetails =  async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("userId orders");

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.render("admin/transactionDetail", { transaction });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  loadTransaction,
  transactionDetails
}