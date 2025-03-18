const express = require('express')
const router = express.Router()
const userController = require('../controller/user/userController')
const productController = require('../controller/user/productController')
const profileController = require('../controller/user/profileController')
const addressController = require('../controller/user/addressControll')
const wishlistController = require('../controller/user/wishlistController')
const cartController = require('../controller/user/cartController')
const orderController = require('../controller/user/orderController')
const couponController = require('../controller/user/couponController')
const walletController = require('../controller/user/walletController')
const {adminAuth,userAuth,userAuthCheck,adminAuthCheck} = require('../middlewares/auth')
const passport = require('passport')
const Product = require('../models/productSchema')
const upload = require('../config/multer')


//Home page
router.get("/",userController.loadHomepage) 

//error page render
router.get("/pageNotFound",userController.pageNotFound)

// Sign Up managments
router.get('/signup',userAuthCheck,userController.loadSignup)
router.post('/signup',userController.signup)
router.post('/verifyotp',userController.verifyOtp)
router.post('/resend-otp',userController.resendOtp)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), async (req, res) => {
    try {
        req.session.user = req.user._id
        res.redirect('/')
    } catch (error) {
        console.log("Google login error:", error)
        res.redirect('/signup')
    }
})

//Login managments
router.get('/login',userAuthCheck,userController.loadlogin)
router.post('/login',userController.login)
router.get('/logout',userController.logout)

//forget-pass managment
router.get('/forgetPass',userAuthCheck,userController.loadForgetPass)
router.post('/forgetPass',userController.forgetPass)
router.post('/verifyEmail',userController.verifyEmail)
router.get('/newPassword',userAuthCheck,userController.loadnewPassword)
router.post('/newPassword',userController.newPassword)

//product management
router.get('/product/:productId',productController.productDetails)
router.get('/shop',productController.shopPage)

//userManagment
router.get('/userProfile',userAuth,profileController.loadProfilePage)

//edit profile
router.get('/userProfile/edit/:userId',userAuth,profileController.loadEditProfile)
router.post('/userProfile/edit/:userId',userAuth,profileController.EditProfile)

// change email
router.get('/userProfile/change-email/:userId',userAuth,profileController.changeEmail)
router.post('/verifyEditEmail',profileController.verifyEditEmail)
router.get('/userProfile/newEmail/:userId',userAuth,profileController.loadNewEmail)
router.post('/userProfile/newEmail',userAuth,profileController.newEmail)

// change password
router.get('/userProfile/Reset-password/:userId',userAuth,profileController.loadOTPResetPass)
router.post('/userProfile/Reset-password',userAuth,profileController.loadOTPResetPass)
router.post('/verifyResetPass',profileController.verifyResetPass)
router.get('/userProfile/newResetPassword/:userId',userAuth,profileController.loadResetPass)
router.post('/userProfile/ResetPassword',userAuth,profileController.ResetPassword)

//profile picture
router.post('/upload-profile-pic/:id', upload.single('profileImage'),profileController.addProfile)

// address managment
router.get('/userProfile/address/:userId',userAuth,addressController.showAddAddress)
router.get('/userProfile/addAddress',userAuth,addressController.loadAddAddress)
router.post('/userProfile/addAddress',userAuth,addressController.AddAddress)
router.get('/userProfile/editAddress/:addressId',userAuth,addressController.loadEditAddress)
router.post('/userProfile/editAddress/:addressId',addressController.editAddress)
router.delete("/userProfile/deleteAddress/:addressId",addressController.deleteAddress)
router.get('/addAddress',userAuth,addressController.loadAddAddressCheckout)
router.post('/addAddress',userAuth,addressController.AddAddressCheckout)

//wishlist managment
router.get('/wishlist',userAuth,wishlistController.loadWishlist)
router.post('/addToWishlist',userAuth,wishlistController.addToWishlist)
router.delete('/removeFromWishlist',userAuth,wishlistController.removeProduct)

//cart managment
router.post('/addToCart',cartController.addToCart)
router.get('/cart',userAuth,cartController.loadCart)
router.delete('/removeCartItem', userAuth, cartController.removeCartItem)
router.patch('/updateCartQuantity', userAuth, cartController.updateCartQuantity)

// checkout managment
router.get('/checkout',userAuth,cartController.loadCheckOut)
router.get('/checkout/coupon',userAuth,cartController.loadCheckOutCoupon)

//order managment 
router.post('/addOrder',userAuth,orderController.addOrder)
router.get('/orderSuccess/:orderId',userAuth,orderController.orderSuccess)
router.get('/orderHistory',userAuth,orderController.getOrderHistory)
router.post('/orders/cancel',userAuth,orderController.cancelOrder)
router.get('/orders/:orderId',userAuth,orderController.getOrderDetails)
router.post('/orders/retun',userAuth,orderController.returnOrder)

router.post('/api/razorpay/createRazorpayOrder',orderController.createRazorpay)
router.post('/api/razorpay/verifyRazorpayPayment',orderController.verifyRazorpay)
router.get('/orderFailure',orderController.loadFailure)

router.post('/applyCoupon',userAuth,couponController.applyCoupon)

//wallet managment
router.get('/userProfile/wallet/:userId',userAuth,walletController.loadwallet)
router.post('/add-money',userAuth,walletController.addTowallet)
router.post("/wallet/create-order",userAuth,walletController.createRazorpayOrder)
router.post("/wallet/payment-success",userAuth,walletController.razorpayPaymentSuccess)

module.exports = router