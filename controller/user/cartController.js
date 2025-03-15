const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Cart = require('../../models/cartSchema')
const Address = require('../../models/addressSchema')
const Coupon = require('../../models/couponSchema')

const addToCart = async (req, res) => {
  try {
    const { productId, size, color } = req.body;
    const userId = req.session.user;

    if (!userId) {
      return res.json({ success: false, message: "Please log in to add items to your cart." });
    }

    if (!size || !color) {
      return res.json({ success: false, message: "Please select a size and color." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found." });
    }

    const variant = product.variants.find(v => v.size === size && v.color === color);
    if (!variant) {
      return res.json({ success: false, message: "Selected variant not available." });
    }

    if (variant.stock <= 0) {
      return res.json({ success: false, message: "Selected variant is out of stock." });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(item =>
      item.productId.toString() === productId &&
      item.size === size &&
      item.color === color
    );

    const shippingCost = 0;

    if (existingItem) {
      existingItem.quantity += 1;
      if (existingItem.quantity > variant.stock) {
        return res.json({ success: false, message: "Cannot add more items than available stock." });
      }
      existingItem.totalPrice = (existingItem.price * existingItem.quantity) + existingItem.shipping;
    } else {
      cart.items.push({
        productId,
        size,
        color,
        quantity: 1,
        price: variant.price,
        shipping: shippingCost,
        totalPrice: (variant.price * 1) + shippingCost
      });
    }

    await cart.save();
    res.json({ success: true, message: "Product added to cart." });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.json({ success: false, message: "An error occurred." });
  }
};


const loadCart = async (req, res) => {
  try {
    const userId = req.session.user
    if (!userId) {
      return res.json({ success: false })
    }

    const user = await User.findById(userId)
    const cart = await Cart.findOne({ userId }).populate('items.productId')

    if (!cart || cart.items.length === 0) {
      return res.render('cart', {
        cartItems: [],
        user
      })
    }

    const filteredCartItems = cart.items.filter(item => {
      return item.productId && !item.productId.isBlocked && item.productId.stock > 0
    })

    const subtotal = filteredCartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    let shipping
    if (subtotal >= 100) {
      shipping = 0
    } else {
      shipping = 100
    }

    const total = subtotal + shipping
    res.render('cart', {
      cartItems: filteredCartItems,
      user,
      subtotal,
      shipping,
      total
    })

  } catch (error) {
    console.error('Error occurred while loading the cart:', error)
    res.redirect('/pageNotFound')
  }
}


const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.user
    const { productId } = req.body
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    const cart = await Cart.findOne({ userId })
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' })
    }
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    )
    await cart.save()
    return res.json({ success: true })
  } catch (error) {
    console.error('Error removing item from cart:', error)
    return res.status(500).json({ success: false, message: 'Failed to remove item' })
  }
}

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.user
    const { productId, newQuantity } = req.body
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    const cart = await Cart.findOne({ userId })
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' })
    }
    const item = cart.items.find(i => i.productId.toString() === productId)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' })
    }
    const qty = parseInt(newQuantity, 10)
    item.quantity = qty
    item.totalPrice = item.price * qty
    await cart.save()
    return res.json({ success: true })
  } catch (error) {
    console.error('Error updating cart quantity:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const loadCheckOut = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    const coupons = await Coupon.find({expireOn :{$gt:new Date()}})

    if (!cart || cart.items.length === 0) {
      return res.redirect('/shop');
    }

    const cartItems = cart.items.filter(item => item.productId && !item.productId.isBlocked && item.productId.stock > 0);

    let subTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    let shipping = subTotal >= 1000 ? 0 : 100;
    let totalAmount = subTotal + shipping;
    let discount =  subTotal -totalAmount

    const addressData = await Address.findOne({ userId });
    const add = addressData ? addressData.address : [];

    res.render('checkOut', { user, cartItems, subTotal, shipping, add, totalAmount,discount,coupons });
  } catch (error) {
    console.error('Error occurred while loading checkout:', error);
    return res.redirect('/pageNotFound');
  }
};

const loadCheckOutCoupon = async(req,res)=>{
  try {
    const userId = req.session.user
    const user = await User.findById(userId)
    const Coupons = await Coupon.find({ expireOn: { $gte: new Date() } })
    console.log('Coupons:',Coupons)
    res.render('showCoupons',{coupons:Coupons, user})
  } catch (error) {
    
  }
}

module.exports = {
  addToCart,
  loadCart,
  removeCartItem,
  updateCartQuantity,
  loadCheckOut,
  loadCheckOutCoupon
}