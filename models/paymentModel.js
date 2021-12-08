const mongoose = require('mongoose')
const conn = require('../db/conn')

const paymentSchema = mongoose.Schema({
   phone : String, 
   order_id : String,

})

const PaymentModel = mongoose.model('payment' , paymentSchema)

module.exports = PaymentModel;