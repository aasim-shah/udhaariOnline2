const jwt = require('jsonwebtoken')
const User = require('../models/userModel')





const tokenauth = async  (req , res , next) =>{
    try {
     let  token = req.cookies.Token;
      let verifyUser = await jwt.verify(token , 'stgfingsecretkey')
        const authUser =await User.findOne({_id : verifyUser._id})
        req.user = authUser;
      next();
    } catch (error) {
      return res.redirect('/user/login');
    console.log(error);
    console.log('hahha');
    }


  
  }


  module.exports = tokenauth ;
