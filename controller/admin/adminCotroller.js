const User = require('../../models/userSchema')
const bcrypt = require('bcrypt')


const pageerror = (req,res)=>{
  res.render('admin-error')
}

const loadLogin = (req,res)=>{
  if(req.session.admin){
    return res.redirect('/admin')
  }
  res.render('admin-login',{message:null})
}

const Login = async(req,res)=>{
  try {
    const {email,password}= req.body
    const admin = await User.findOne({ email:email,isAdmin:true })
    if(admin){
      const passwordMatch = bcrypt.compare(password,admin.password)
      if(passwordMatch){
        req.session.admin = true
        return res.redirect('/admin')
      }else{
        return res.redirect('/admin/login')
      }
    }else{
      console.log("redirecting to login due to cannot find admin")
      return res.redirect('/admin/login')
    }
  } catch (error) {
    console.error('admin login post error',error)
    return res.redirect('/pageerror')
  }
}

const loadDashboard = async(req,res)=>{
  if(req.session.admin){
    try {
      res.render('dashboard')
    } catch (error) {
      res.redirect('/pageerror')
    }
  }
}

const logout = (req,res)=>{
  try {
    req.session.destroy(err=>{
      if(err){
        console.log('Error in destroying session',error);
        return res.redirect('/admin/pageerror');
      }
      res.redirect('/admin/login')
    })
  } catch (error) {
    console.log('unexpected error during logout',error);
    res.redirect('/pageerror')
  }
}




module.exports = {
  pageerror,
  loadLogin,
  Login,
  loadDashboard,
  loadDashboard,
  logout
}