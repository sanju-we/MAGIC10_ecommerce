const User = require('../../models/userSchema')
const Category = require('../../models/categorySchema')
const Product = require('../../models/productSchema')
const Wallet = require('../../models/walletSchema')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const bcrypt = require('bcrypt')
const HttpStatus = require('../../config/httpStatusCode')

const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user
    const categories = await Category.find({ isListed: true })
    let productData = await Product.find({
      isBlocked: false,
      category: { $in: categories.map(category => category._id) }, stock: { $gt: 0 }
    })
    productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    productData = productData.slice(0, 4)
    if (user) {
      const userData = await User.findOne({ _id: user })
      res.render('home', { user: userData, products: productData })
    } else {
      res.render('home', { products: productData })
    }
  } catch {
    res.status(HttpStatus.NOT_FOUND).redirect('/pageNotFound')
  }
}

const pageNotFound = async (req, res) => {
  try {
    const error = req.session.notFound || null
    req.session.notFound = null
    res.render('404', { error })
  } catch (error) {
    res.status(HttpStatus.NOT_FOUND).redirect('/pageNotFound')
  }
}

const loadSignup = async (req, res) => {
  try {
    const Emessage = req.session.Emessage || null
    req.session.Emessage = null
    res.render('signup', { Emessage })
  } catch (error) {
    res.status(HttpStatus.NOT_FOUND).redirect('/pageNotFound')
  }
}


async function sendVerificationEmail(email, otp) {
  try {

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    })

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP:${otp}</b>`,
    })

    return info.accepted.length > 0

  } catch (error) {
    console.error("Error sending email", error)
    return false
  }
}

function genarateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const signup = async (req, res) => {
  try {
    const { username, email, phone, password, Cpassword, referCode } = req.body
    const findUser = await User.findOne({ email })
    if (findUser) {
      req.session.Emessage = "User with this email already exists"
      return res.redirect('/signup')
    }
    if (referCode) {
      const cheeckReferal = await User.findOne({ referCode : referCode })
      console.log('cheeckReferal:',cheeckReferal)
      if (!cheeckReferal) {
        req.session.Emessage = 'Invalid Referal Code, Please try again'
        return
      }
      const wallet = await Wallet.findOne({ userId: cheeckReferal._id })
      wallet.balance += 500
      wallet.transactions.push({
        type: 'credit',
        amount: 500,
        description: 'Referal Code Credition',
        date: new Date(),
      })
      await wallet.save()
    }
    const otp = genarateOtp()
    const emailSend = await sendVerificationEmail(email, otp)
    if (!emailSend) {
      return res.json("email-error")
    }
    req.session.userOtp = otp
    req.session.userData = { username, phone, email, password }
    res.render('verifyotp')
    console.log("OTP send", otp)
  } catch (error) {
    console.error("signup error", error)
    res.redirect('/pageNotFound')
  }
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    console.error("error on signup page:", error)
  }
}

const verifyOtp = async (req, res) => {
  try {

    const { otp } = req.body
    console.log("Received OTP:", otp)
    console.log("Session OTP:", req.session.userOtp)

    if (!otp) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "OTP is required!" })
    }

    if (otp === req.session.userOtp) {
      const user = req.session.userData
      const passwordHash = await securePassword(user.password)
      const saveUserData = new User({
        username: user.username,
        email: user.email,
        phone: user.phone,
        password: passwordHash
      })

      await saveUserData.save()
      req.session.user = saveUserData._id

      return res.json({ "success": true, "redirectUrl": "/" })
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({ "success": false, "message": "Invalid OTP, Please try again" })
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "An error occurred" })
  }
}

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData
    if (!email) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Email not found in session" })
    }
    const otp = genarateOtp()
    req.session.userOtp = otp
    const emailSend = await sendVerificationEmail(email, otp)
    if (emailSend) {
      console.log("Resend OTP", otp)
      res.status(HttpStatus.OK).json({ success: true, message: "OTP Resend Successfully" })
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to resend OTP. Please try again" })
    }
  } catch (error) {
    console.error("error resending Otp", error)
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal Server Error. Please try again" })
  }
}

const loadlogin = async (req, res) => {
  try {
    const message = req.session.message || null
    req.session.message = null
    res.render('login', { message })
  } catch (error) {
    console.error('error ocuur', error)
    res.redirect('/pageNotFound')
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const findUser = await User.findOne({ isAdmin: 0, email: email })
    if (!findUser) {
      req.session.message = "User not found"
      return res.redirect('/login')
    }
    if (findUser.isBlocked) {
      req.session.message = "User is blocked by admin"
      return res.redirect('/login')
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password)
    if (!passwordMatch) {
      req.session.message = "Incorrect Password"
      return res.redirect('/login')
    }
    req.session.user = findUser._id
    return res.redirect('/')
  } catch (error) {
    console.error("login error", error)
    req.session.message = "Loginfailed. Please try again later"
    return res.redirect('/pageNotFound')
  }
}

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        consolog("session destruction error", error)
        return res.redirect('/pageNotFound')
      }
      return res.redirect('/login')
    })
  } catch (error) {
    console.log("logout Error", error)
    res.redirect('/paeNotFound')
  }
}

const loadForgetPass = async (req, res) => {
  try {
    const Fmessage = req.session.Fmessage || null
    req.session.Fmessage = null
    res.render('emailVerify', { Fmessage })
  } catch (error) {
    res.status(HttpStatus.NOT_FOUND).redirect('/pageNotFound')
  }
}

const forgetPass = async (req, res) => {
  try {
    const { email } = req.body
    const findUser = await User.findOne({ email })
    if (!findUser) {
      req.session.Fmessage = "Unknown email,Check yoour email and type again"
      console.log('redirecting to signup to render error')
      return res.redirect('/forgetPass')
    }
    const otp = genarateOtp()
    const emailSend = await sendVerificationEmail(email, otp)
    if (!emailSend) {
      return res.json("email-error")
    }
    req.session.userEmailOtp = otp
    req.session.newPass = findUser._id
    res.render('verifyEmail')
    console.log("OTP send", otp)
  } catch (error) {
    console.error("forget Password error", error)
    res.redirect('/pageNotFound')
  }
}

const verifyEmail = async (req, res) => {
  try {

    const { otp } = req.body
    console.log("Received OTP:", otp)
    console.log("Session OTP:", req.session.userEmailOtp)

    if (!otp) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "OTP is required!" })
    }

    if (otp === req.session.userEmailOtp) {
      return res.json({ "success": true, "redirectUrl": "/newPassword" })
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({ "success": false, "message": "Invalid OTP, Please try again" })
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "An error occurred" })
  }
}


const loadnewPassword = async (req, res) => {
  try {
    const Nmessage = req.session.Nmessage || null
    req.session.Nmessage = null
    res.render('newPassword', { Nmessage })
  } catch (error) {
    console.error("error on load newpage", error)
    res.status(HttpStatus.NOT_FOUND).redirect('/pageNotFound')
  }
}

const newPassword = async (req, res) => {
  try {
    const { newPassword } = req.body
    if (req.session.newPass) {
      const id = req.session.newPass
      req.session.newPass = null
      const passwordHash = await securePassword(newPassword)
      const updation = await User.findByIdAndUpdate(id, { password: passwordHash })
      if (updation) {
        return res.redirect('/login')
      } else {
        res.send('not working')
      }
    }
  } catch (error) {
    console.error("password updating page error", error)
    res.redirect('/pageNotFound')
  }
}




module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignup,
  signup,
  verifyOtp,
  resendOtp,
  loadlogin,
  login,
  logout,
  loadForgetPass,
  forgetPass,
  verifyEmail,
  newPassword,
  loadnewPassword
}