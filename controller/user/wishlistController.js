const Wishlist = require('../../models/wishlistSchema')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const HttpStatus = require('../../config/httpStatusCode')

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect('/login');
    }

    // Fetch wishlist and populate product details
    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: "items.productId",
      model: "Product"
    });

    if (!wishlist || wishlist.items.length === 0) {
      return res.render('wishlist', { wishlistItems: [], user });
    }

    // Format wishlist items
    const formattedProducts = wishlist.items.map(item => ({
      _id: item.productId._id,
      name: item.productId.productName,
      price: item.productId.salePrice,
      image: item.productId.image && item.productId.image.length > 0 ? item.productId.image : ['/path/to/default-image.jpg'],
      size: item.size,
      color: item.color 
    }));

    console.log('formattedProducts:',formattedProducts)

    res.render('wishlist', { wishlistItems: formattedProducts, user });
  } catch (error) {
    console.error('Error loading wishlist:', error);
    res.redirect('/pageNotFound');
  }
};




const addToWishlist = async (req, res) => {
  try {
    const { productId, size, color } = req.body;
    const userId = req.session.user;

    const userData = await User.findById(userId)
    if (!userData) {
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
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Product ID missing" })
    }

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User not authenticated" })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: "User not found" })
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
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to remove item" })
  }
}

module.exports = {
  loadWishlist,
  addToWishlist,
  removeProduct
} 