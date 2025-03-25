const Wallet = require('../../models/walletSchema')
const User = require('../../models/userSchema')

const loadTransaction = async(req,res)=>{
  try {
    const Datas =await  Wallet.find({})
    console.log('userDatas:',Datas)
    let transaction=[
      transactionId =12
    ]
    res.render('transaction',{users:Datas,transaction} )
  } catch (error) {
    console.log('eroor',error)
    res.redirect('/admin/pageerror')
  }
}

module.exports = {
  loadTransaction
}