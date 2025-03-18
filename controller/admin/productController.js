const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const multer = require("multer")
const HttpStatus = require('../../config/httpStatusCode')

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

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false)
    }
    cb(null, true)
  }
}).single("image")

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

const getAddProducts = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true })
    res.render('product-add', { cat: category })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.redirect('/pageerror')
  }
}

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
      variants 
    } = req.body
    
    console.log('Variants received:', variants)

    if (!productName || !description || !fullDescription || !brand ||
      !regularPrice || !salePrice || !stock || !category) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "All fields are required." })
    }

    const categoryDoc = await Category.findOne({ name: category })
    if (!categoryDoc || !mongoose.Types.ObjectId.isValid(categoryDoc._id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Invalid category." })
    }

    let imagePaths = []
    if (req.files) {
      for (let i = 1; i <= 4; i++) {
        const fileKey = `image${i}`
        if (req.files[fileKey] && req.files[fileKey].length > 0) {
          const file = req.files[fileKey][0]
          const fileName = `product-${Date.now()}-${i}-${file.originalname.replace(/\s+/g, "-")}`
          const outputDir = path.join(__dirname, "../../public/uploads/products")

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
          }

          const outputPath = path.join(outputDir, fileName)
          
          try {
            await sharp(file.path)
              .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
              .toFormat("webp")
              .toFile(outputPath + '.webp')
              
            imagePaths.push(`/uploads/products/${fileName}.webp`)
            
            fs.unlinkSync(file.path)
          } catch (err) {
            console.error("Error processing image:", err)
            fs.copyFileSync(file.path, outputPath)
            imagePaths.push(`/uploads/products/${fileName}`)
            fs.unlinkSync(file.path)
          }
        }
      }
    }

    let parsedVariants = []
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants)
        
        if (!Array.isArray(parsedVariants)) {
          return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Variants must be an array." })
        }

        for (const variant of parsedVariants) {
          if (!variant.size || !variant.color || 
              variant.price === undefined || variant.stock === undefined) {
            return res.status(HttpStatus.BAD_REQUEST).json({ 
              success: false, 
              message: "Each variant must include size, color, price, and stock." 
            })
          }
          
          variant.price = parseFloat(variant.price)
          variant.stock = parseInt(variant.stock)
          
          if (isNaN(variant.price) || variant.price < 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({ 
              success: false, 
              message: "Price must be a positive number." 
            })
          }
          
          if (isNaN(variant.stock) || variant.stock < 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({ 
              success: false, 
              message: "Stock cannot be negative." 
            })
          }
        }
      } catch (err) {
        console.error("Error parsing variants:", err)
        return res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: "Invalid variants format. Please check your input." 
        })
      }
    }

    const newProduct = new Product({
      productName,
      description,
      fullDescription,
      brand,
      regularPrice: parseFloat(regularPrice),
      salePrice: parseFloat(salePrice),
      stock: parseInt(stock),
      category: categoryDoc._id,
      image: imagePaths,
      variants: parsedVariants
    })

    await newProduct.save()
    console.log("Product saved successfully!")

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(HttpStatus.OK).json({ 
        success: true, 
        message: "Product added successfully", 
        productId: newProduct._id 
      })
    } else {      
      return res.redirect("/admin/products")
    }
  } catch (error) {
    console.error("Error adding product:", error)
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: "Internal Server Error", 
        error: error.message 
      })
    } else {
      return res.redirect("/admin/addProducts")
    }
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

    const isProduct = await Product.findOne({ _id: id })
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
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).redirect("/pageerror")
  }
}

const unblockProduct = async (req, res) => {
  try {
    const id = req.body.id
    console.log("Product ID:", id)

    const isProduct = await Product.findOne({ _id: id }) 
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
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).redirect("/pageerror")
  }
}

const editProduct = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findById(id).populate("category")
    const categories = await Category.find() 

    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).send("Product not found")
    }

    res.render("product-edit", { product, cat: categories })
  } catch (error) {
    console.error(error)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Server error")
  }
}

const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameToServer, productIdToServer, imageIndex } = req.body

    const product = await Product.findById(productIdToServer)
    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: "Product not found" })
    }

    product.image.splice(imageIndex, 1)

    while (product.image.length < 4) {
      product.image.push("")
    }

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
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error" })
  }
}

const postEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.redirect('/admin/products')
    }

    product.productName = req.body.productName
    product.description = req.body.description
    product.fullDescription = req.body.fullDescription
    product.regularPrice = parseFloat(req.body.regularPrice)
    product.salePrice = parseFloat(req.body.salePrice)
    product.stock = parseInt(req.body.stock)
    product.brand = req.body.brand
    product.category = req.body.category

    let parsedVariants = []
    if (req.body.variants) {
      try {
        parsedVariants = JSON.parse(req.body.variants)
        if (!Array.isArray(parsedVariants)) {
          return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Variants must be an array." })
        }

        for (const variant of parsedVariants) {
          if (!variant.size || !variant.color || !variant.price || !variant.stock) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Each variant must include size, color, price, and stock." })
          }
          if (typeof variant.size !== 'string' || typeof variant.color !== 'string' ||
            typeof variant.price !== 'number' || typeof variant.stock !== 'number') {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Invalid variant data types." })
          }
          if (variant.price <= 0 || variant.stock < 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Price must be positive and stock cannot be negative." })
          }
          if (!/^[a-zA-Z0-9]+$/.test(variant.size)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Size must be a string (e.g., S, M, L, or 6, 7, 8)." })
          }
        }
      } catch (err) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Invalid variants format." })
      }
    }
    product.variants = parsedVariants

    for (let i = 1; i <= 4; i++) {
      const file = req.files[`image${i}`]?.[0]
      if (file) {
        if (product.image[i - 1]) {
          const oldPath = path.join(__dirname, '../../public', product.image[i - 1])
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

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
    res.redirect('/admin/products')

  } catch (error) {
    console.error(error)
    res.redirect('/admin/products')
  }
}

const addProductOffer = async (req, res) => {
  try {
    const { productId, percentage } = req.body
    const product = await Product.findById(productId)

    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).json({ status: false, message: "Product not found" })
    }

    product.productOffer = parseInt(percentage)
    product.salePrice = Math.round(product.regularPrice * (1 - percentage / 100))
    await product.save()

    res.json({ status: true, message: "Offer added successfully" })
  } catch (error) {
    console.error("Error in addProductOffer:", error)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: "Internal server error" })
  }
}

const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body
    const product = await Product.findById(productId)

    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).json({ status: false, message: "Product not found" })
    }

    product.productOffer = 0
    product.salePrice = product.regularPrice
    await product.save()

    res.json({ status: true, message: "Offer removed successfully" })
  } catch (error) {
    console.error("Error in removeProductOffer:", error)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: "Internal server error" })
  }
}

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findOne({ _id: id }).populate("category")
    const categories = await Category.find({ isListed: true })

    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).send("Product not found")
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
