const mongoose = require('mongoose')
const {Schema} = mongoose

const addressSchema = new Schema({
  userId : {
    type:Schema.Types.ObjectId,
    ref:"User",
    requied : true
  },
  address : [{
    addressType:{
      type:String,
      required:true
    },
    fullName:{
      type:String,
      required:true
    },
    city:{
      type:String,
      required:true
    },
    LandMark:{
      type:String,
      required:true
    },
    State:{
      type:String,
      required:true
    },
    PINcode:{
      type:Number,
      required:true
    },
    phone:{
      type:String,
      required:true
    },
    altPhone:{
      type:String,
      required:false
    }
  }]
})

const Address = mongoose.model('Address',addressSchema)

module.exports = Address