const mongoose = require('mongoose')
const conn = require('../db/conn')

const adminSchema = mongoose.Schema({
   total_funds : String, 

})

const AdmindataModel = mongoose.model('admin_data' , adminSchema)

module.exports = AdmindataModel;