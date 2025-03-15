const Coupon = require('../../models/couponSchema')

const loadCoupon = async(req,res)=>{
  try {
    const findCoupons = await Coupon.find({})
    return res.render('coupon',{coupons:findCoupons})
  } catch (error) {
    console.error('error occur while loadCoupon',error)
    return res.redirect('pageerror')
  }
}

const createCoupon = async(req,res)=>{
  try {
    const data = {
      couponName : req.body.couponName,
      createdOn : new Date(req.body.startDate + 'T00:00:00'),
      expireOn: new Date(req.body.endDate + "T00:00:00"),
      offerPrice: parseInt(req.body.offerPrice),
      minPrice: parseInt(req.body.minimumPrice)
    }
    const newCoupon = new Coupon({
      name:data.couponName,
      createdOn:data.createdOn,
      expireOn:data.expireOn,
      offerPrice:data.offerPrice,
      minPrice:data.minPrice
    })
    await newCoupon.save()
    return res.redirect('/admin/coupon')
  } catch (error) {
    console.error('error occur while createCoupon',error)
    return res.redirect('pageerror')
  }
}

const deletecoupon = async(req,res)=>{
  try {
    const couponId = req.query.id
    if (!couponId) {
      return res.status(400).json({ success: false, message: "Coupon ID is required." });
    }
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    
    if (!deletedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }
    res.json({ success: true, message: "Coupon deleted successfully!" });
  } catch (error) {
    console.error('eoor occur while loadCoupon')
    return res.redirect('pageerror')
  }
}

const editCoupon = async(req,res)=>{
  try {
    const id = req.query.id
    const couponData = await Coupon.findById(id)
    return res.render('coupon-edit',{couponData})
  } catch (error) {
    console.error('eoor occur while loadCoupon')
    return res.redirect('pageerror')
  }
}

const posteditCoupon = async(req,res)=>{
  try {
    console.log(req.body)
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