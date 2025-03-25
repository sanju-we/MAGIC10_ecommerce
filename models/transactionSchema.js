const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const transactionSchema = new mongoose.Schema({
  transactionId: { 
    type: String, 
    default: () => `TRANSACTION-${uuidv4()}`,
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  transactionType: { 
    type: String, 
    enum: ["credit", "debit"],
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ["wallet", "online", "refund", "admin"], 
    required: true 
  },
  purpose: { 
    type: String, 
    enum: ["purchase", "refund", "wallet_add", "wallet_withdraw", "cancellation", "return"], 
    required: true 
  },
  orders: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order" 
  }], 
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
