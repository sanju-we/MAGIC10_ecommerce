const mongoose = require('mongoose')
const {Schema} = mongoose
const {v4:uuidv4, stringify} = require('uuid')

const userSchema = new Schema({
  username:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true,
    unique:true
  },
  phone:{
    type:String,
    required:false,
    unique:false,
    sparse:true,
    default:null
  },
  googleId:{
    type:String,
    unique:true
  },
  password:{
    type:String,
    required:false
  },
  isAdmin:{
    type:Boolean,
    default:false
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  gender:{
    type:String,
    // required:true
  },
  image:{
    type:[String],
    // required:true
  },cart:[{
    type:Schema.Types.ObjectId,
    ref:"Cart",
  }],
  wallet:{
    type:Number,
    default:0
  },
  whishlist:[{
    type:Schema.Types.ObjectId,
    ref:"Wishlist"
  }],
  orderHistory:[{
    type:Schema.Types.ObjectId,
    ref:"Order"
  }],
  createdOn: {
    type:Date,
    default:Date.now
  },
  referCode:{
    type:String,
    default:()=>uuidv4(),
  },
  radeemed:{
    type:Boolean
  },
  radeemedUsers : [{
    type:Schema.Types.ObjectId,
    ref:"User"
  }],
  searchHistory:[{
    category: {
      type:Schema.Types.ObjectId,
      ref:"Category"
    },
    brand:{
      type:String
    },
    searchOn:{
      type:Date,
      default:Date.now
    }
  }]
})

const User = mongoose.model("User",userSchema)

module.exports = User