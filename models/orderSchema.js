const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema({
  orderId: {
    type: String,
    default: () => `ORDER-${uuidv4()}`,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  size: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  couponCode: {
    type: String,
    default: null,
  },
  couponApplied: {
    type: Boolean,
    default: false,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  address: {
    fullName: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    PINcode: { type: String, required: true },
    LandMark: { type: String, required: true },
  },
  invoiceDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"],
  },
  returnReason: {
    type: String,
    required: false,
    default: "none",
  },
  paymentMethod: {
    type: String,
  },
  createdOn: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;