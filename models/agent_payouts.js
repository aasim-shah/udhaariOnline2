const mongoose = require('mongoose')
const conn = require('../db/conn')

const agent_payout = mongoose.Schema({
   phone : String, 
  name : String,
   bank_name : String,
  account_number : String,
  ifsc_code : String,
  payout_status : String

})

const Agent_payout = mongoose.model('agentPayout' , agent_payout)

module.exports = Agent_payout;