const Wishlist = require('../../models/wishlistSchema')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user
    const user = await User.findById(userId)
    
    if (!user) {
      return res.redirect('/login')
    }

    const products = await Product.find({ _id: { $in: user.whishlist },isBlocked:false,stock:{$gt:0} }).populate('category')

    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      image: product.image && product.image.length > 0 ? product.image : ['/path/to/default-image.jpg']
    }))

    res.render('wishlist', { wishlistItems: formattedProducts,user })
  } catch (error) {
    console.error('Error loading wishlist:', error)
    res.redirect('/pageNotFound')
  }
}


const addToWishlist = async (req, res) => {
  try {
      const { productId, size, color } = req.body;
      const userId = req.session.user;

      if (!userId) {
          return res.json({ status: false, message: "Please log in to add items to your wishlist." });
      }

      if (!size || !color) {
          return res.json({ status: false, message: "Please select a size and color." });
      }

      const product = await Product.findById(productId);
      if (!product) {
          return res.json({ status: false, message: "Product not found." });
      }

      const variant = product.variants.find(v => v.size === size && v.color === color);
      if (!variant) {
          return res.json({ status: false, message: "Selected variant not available." });
      }

      let wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
          wishlist = new Wishlist({ userId, items: [] });
      }

      const existingItem = wishlist.items.find(item =>
          item.productId.toString() === productId &&
          item.size === size &&
          item.color === color
      );

      if (existingItem) {
          return res.json({ status: false, message: "This variant is already in your wishlist." });
      }

      wishlist.items.push({
          productId,
          size,
          color
      });

      await wishlist.save();
      res.json({ status: true, message: "Product added to wishlist." });
  } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.json({ status: false, message: "An error occurred." });
  }
};

const removeProduct = async (req, res) => {
  try {
    const productId = req.body.productId
    const userId = req.session.user

    console.log("Received request to delete:", productId)
    console.log("User ID from session:", userId)

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID missing" })
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    console.log("User's current wishlist before deletion:", user.whishlist)

    const mongoose = require("mongoose")
    const objectIdProductId = new mongoose.Types.ObjectId(productId)

    const del = await User.updateOne(
      { _id: userId },
      { $pull: { whishlist: objectIdProductId } }
    )

    console.log("Update operation result:", del)

    if (del.modifiedCount === 0) {
      return res.json({ success: false, message: "Product not found in wishlist or already removed" })
    }

    console.log("Successfully removed product from wishlist.")
    return res.json({ success: true })
  } catch (error) {
    console.error("Error removing item from wishlist:", error)
    res.status(500).json({ success: false, message: "Failed to remove item" })
  }
}




module.exports = {
  loadWishlist,
  addToWishlist,
  removeProduct
} 