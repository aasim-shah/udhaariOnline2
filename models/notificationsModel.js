const mongoose = require('mongoose')
const conn = require('../db/conn')

const notificationsSchema = mongoose.Schema({
  "title" : {type : String},
  "phone" : String,
  "app_id" : String
})

const NotificationsModel = mongoose.model('admin_data' , notificationsSchema)

module.exports = NotificationsModel;