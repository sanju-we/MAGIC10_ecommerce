const { userAuth } = require('../../middlewares/auth')
const User = require('../../models/userSchema')
const mongoose = require('mongoose')


const customerInfo = async(req,res)=>{
  try {
    let search = ''
    if(req.query.search){
      search = req.query.search
    }
    let page = 1
    if(req.query.page){
      page=req.query.page
    }

    const limit = 3

    const userData = await User.find({isAdmin:false,$or:[
      {name:{$regex:".*"+search+".*"}},
      {email:{$regex:".*"+search+".*"}}
    ],})
    // .limit(limit*1)
    // .skip((page-1)*limit)
    // .exec()

    const count = await User.find({
      isAdmin:false,
      $or:[
        {name:{$regex:".*"+search+".*"}},
        {email:{$regex:".*"+search+".*"}}
      ]
    }).countDocuments()

    res.render('customers',{data:userData , count})
  } catch (error) {
    
  }
}

const blockCustomer = async (req, res) => {
  try {
    const { id } = req.query; // Extract user ID from query params
    console.log('Blocking user:', id);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid User ID');
      return res.redirect('/admin/users');
    }

    const user = await User.findById(id);
    console.log('User found:', user);

    if (!user) {
      console.log('User not found');
      return res.redirect('/admin/users');
    }

    await User.findByIdAndUpdate(id, { isBlocked: true });
    console.log('User blocked successfully');

    // If the blocked user is currently logged in, clear their session
    if (req.session.user == id) {
      req.session.user = null;
    }

    res.redirect('/admin/users'); // Keep admin on the admin page
  } catch (error) {
    console.error('Error in blocking user:', error);
    res.redirect('/pageerror');
  }
};

const unblockCustomer = async (req, res) => {
  try {
    const { id } = req.query;  // Extracting ID from query params
    console.log(id);

    const user = await User.findOne({ _id: id });  // Fetching single user
    console.log(user);

    if (!user) {
      console.log('User not found');
      return res.redirect('/admin/users'); // Redirecting if user is not found
    }

    await User.findByIdAndUpdate(id, { isBlocked: false });  // Correct update query
    console.log('User blocked successfully');

    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error in blocking user:', error);
    res.redirect('/pageerror');
  }
};




module.exports = {
  customerInfo,
  blockCustomer,
  unblockCustomer
}