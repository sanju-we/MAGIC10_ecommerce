const express = require('express')
const router = express.Router()
const adminController = require('../controller/admin/adminCotroller')
const customerController = require('../controller/admin/customerController')
const categoryController = require('../controller/admin/categoryController')
const productController = require('../controller/admin/productController')
const orderController = require('../controller/admin/orderController')
const couponController = require('../controller/admin/couponController')
const {userAuth,adminAuth,adminAuthCheck,userAuthCheck} = require('../middlewares/auth')
const path = require('path')
const upload = require('../config/multer')



router.get('/pageerror',adminController.pageerror)
router.get('/login',adminAuthCheck,adminController.loadLogin)
router.post('/login',adminController.Login)
router.get('/',adminAuth,adminController.loadDashboard)
router.get('/logout',adminController.logout)

// customer controller routers
router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockCustomer',customerController.blockCustomer)
router.get('/unblockCustomer',customerController.unblockCustomer)

//category managements
router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addCategory',categoryController.addCategory)
router.post('/addCategoryOffer',categoryController.addCategoryOffer)
router.post('/removeCategoryOffer',categoryController.removeCategoryOffer)
router.post('/listCategory',categoryController.getListCategory)
router.post('/unlistCategory',categoryController.getUnlistCategory)
router.post('/editCategory/:id',categoryController.editCategory)
router.post('/editCategoryOffer',categoryController.editCategoryOffer)
router.delete('/deleteCategory/:categoryId',categoryController.deleteCategory)

//product management
router.get('/addProducts',adminAuth,productController.getAddProducts)

router.post('/addProducts', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]), productController.postAddProduct);

router.post('/saveImage', productController.saveImage);
router.get('/products',adminAuth,productController.getAllProducts)
router.post('/blockProduct',productController.blockProduct)
router.post('/unblockProduct',productController.unblockProduct)
router.get('/editProduct',adminAuth,productController.editProduct)
router.post("/addProductOffer",productController.addProductOffer);
router.post("/removeProductOffer",productController.removeProductOffer);
router.post("/editProduct/:id", upload.fields([{ name: "image1" }, { name: "image2" }, { name: "image3" }, { name: "image4" }]),productController.postEditProduct)
router.post("/deleteImage",productController.deleteSingleImage)

//order managment
router.get('/orderList',adminAuth,orderController.getorderList)
router.get('/orders/:orderId',adminAuth,orderController.getorderdetails)
router.post('/orders/update-status',adminAuth,orderController.updateStatus)
router.post('/orders/cancel',adminAuth,orderController.orderCancelled)
router.post('/orders/handle-return',orderController.orderReturn)
router.get('/salesReport',adminAuth,orderController.loadSalesReport)
router.post('/salesReport',orderController.generateSalesReport)

// coupon managment
router.get('/coupon',adminAuth,couponController.loadCoupon)
router.post('/createCoupon',adminAuth,couponController.createCoupon)
router.get("/deletecoupon",adminAuth,couponController.deletecoupon)
router.get('/editCoupon',adminAuth,couponController.editCoupon)
router.post('/editCoupon',adminAuth,couponController.posteditCoupon)

module.exports = router