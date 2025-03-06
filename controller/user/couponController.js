const Coupon = require('../../models/couponSchema')
const Cart = require('../../models/cartSchema')

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, totalAmount } = req.body;
    const userId = req.session.user;

    const couponData = await Coupon.findOne({ name: couponCode });
    if (!couponData) {
      return res.json({ success: false, message: "Invalid coupon code" });
    }

    if(couponData.usedBy.includes(userId)){
      return res.json({ success: false, message: "User already used this coupon" });
    }

    if (couponData.minPrice > totalAmount) {
      return res.json({
        success: false,
        message: `Minimum ₹${couponData.minPrice} required`,
      });
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    const discountAmount = couponData.offerPrice;
    const newTotal = totalAmount - discountAmount;

    const cartTotalValue = cart.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    const discountDetails = cart.items.map((item) => {
      const itemContribution = item.totalPrice / cartTotalValue; 
      const itemDiscount = discountAmount * itemContribution;
      return {
        productId: item.productId._id,
        quantity: item.quantity,
        originalPrice: item.totalPrice,
        discount: itemDiscount,
        discountedPrice: item.totalPrice - itemDiscount,
      };
    });

    couponData.usedBy.push(userId)
    await couponData.save()

    return res.json({
      success: true,
      discountAmount,
      newTotal, 
      couponCode,
      discountDetails,
    });
  } catch (error) {
    console.error("Error verifying Apply offer", error);
    return res.status(500).json({
      success: false,
      message: "Server error applying offer",
    });
  }
};

module.exports = { applyCoupon };