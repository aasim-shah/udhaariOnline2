const mongoose = require('mongoose')
const conn = require('../db/conn')

const adminSchema = mongoose.Schema({
   total_funds : String, 
    plan_amount : String,
  plan_duration : String,
  plan_charges : String

})

const AdmindataModel = mongoose.model('admin_data' , adminSchema)

module.exports = AdmindataModel;