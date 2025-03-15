const Order = require('../../models/orderSchema')
const User = require('../../models/userSchema')
const Cart = require('../../models/cartSchema')
const Address = require('../../models/addressSchema')
const Product = require('../../models/productSchema')
const Coupon = require('../../models/couponSchema')
const Wallet = require('../../models/walletSchema')
const Razorpay = require('razorpay')
const crypto = require('crypto')

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

const addOrder = async (req, res) => {
  try {
    const { address, paymentMethod, totalAmount, couponCode } = req.body
    console.log('req.body:', req.body)

    const userId = req.session.user
    const addresss = await Address.findOne(
      { userId: userId, "address._id": address },
      { "address.$": 1 }
    )
    const addressData = addresss && addresss.address.length > 0 ? addresss.address[0] : null
    console.log('addressData:', addressData)
    const user = await User.findById(userId)
    const variants = await Cart.findOne({ userId: userId })
    console.log('variants:', variants.items.map((x) => x.size));
    const cart = await Cart.findOne({ userId }).populate("items.productId")

    if (!cart || cart.items.length === 0) {
      return res.status(400).redirect("/pageNotFound")
    }

    const singleCouponCode = Array.isArray(couponCode) ? couponCode[0] : couponCode

    let discountAmount = 0
    let discountDetails = cart.items.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      originalPrice: item.totalPrice,
      discount: 0,
      discountedPrice: item.totalPrice,
    }))

    if (singleCouponCode) {
      const couponData = await Coupon.findOne({ name: singleCouponCode })
      if (couponData && couponData.minPrice <= totalAmount) {
        discountAmount = couponData.offerPrice
        const cartTotalValue = cart.items.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        )

        discountDetails = cart.items.map((item) => {
          const itemContribution = item.totalPrice / cartTotalValue
          const itemDiscount = discountAmount * itemContribution
          return {
            productId: item.productId._id,
            quantity: item.quantity,
            originalPrice: item.totalPrice,
            discount: itemDiscount,
            discountedPrice: item.totalPrice - itemDiscount,
          }
        })
      }
    }

    let orders = []

    for (const item of cart.items) {
      const discountDetail = discountDetails.find(
        (d) => d.productId.toString() === item.productId._id.toString()
      )
      const itemDiscount = discountDetail ? discountDetail.discount : 0
      const finalItemAmount = item.totalPrice - itemDiscount

      const newOrder = new Order({
        userId: userId,
        product: item.productId._id,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.productId.salePrice,
        totalPrice: item.totalPrice,
        discount: itemDiscount,
        discountAmount: itemDiscount,
        finalAmount: finalItemAmount,
        couponApplied: !!singleCouponCode,
        couponCode: singleCouponCode || null,
        paymentMethod: paymentMethod,
        address: {
          fullName: addressData.fullName,
          city: addressData.city,
          state: addressData.State,
          PINcode: addressData.PINcode,
          LandMark: addressData.LandMark,
        },
        invoiceDate: new Date(),
        status: "Pending",
        returnReason: "none",
        createdOn: new Date(),
      })

      await newOrder.save()
      orders.push(newOrder)

      const product = await Product.findOne({ _id: item.productId._id });
      if (product) {
        const variant = product.variants.find(v => v.size === item.size && v.color === item.color);
        if (variant) {
          variant.stock = Math.max(0, variant.stock - item.quantity);
        }
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
      }
    }

    await Cart.findOneAndDelete({ userId })

    const populatedOrders = await Order.find({
      _id: { $in: orders.map((x) => x._id) },
    }).populate("product")

    res.render("orderSuccess", { orders: populatedOrders, user })
  } catch (error) {
    console.error("Error occurred while placing orders:", error)
    return res.redirect("/pageNotFound")
  }
}



const orderSuccess = async (req, res) => {
  try {
    const userId = req.session.user
    if (!userId) {
      return res.redirect('/login')
    }

    const orders = await Order.find({ userId: userId })
      .sort({ createdOn: -1 })
      .populate('product')

    res.render('orderSuccess', { orders })
  } catch (error) {
    console.error('Error occurred while loading order success page:', error)
    return res.redirect('/pageNotFound')
  }
}

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.redirect('/login');
    }

    const user = await User.findById(userId);

    let page = parseInt(req.query.page) || 1;
    let limit = 5;

    if (page < 1) page = 1;

    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ userId });

    const orders = await Order.find({ userId })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product');

    const totalPages = Math.ceil(totalOrders / limit);

    res.render('orderHistory', {
      orders,
      user,
      currentPage: page,
      totalPages,
      limit
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).redirect('/pageNotFound');
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body
    const userId = req.session.user
    const orderData = await Order.findById(orderId)
    if (!orderData) {
      return res.json({ success: false, message: 'Order not found' })
    }
    const product = await Product.findById(orderData.product)
    const productCound = product.stock + orderData.quantity
    product.stock = productCound
    await product.save()
    if (orderData.paymentMethod != 'cod') {
      console.log(orderData.userId)
      const wallet = await Wallet.findOne({ userId: orderData.userId })
      if (!wallet) {
        wallet = new Wallet({
          userId,
          balance: orderData.finalAmount,
          transactions: [
            { type: 'credit', amount: orderData.finalAmount, description: `Refund of ${orderId}` },
          ],
          date: new Date(),
        });
      } else {
        wallet.balance += orderData.finalAmount;
        wallet.transactions.push({
          type: 'credit',
          amount: orderData.finalAmount,
          description: `Refund of ${orderId}`,
          date: new Date(),
        });
      }

      await wallet.save();
    }
    orderData.status = 'Cancelled'
    await orderData.save()
    return res.json({ success: true })
  } catch (error) {
    console.error('error occur while cancelOrder', error)
    return res.redirect('/pageNotFound')
  }
}

const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("product")
    if (!order) {
      return res.redirect("/pageNotFound")
    }
    res.render("orderDetails", { order })
  } catch (error) {
    console.error("Error fetching order details:", error)
    res.redirect("/pageNotFound")
  }
}

const returnOrder = async (req, res) => {
  try {
    const userId = req.session.user
    const { orderId, reason } = req.body
    const orderData = await Order.findById(orderId)
    if (!orderData) {
      return res.json({ success: false })
    }
    orderData.status = 'Return Request'
    orderData.returnReason = reason
    await orderData.save()
    return res.json({ success: true, message: 'Your order return request send successfully' })
  } catch (error) {
    console.error('error occur while returnOrder', error)
    return res.redirect('/pageNotFound')
  }
}

const createRazorpay = async (req, res) => {
  try {
    const { totalAmount } = req.body
    if (!totalAmount) {
      return res.status(400).json({ success: false, message: 'Total amount missing' })
    }

    const amountInPaise = totalAmount * 100
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: "receipt#" + Date.now(),
      payment_capture: 1
    }

    const order = await razorpayInstance.orders.create(options)
    console.log("Razorpay Order created:", order)
    return res.json({ success: true, order })
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    return res.status(500).json({ success: false, message: "Server error creating order" })
  }
}

const verifyRazorpay = async (req, res) => {
  try {
    const { order_id, payment_id, razorpay_signature } = req.body

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + '|' + payment_id)
      .digest('hex')

    if (generatedSignature === razorpay_signature) {
      return res.json({ success: true, message: "Payment verified" })
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" })
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error)
    return res.status(500).json({ success: false, message: "Server error verifying payment" })
  }
}

const loadFailure = async (req, res) => {
  try {
    const { orderId, error } = req.query
    res.render('oderFailure', { orderId: orderId || '', error: error || '' })
  } catch (error) {
    console.error("Error occur while loadFailure:", error)
    return res.status(500).redirect('/pageNotFound')
  }
}

module.exports = {
  addOrder,
  orderSuccess,
  getOrderHistory,
  cancelOrder,
  getOrderDetails,
  returnOrder,
  createRazorpay,
  verifyRazorpay,
  loadFailure
}