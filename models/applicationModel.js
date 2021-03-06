const mongoose = require('mongoose')
const conn = require('../db/conn')
const User = require('./userModel')

const applicationSchema = mongoose.Schema({
   amount : String, 
   phone : String , 
   duration : String ,
    charges : String,
   application_status :String,
   approved_date : {type :Date },
    repayment_date : String,
    ref_code : String,
  payout_id : String,
   applied_on : { type : Date , default : Date.now()}

})

const ApplicationModel = mongoose.model('application' , applicationSchema)

module.exports = ApplicationModel;