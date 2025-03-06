const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const multer = require("multer")


// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../public/uploads/")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// Multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false)
    }
    cb(null, true)
  }
}).single("image")

// Controller function to handle image upload
const saveImage = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ success: false, message: err.message })
    }
    if (!req.file) {
      return res.json({ success: false, message: "No file uploaded" })
    }

    res.json({
      success: true,
      message: "Image uploaded successfully",
      filePath: `/uploads/${req.file.filename}`
    })
  })
}

// render add product page
const getAddProducts = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true })
    res.render('product-add', { cat: category })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.redirect('/pageerror')
  }
}

// handling adding a new product
const postAddProduct = async (req, res) => {
  try {
    console.log("Request received at /admin/addProducts")
    console.log("Form Data:", req.body)
    console.log("Uploaded Files:", req.files)

    const {
      productName,
      description,
      fullDescription,
      brand,
      regularPrice,
      salePrice,
      stock,
      category,
      variants // Expecting variants as JSON string from frontend
    } = req.body

    // Validate required fields
    if (!productName || !description || !fullDescription || !brand ||
      !regularPrice || !salePrice || !stock || !category) {
      return res.status(400).json({ success: false, message: "All fields are required." })
    }

    // Convert category name to ObjectId
    const categoryDoc = await Category.findOne({ name: category })
    if (!categoryDoc || !mongoose.Types.ObjectId.isValid(categoryDoc._id)) {
      return res.status(400).json({ success: false, message: "Invalid category." })
    }

    // Handle images
    let imagePaths = []
    if (req.files) {
      for (let key in req.files) {
        for (let file of req.files[key]) {
          const fileName = `product-${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`
          const outputDir = path.join(__dirname, "../../public/uploads/products")

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
          }

          const outputPath = path.join(outputDir, fileName)

          // // Resize and save the image using sharp
          // await sharp(file.buffer) // Use file.buffer assuming multer memory storage
          //   .resize(500, 500)
          //   .toFormat("webp")
          //   .toFile(outputPath)

          imagePaths.push(`/uploads/products/${fileName}`)
        }
      }
    }

    // Parse and validate variants
    let parsedVariants = []
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants)
        if (!Array.isArray(parsedVariants)) {
          return res.status(400).json({ success: false, message: "Variants must be an array." })
        }

        // Validate each variant
        for (const variant of parsedVariants) {
          if (!variant.size || !variant.color || !variant.price || !variant.stock) {
            return res.status(400).json({ success: false, message: "Each variant must include size, color, price, and stock." })
          }
          if (typeof variant.size !== 'string' || typeof variant.color !== 'string' ||
            typeof variant.price !== 'number' || typeof variant.stock !== 'number') {
            return res.status(400).json({ success: false, message: "Invalid variant data types." })
          }
          if (variant.price <= 0 || variant.stock < 0) {
            return res.status(400).json({ success: false, message: "Price must be positive and stock cannot be negative." })
          }
          // Validate size format (alphabetical or numerical as string)
          if (!/^[a-zA-Z0-9]+$/.test(variant.size)) {
            return res.status(400).json({ success: false, message: "Size must be a string (e.g., S, M, L, or 6, 7, 8)." })
          }
        }
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid variants format." })
      }
    }

    // Create new product
    const newProduct = new Product({
      productName,
      description,
      fullDescription,
      brand,
      regularPrice,
      salePrice,
      stock,
      category: categoryDoc._id,
      image: imagePaths,
      variants: parsedVariants
    })

    // Save the product
    await newProduct.save()
    console.log("Product saved successfully!")

    res.redirect("/admin/products")
  } catch (error) {
    console.error("Error adding product:", error)
    res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || ""
    const page = req.query.page || 1
    const limit = 4
    const productData = await Product.find({}).limit(limit * 1).skip((page - 1) * limit).populate('category').exec()

    const count = await Product.find({
      $or: [
        { productName: { $regex: new RegExp("." + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
      ]
    }).countDocuments()

    const category = await Category.find({ isListed: true })

    console.log(category)

    if (category) {
      res.render('products', {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category
      })
    } else {
      res.render('pageerror')
    }
  } catch (error) {
    res.redirect('/pageerror')
  }
}

const blockProduct = async (req, res) => {
  try {
    const { id } = req.body
    console.log("Product ID:", id)

    const isProduct = await Product.findOne({ _id: id }) // Use findOne instead of find
    console.log("Found Product:", isProduct)

    if (!isProduct) {
      return res.json({ success: false, message: "Product not found. Try again." })
    }

    console.log("Blocking product...")
    const blocked = await Product.findByIdAndUpdate(id, { isBlocked: true }, { new: true })

    if (blocked) {
      return res.json({ success: true, message: "Product blocked successfully" })
    } else {
      return res.json({ success: false, message: "Error occurred while blocking product. Please try again." })
    }
  } catch (error) {
    console.error("Error blocking product:", error)
    res.status(500).redirect("/pageerror")
  }
}

const unblockProduct = async (req, res) => {
  try {
    const id = req.body.id
    console.log("Product ID:", id)

    const isProduct = await Product.findOne({ _id: id }) // Use findOne instead of find
    console.log("Found Product:", isProduct)

    if (!isProduct) {
      return res.json({ success: false, message: "Product not found. Try again." })
    }

    console.log("Blocking product...")
    const blocked = await Product.findByIdAndUpdate(id, { isBlocked: false }, { new: true })

    if (blocked) {
      return res.json({ success: true, message: "Product blocked successfully" })
    } else {
      return res.json({ success: false, message: "Error occurred while blocking product. Please try again." })
    }
  } catch (error) {
    console.error("Error blocking product:", error)
    res.status(500).redirect("/pageerror")
  }
}

const editProduct = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findById(id).populate("category")
    const categories = await Category.find() // Assuming you have categories

    if (!product) {
      return res.status(404).send("Product not found")
    }

    res.render("product-edit", { product, cat: categories })
  } catch (error) {
    console.error(error)
    res.status(500).send("Server error")
  }
}

// In productController.js - update deleteSingleImage
const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameToServer, productIdToServer, imageIndex } = req.body

    const product = await Product.findById(productIdToServer)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" })
    }

    // Remove image from array using splice
    product.image.splice(imageIndex, 1)

    // Add empty slot if needed to maintain 4 positions
    while (product.image.length < 4) {
      product.image.push("")
    }

    // Delete file from storage
    if (imageNameToServer) {
      const imagePath = path.join(__dirname, "../../public", imageNameToServer)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    await product.save()
    res.json({ success: true, message: "Image deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

const postEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.redirect('/admin/products') // Redirect if product not found
    }

    // Update basic product fields
    product.productName = req.body.productName
    product.description = req.body.description
    product.fullDescription = req.body.fullDescription
    product.regularPrice = parseFloat(req.body.regularPrice)
    product.salePrice = parseFloat(req.body.salePrice)
    product.stock = parseInt(req.body.stock)
    product.brand = req.body.brand
    product.category = req.body.category

    // Parse and validate variants
    let parsedVariants = []
    if (req.body.variants) {
      try {
        parsedVariants = JSON.parse(req.body.variants)
        if (!Array.isArray(parsedVariants)) {
          return res.status(400).json({ success: false, message: "Variants must be an array." })
        }

        // Validate each variant
        for (const variant of parsedVariants) {
          if (!variant.size || !variant.color || !variant.price || !variant.stock) {
            return res.status(400).json({ success: false, message: "Each variant must include size, color, price, and stock." })
          }
          if (typeof variant.size !== 'string' || typeof variant.color !== 'string' ||
            typeof variant.price !== 'number' || typeof variant.stock !== 'number') {
            return res.status(400).json({ success: false, message: "Invalid variant data types." })
          }
          if (variant.price <= 0 || variant.stock < 0) {
            return res.status(400).json({ success: false, message: "Price must be positive and stock cannot be negative." })
          }
          if (!/^[a-zA-Z0-9]+$/.test(variant.size)) {
            return res.status(400).json({ success: false, message: "Size must be a string (e.g., S, M, L, or 6, 7, 8)." })
          }
        }
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid variants format." })
      }
    }
    product.variants = parsedVariants

    // Handle image updates
    for (let i = 1; i <= 4; i++) {
      const file = req.files[`image${i}`]?.[0]
      if (file) {
        // Remove old image if exists
        if (product.image[i - 1]) {
          const oldPath = path.join(__dirname, '../../public', product.image[i - 1])
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

        // Process and save new image
        const outputDir = path.join(__dirname, '../../public/uploads/products')
        const fileName = `product-${Date.now()}-${i}.webp`

        await sharp(file.path)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(outputDir, fileName))

        product.image[i - 1] = `/uploads/products/${fileName}`
        fs.unlinkSync(file.path)
      }
    }

    await product.save()
    res.redirect('/admin/products') // Redirect on success

  } catch (error) {
    console.error(error)
    res.redirect('/admin/products') // Redirect on error
  }
}


/////////////////////////////////////////////////////

const addProductOffer = async (req, res) => {
  try {
    const { productId, percentage } = req.body
    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({ status: false, message: "Product not found" })
    }

    product.productOffer = parseInt(percentage)
    product.salePrice = Math.round(product.regularPrice * (1 - percentage / 100))
    await product.save()

    res.json({ status: true, message: "Offer added successfully" })
  } catch (error) {
    console.error("Error in addProductOffer:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body
    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({ status: false, message: "Product not found" })
    }

    product.productOffer = 0
    product.salePrice = product.regularPrice
    await product.save()

    res.json({ status: true, message: "Offer removed successfully" })
  } catch (error) {
    console.error("Error in removeProductOffer:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findOne({ _id: id }).populate("category")
    const categories = await Category.find({ isListed: true }) // Fetch only listed categories

    if (!product) {
      return res.status(404).send("Product not found")
    }

    res.render("product-edit", {
      product: product,
      cat: categories,
    })
  } catch (error) {
    console.error("Error in getEditProduct:", error)
    res.redirect("/pageerror")
  }
}

module.exports = {
  getAddProducts,
  postAddProduct,
  saveImage,
  getAllProducts,
  blockProduct,
  unblockProduct,
  editProduct,
  deleteSingleImage,
  postEditProduct,
  addProductOffer,
  removeProductOffer
}
