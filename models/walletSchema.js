// const mongoose = require('mongoose')
// const { Schema } = mongoose

// const walletSchema = new Schema({
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//     unique:true
//   },
//   balance: {
//     type:Number,
//     required:true,
//     default : 0
//   },
//   transactions: [
//     {
//       type: {
//         String, enum: ['credit', 'debit'],
//         required:true
//       },
//       amount: {
//         trype:Number,
//         required:true
//       },
//       description: { 
//         type: String 
//       },
//       date: {
//         type: Date, default: Date.now 
//       }
//     }
//   ]
// })

// const Wallet = mongoose.model("Wallet", walletSchema)

// module.exports = Wallet


const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  balance: { 
    type: Number, 
    required: true 
  },
  transactions: [
    {
      amount: { 
        type: Number, 
        required: true
      }, 
      type: { 
        type: String, 
        required: true ,
        enum: ['credit', 'debit'],
      }, 
      date: { 
        type: Date, 
        default: Date.now 
      },
      description : { 
        type:String, 
        required:true 
      }
    }
  ]
});

module.exports = mongoose.model("Wallet", WalletSchema);