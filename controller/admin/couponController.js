const Coupon = require('../../models/couponSchema')
const moment = require('moment')
const HttpStatus = require('../../config/httpStatusCode')

const loadCoupon = async (req, res) => {
  try {
    const findCoupons = await Coupon.find({})
    return res.render('coupon', { coupons: findCoupons })
  } catch (error) {
    console.error('error occur while loadCoupon', error)
    return res.redirect('pageerror')
  }
}

const createCoupon = async (req, res) => {
  try {
    const data = {
      couponName: req.body.couponName,
      createdOn: new Date(req.body.startDate + 'T00:00:00'),
      expireOn: new Date(req.body.endDate + "T00:00:00"),
      offerPrice: parseInt(req.body.offerPrice),
      minPrice: parseInt(req.body.minimumPrice)
    }
    const newCoupon = new Coupon({
      name: data.couponName,
      createdOn: data.createdOn,
      expireOn: data.expireOn,
      offerPrice: data.offerPrice,
      minPrice: data.minPrice
    })
    await newCoupon.save()
    return res.redirect('/admin/coupon')
  } catch (error) {
    console.error('error occur while createCoupon', error)
    return res.redirect('pageerror')
  }
}

const deletecoupon = async (req, res) => {
  try {
    const couponId = req.query.id
    if (!couponId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Coupon ID is required." })
    }
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId)

    if (!deletedCoupon) {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: "Coupon not found." })
    }
    res.json({ success: true, message: "Coupon deleted successfully!" })
  } catch (error) {
    console.error('error occur while loadCoupon')
    return res.redirect('pageerror')
  }
}


const editCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const couponData = await Coupon.findById(id)

    if (!couponData) {
      console.error('Coupon not found for id:', id)
      return res.redirect('pageerror')
    }

    const formattedCouponData = {
      ...couponData._doc,
      createdOn: couponData.createdOn ? moment(couponData.createdOn).format('YYYY-MM-DD') : '',
      expireOn: couponData.expireOn ? moment(couponData.expireOn).format('YYYY-MM-DD') : ''
    }

    return res.render('coupon-edit', { couponData: formattedCouponData })
  } catch (error) {
    console.error('Error occurred while loading coupon:', error)
    return res.redirect('pageerror')
  }
}

const posteditCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const { couponName, startDate, endDate, offerPrice, minimumPrice } = req.body
    const couponData = await Coupon.findById(id)
    console.log('couponData:', couponData)
    couponData.name = couponName
    couponData.createdOn = startDate
    couponData.expireOn = endDate
    couponData.offerPrice = offerPrice
    couponData.minPrice = minimumPrice
    const done = await couponData.save()
    if(!done){
      return res.send('not done')
    }
    return res.redirect('/admin/coupon')
  } catch (error) {

  }
}

module.exports = {
  loadCoupon,
  createCoupon,
  deletecoupon,
  editCoupon,
  posteditCoupon
}