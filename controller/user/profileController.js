const User = require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')
const Wallet = require('../../models/walletSchema')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const HttpStatus = require('../../config/httpStatusCode')

const loadProfilePage = async (req, res) => {
  try {
    const id = req.session.user
    console.log('id:',id)
    const userData = await User.findById(id)
    const addressData = await Address.findOne({userId:id})
    const orders = await Order.find({userId:id})
    const wallet = await Wallet.findOne({userId:id})
    let totalOrders = 0
    for(let order of orders){
      totalOrders++
    }
    let totalSpends = 0
    for(let order of orders){
      totalSpends = order.finalAmount + totalSpends
    }
    const recentOrders = await Order.find({userId:id}).sort({createdOn:-1}).limit(2)
    console.log('recentOrders:',recentOrders)
    if (!userData) {
      req.session.notFound = 'User not found, Please try again'
      return res.redirect('/pageNotFound')
    }
    res.render('profile', { userData,addressData,totalOrders,orders,totalSpends,recentOrders,wallet })
  } catch (error) {
    console.error('error on profile rendering', error)
    res.redirect('/pageNotFound')
  }
}

const loadEditProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const userData = await User.findById(userId)
    if (!userData) {
      console.log('user not found');
      return res.redirect('/pageNotFound', { userData })
    }
    res.render('editProfile', { userData })
  } catch (error) {

  }
}

const EditProfile = async(req,res)=>{
  try {
    const {username,phone,gender,email} = req.body
    const userId = req.params.userId
    const userData = await User.findById(userId)
    if(!userData){
      console.log('user not found in editProfile')
      return res.redirect('/pageNotFound')
    }
    await User.findByIdAndUpdate(userId, {
      username,
      phone,
      gender
    }, { new: true, runValidators: true })
    res.redirect(`/userProfile/edit/${userId}`)
  } catch (error) {
    console.error('error occur while updating user profile',error)
    res.redirect('/pageNotFound')
  }
}

function genarateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
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
    console.error("Error sending email", error);
    return false
  }
}

const changeEmail = async (req, res) => {
  try {
    const { userId } = req.params
    const userData = await User.findById(userId)
    if (!userData) {
      console.log('user not found')
      return res.redirect('/pageNotFound')
    }
    const otp = genarateOtp()
    console.log('OTP generated:', otp)
    const emailSend = await sendVerificationEmail(userData.email, otp)

    if (!emailSend) {
      return res.json("email-error")
    }
    req.session.emailOtp = otp
    const email = userData.email
    req.session.userEmailData = { email }
    console.log("OTP send :", otp);

    res.render('change-email', { userData })
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

const verifyEditEmail = async (req, res) => {
  try {

    const { otp } = req.body;
    const userId = req.session.user
    const userData = await User.findById(userId)
    console.log("Received OTP:", otp);
    console.log("Session OTP:", req.session.emailOtp);

    if (!userData) {
      console.log('user not found in verifyEditEmail post method')
      return res.redirect('/pageNotFound')
    }

    if (!otp) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "OTP is required!" });
    }

    if (otp === req.session.emailOtp) {
      const id = userData._id
      return res.json({ "success": true, "redirectUrl": `/userProfile/newEmail/${id}` });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({ "success": false, "message": "Invalid OTP, Please try again" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "An error occurred" });
  }
};

const loadNewEmail = async (req, res) => {
  try {
    const { userId } = req.params
    res.render('newEmail')
  } catch (error) {
    console.log(error)
  }
}

const newEmail = async (req, res) => {
  try {
    const { newEmail, confirmEmail } = req.body
    const userId = req.session.user
    const userData = await User.findById(userId)
    if (!userData) {
      console.log('user not found in newEmail post method')
      return res.redirect('/pageNotFound')
    }
    const emailHave = await User.findOne({ email: newEmail })
    if (emailHave) {
      console.log('Email already exixts')
      return res.redirect('/pageNotFound')
    }
    const update = await User.findByIdAndUpdate({ _id: userId }, { email: newEmail })
    if (!update) {
      console.log('error occur while updating')
      return res.redirect('/pageNotFound')
    } else {
      console.log('email updated successfully')
      res.redirect(`/userProfile/edit/${userId}`)
    }
  } catch (error) {
    console.error('error occur while add new email', error)
    res.redirect('/pageNotFound')
  }
}

const loadOTPResetPass = async(req,res)=>{
  try {
    const { userId } = req.params
    const userData = await User.findById(userId)
    if (!userData) {
      console.log('user not found')
      return res.redirect('/pageNotFound')
    }
    const otp = genarateOtp()
    console.log('OTP generated:', otp)
    const emailSend = await sendVerificationEmail(userData.email, otp)

    if (!emailSend) {
      return res.json("email-error")
    }
    req.session.ResetPassOtp = otp
    console.log("OTP send :", otp);
    
    res.render('resetPassword', { userData })
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

const verifyResetPass = async (req, res) => {
  try {

    const { otp } = req.body;
    const userId = req.session.user
    const userData = await User.findById(userId)
    console.log("Received OTP:", otp);
    console.log("Session OTP:", req.session.ResetPassOtp);

    if (!userData) {
      return res.redirect('/pageNotFound')
    }

    if (!otp) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "OTP is required!" });
    }

    if (otp === req.session.ResetPassOtp) {
      const id = userData._id
      return res.json({ "success": true, "redirectUrl": `/userProfile/newResetPassword/${id}` });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({ "success": false, "message": "Invalid OTP, Please try again" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "An error occurred" });
  }
};

const loadResetPass = async(req,res)=>{
  try {
    res.render('newResetPassword')
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    console.error("error on signup page:", error);
  }
}

const ResetPassword = async(req,res)=>{
  try {
    const userId = req.session.user
    const userData = await User.findById(userId)
    if(!userData){
      console.log('userNot found in ResetPassword')
      return res.redirect('/pageNotFound')
    }
    const {currentPassword,newPassword,confirmPassword} = req.body
    const isValid = await bcrypt.compare(currentPassword,userData.password)
    if(!isValid){
      console.log('user entered current password is wrong')
      return res.redirect('/pageNotFound')
    }
    const hashedPassword = await securePassword(newPassword)
    const update = await User.findByIdAndUpdate({_id:userId},{password:hashedPassword})
    if(!update){
      console.log('error occur while updating new reset password')
      return res.redirect('/pageNotFound')
    }
    res.redirect(`/userProfile/edit/${userId}`)
  } catch (error) {
    console.error('error occur while reset password',error)
    res.redirect('/pageNotFound')
  }
}

const addProfile =  async (req, res) => {
  try {
      const userId = req.params.id;
      const imagePath = `/uploads/${req.file.filename}`;

      await User.findByIdAndUpdate(userId, { image: imagePath });

      res.json({ success: true, imagePath });
  } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Error uploading image' });
  }
}

module.exports = {
  loadProfilePage,
  loadEditProfile,
  changeEmail,
  verifyEditEmail,
  loadNewEmail,
  newEmail,
  loadOTPResetPass,
  verifyResetPass,
  loadResetPass,
  ResetPassword,
  addProfile,
  EditProfile
}