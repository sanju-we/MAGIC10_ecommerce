const Order = require('../../models/orderSchema')
const User = require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const Product = require('../../models/productSchema')
const Wallet = require('../../models/walletSchema')

const getorderList = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('product')
      .populate('userId')
      .sort({ createdOn: -1 })

    res.render("orderList", {
      orders,
      title: "Order Management",
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).send('Internal Server Error')
  }
}

const getorderdetails = async (req, res) => {
  try {
    const orderId = req.params.orderId
    const orderData = await Order.findById(orderId)
      .populate('product')
      .populate('userId')
    // const addressId = orderData.address
    // const addressDoc = await Address.findOne(
    //   { "address._id": addressId },
    //   { "address.$": 1 }
    // )
    // const address = addressDoc ? addressDoc.address[0] : null
    res.render('admin-viewDetails', { order: orderData })
  } catch (error) {
    console.error('error occur while getorderdetails', error)
    return res.send('Internal Server Error')
  }
}

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body
    const order = await Order.findById(orderId)
    if (!order) {
      return res.json({ success: false, message: `Can't find the order` })
    }
    if (order.status === 'Cancelled') {
      return res.json({ success: false, message: `Can't change the order it already Cancelled` })
    }
    order.status = status
    await order.save()
    return res.json({ success: true })
  } catch (error) {
    console.error('error occur while updateStatus', error)
    return res.send('Internal Server Error')
  }
}

const orderCancelled = async (req, res) => {
  try {
    const { orderId } = req.body
    const order = await Order.findById(orderId)
    if (!order) {
      return json({ success: false, message: `Can not find the order` })
    }
    if (order.status === 'Cancelled') {
      return json({ success: false, message: `Order already cancelled` })
    }
    const product = await Product.findById(order.product)
    const productCound = product.stock + order.quantity
    product.stock = productCound
    await product.save()
    order.status = 'Cancelled'
    await order.save()
    return res.json({ success: true })
  } catch (error) {
    console.error('error occur while orderCancelled', error)
    return res.send('Internal Server Error')
  }
}

const orderReturn = async (req, res) => {
  try {
    const { orderId, action } = req.body
    console.log('product:', action)
    const orderData = await Order.findOne({ _id: orderId })
    if (action === 'approve') {
      orderData.status = 'Returned'
      // product restoring
      const product = await Product.findById(orderData.product)
      product.stock += orderData.quantity
      await product.save()
      // refund the money
      const wallet = await Wallet.findOne({ userId: orderData.userId })
      wallet.balance += orderData.finalAmount
      wallet.transactions.push({ type: 'credit', amount: orderData.finalAmount, description: `Refund of ${orderId}` })
      await wallet.save()
    } else {
      orderData.status = 'Delivered'
    }
    orderData.save()
    return res.json({ success: true })
  } catch (error) {
    console.error('error occur while orderCancelled', error)
    return res.send('Internal Server Error')
  }
}

const loadSalesReport = async (req, res) => {
  try {
    res.render('salesReport');
  } catch (error) {
    console.error('error occur while loadSalesReport', error)
    return res.redirect('/pageerror')
  }
}

const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const orders = await Order.find({
      createdOn: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate('product');

    const summary = {
      salesCount: orders.length,
      orderAmount: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      discountAmount: orders.reduce((sum, order) => sum + order.discount, 0),
    };

    res.json({ success: true, orders, summary });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ success: false, message: "Error generating sales report" });
  }
};

module.exports = {
  getorderList,
  getorderdetails,
  updateStatus,
  orderCancelled,
  orderReturn,
  loadSalesReport,
  generateSalesReport
}