const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const User = require('../../models/userSchema')
const mongoose = require('mongoose')
const HttpStatus = require('../../config/httpStatusCode')

const productDetails = async (req, res) => {
  try {
      const userId = req.session.user
      const userData = userId ? await User.findById(userId) : null

      const  productId = req.params.productId

      const product = await Product.findById(productId).populate('category')

      if (!product) {
          return res.redirect('/404')
      }

      const findCategory = product.category
      const categoryOffer = findCategory ? findCategory.categoryOffer || 0 : 0
      const productOffer = product.productOffer || 0
      const totalOffer = categoryOffer + productOffer

      const relatedProducts = await Product.find({
          category: product.category, 
          _id: { $ne: product._id } ,
          isBlocked : false,
          stock:{$gt:0}
      }).limit(4)

      res.render('product-detail', { product, totalOffer, user: userData, relatedProducts })

  } catch (error) {
      console.error("Error fetching product details:", error)
      res.redirect('/404')
  }
}


const shopPage = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true })
    console.log('Fetched categories:', categories.map(cat => ({ id: cat._id, name: cat.name })))
    const categoryFilter = req.query.category
    
    let query = {
      isBlocked: false,
      stock: { $gt: 0 },
    }
    
    if (categories && categories.length > 0) {
      query.category = { $in: categories.map(category => category._id) }
    } else {
      console.warn('No listed categories found. No category filter applied.')
    }
    
    if (req.query.search) {
      query.productName = { $regex: req.query.search, $options: "i" } 
      console.log('Search filter applied:', req.query.search)
    }
    
    if (categoryFilter && categoryFilter !== "all") {
      try {
        const categoryId =new mongoose.Types.ObjectId(categoryFilter)
        if (!categories.some(cat => cat._id.equals(categoryId))) {
          console.log('categoryId:',categoryId)
          console.warn('Invalid or unlisted category ID:', categoryFilter)
          return res.render('shop', { product: [], categories, message: 'Invalid category selected' })
        }
        query.category = categoryId
        console.log('Category filter applied:', categoryFilter)
      } catch (error) {
        console.error('Invalid category ID format:', error)
        return res.render('shop', { product: [], categories, message: 'Invalid category selected' })
      }
    }

    let productData = await Product.find(query).sort({ createdAt: -1 })
    console.log('Fetched products:', productData.map(p => ({ id: p._id, name: p.productName, category: p.category })))

    if (!productData || productData.length === 0) {
      console.warn('No products found with the given filters:', query)
    }

    res.render('shop', { product: productData, categories })
  } catch (error) {
    console.error('Error in shopPage:', error)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Server Error')
  }
}



module.exports = {
  productDetails,
  shopPage
}