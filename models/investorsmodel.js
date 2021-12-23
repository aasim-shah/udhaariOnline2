const mongoose = require('mongoose')
const conn = require('../db/conn')

const investorSchema  = mongoose.Schema({
   phone : String, 
  status : String

})

const InvestorsModel = mongoose.model('investor' , investorSchema)

module.exports = InvestorsModel;