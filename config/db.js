const mongoose = require("mongoose");
const env = require("dotenv").config();


const connectDB = async () => {
  try {
    console.log('database connected');
    
    await mongoose.connect(process.env.MONGODB_URI)
  } catch (error) {
    console.log('database connection failed',error.message)
    process.exit(1)
  }
}


  module.exports = connectDB