const express = require('express')
const conn = require('../db/conn')
const bcrpyt = require('bcrypt')
// const userController = require('../models/userModel')

const passport = require('passport')
const local = require('../passport/passportconfig')
const tokenauth = require('../passport/authuser')
const session = require('express-session')
const multer  = require('multer')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
var jwt = require('jsonwebtoken');
const Usermodel = require('../models/userModel')
const AdmindataModel = require('../models/adminModel')
const PaymentModel = require('../models/paymentModel')
const ApplicationModel = require('../models/applicationModel')
const { findByIdAndUpdate } = require('../models/userModel')
const { application } = require('express')
const axios = require('axios')
const router = express.Router()
router.use(session({ secret: "cats" }));
router.use(passport.initialize());
router.use(passport.session());
router.use(express.urlencoded({extended : false})) 
router.use(express.json())
router.use(session({ secret: "cats" }));
router.use(cookieParser())



var storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads')   
  },
  filename: function (req, file, cb) {
      let d = file.originalname;
      cb(null, d)      
  }
})
var upload = multer({ storage: storage });

router.get('/' , tokenauth ,(req , res)=> {
  res.send(req.user)
  console.log('hahha');

})

const otpVerifeid = async function  (req , res , next ){
  let userr = await Usermodel.findOne({phone : req.body.phone});
  console.log('userrr')
  let verified = userr.verified;
  if(verified){
   return next();
  }else{
  res.render('otp' , {reg_user : userr});
  }
  

}

const ensureAdmin = function(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
        console.log("isAdmin");
      return next();
    } else {
      console.log('not admin');    
     res.redirect('/')
    }
  }}
router.get('/register' , (req, res)=>{
  res.render('registeration')
})
router.post('/register' , async(req ,res) => {
   let   password = req.body.password;
   let  cpassword = req.body.cpassword;
    if(password === cpassword){
        let encpassword = await bcrpyt.hash(password , 10)
        const user = new Usermodel({
            phone : req.body.phone,
            password : encpassword
        })
        const registered_user = await Usermodel.findOne({phone : req.body.phone});
      console.log(registered_user)
        const userregistered = await user.save()
      if(registered_user){
        res.redirect('/user/login')
      }else{
        const regtoken = await user.authuser()
        console.log(userregistered);
        res.render('otp' , {reg_user : userregistered})
      }
    }else{
        console.log('cpas doesnt matches');
    }
    
} )


router.post('/login', otpVerifeid, 
  passport.authenticate('local', { failureRedirect: '/user/login' }), async(req, res) => {
      const loginToken = await req.user.authuser_login()
      res.cookie('Token' , loginToken ,{
        expires : new Date(Date.now() + 1000 * 60*100),
        httpOnly : true 
      })
      // ss = req.user;
      const phone  = req.user.phone;
      console.log(loginToken);
      console.log('hahhaa login');
      let app = await ApplicationModel.findOne({phone : phone});
     if(app){
      switch (app.application_status) {
        case 'pending':
        res.redirect('/user/dashboard')
        break;
        case 'approved':
        res.redirect('/user/approvedapp')
        break;
        case 'rejected':
          res.redirect('/user/rejectedapp')
          break;  
       case 'repaid':
          res.redirect('/user/repaid')
          break;    
          
      }
     }else{
      res.redirect('/user/package')
     }
  });

router.get('/logout' , tokenauth , (req , res) => {
  res.clearCookie('Token');
  console.log('logged out');
  res.redirect('/user/login')
})
router.get('/info' , tokenauth, async(req ,res) => {
  let e = req.user.id;
  const user  = await Usermodel.findById(e);
  res.render('userdata' , { user : user , alert : ''})
})
const cpUpload = upload.fields([{ name: 'image_1', maxCount: 1 }, { name: 'image_2', maxCount: 1 },  {name :'video' , maxCount: 1}])

router.post('/info' ,tokenauth , cpUpload,  async (req , res) => {
let {first_name , middle_name , last_name , email , password , phone , father_name , mother_name , dob, address, state , city , pin_code , referrence1_name , referrence1_contact , referrence2_name ,referrence2_contact , bank_name , account_holder_name , gender, ifsc_code , account_number , documnet_id} = req.body;
if(req.body.referrence1_name == ''){
  res.render('userdata' , {alert : 'alert' , user :req.body} )
}else{
const userInfo = {
  first_name : first_name ,
  middle_name : middle_name,
  last_name : last_name,
  phone : phone ,
  email : req.body.email ,
  father_name : father_name ,
  mother_name : mother_name ,
  dob : dob ,
  address : address ,
  state : state ,
  city : city ,
  pin_code : pin_code ,
  referrence1_name : referrence1_name ,
  referrence1_contact : referrence1_contact ,
  referrence2_name : referrence2_name ,
  referrence2_contact : referrence2_contact ,
  bank_name : req.body.bank_name ,
  account_holder_name : account_holder_name ,
  ifsc_code : req.body.ifsc_code,
  gender : gender,
  account_number : account_number,
  document_id : documnet_id,
  image_1 :'/'+ req.files['image_1'][0].originalname,
  image_2 :'/'+ req.files['image_2'][0].originalname,
  video : '/'+ req.files['video'][0].originalname,
}
const userinfo = await Usermodel.findByIdAndUpdate(req.user.id , userInfo);
console.log(req.user.id);
console.log(userinfo);
res.redirect('/user/package')
}
}
           )

router.get('/package' , tokenauth , async(req ,res)=> {
  let phone = req.user.phone;
  let id = '61b0f52ff28a0a6319dd3ee2';
  let checkapps = await ApplicationModel.findOne({phone : phone});
  let adminData = await AdmindataModel.findById(id);
  if(checkapps ){
    switch (checkapps.application_status) {
      case 'pending':
      res.redirect('/user/dashboard')
      break;
      case 'approved':
      res.redirect('/user/approvedapp')
      break;
      case 'rejected':
        res.redirect('/user/rejectedapp')
        break;  
      case 'repaid':
        res.redirect('/user/repaid')
        break;  
    }
  }else{
      res.render('package' , {adminData : adminData} )
    }
})
router.post('/package' , tokenauth, async (req , res) => {
let phone = req.user.phone;

let checkapps = await ApplicationModel.findOne({phone : phone});
console.log(phone);
if(checkapps ){
  res.send('you already have requested an application');
}else{
  let amount = req.body.amount;
  let duration = req.body.duration;
  let charges = req.body.charges;
  let user_info = await Usermodel.findOne({phone : phone})
  if(user_info.email && user_info.bank_name){
    res.render('signature' , {user : req.user , amount : amount , duration : duration , charges : charges})
  }else{
   res.redirect('/user/info')
  }
}
})

router.get('/sign' , tokenauth , async(req ,res) =>{
  res.render('signature')
})
router.post('/sign' , tokenauth, async (req , res) => {
const app = new ApplicationModel({
  amount : req.body.amount ,
  duration : req.body.duration ,
  charges :req.body.charges,
  phone : req.body.phone , 
  repayment_date : '',
  application_status : 'pending'
});
  let result = await app.save();

// const userinfo = await Usermodel.findOneAndUpdate({phone : req.body.phone}, {
//   referrence2_name : req.body.referrence2_name , 
//   referrence2_contact : req.body.referrence2_contact 
// });
// console.log(userinfo);
res.redirect('/user/dashboard')
})
router.get('/login' , (req , res)=>{
  res.render('login');
})
router.get('/admin' ,tokenauth, ensureAdmin, async(req , res)=> {
    let total  =await ApplicationModel.count();
  let pending  =await ApplicationModel.count({application_status : 'pending'})
  let approved  =await ApplicationModel.count({application_status : 'approved'})
let repaid  =await ApplicationModel.count({application_status : 'repaid'})
let rejected  = await ApplicationModel.count({application_status : 'rejected'})
let id = '61b0f52ff28a0a6319dd3ee2';
    let total_bal = await AdmindataModel.findById(id)

  let repay = await PaymentModel.count();

if(total){
  res.render('adminhome' , {apps : total, total: total_bal ,pending : pending , approved : approved , repay : repay , repaid : repaid , rejected : rejected})
} else{res.render('adminhome')}


})

router.post('/admin/data' , tokenauth , ensureAdmin , async(req , res)=> {
  let data = new AdmindataModel({
    total_funds : req.body.total_funds
  })
  let dataSaved = await data.save();
  console.log(dataSaved);
})



router.post('/approve' , tokenauth , ensureAdmin , async(req , res) =>{
  let id  = req.body.app_id;
  let phone = req.user.phone;
  let repayment_date = req.body.repayment_date;
  console.log(repayment_date);
  let dt = Date.now();
  let loan = await ApplicationModel.findById(id);
  let loan_amount = loan.amount;
  console.log(loan_amount);
  let funds = await AdmindataModel.find({total_funds : {$gt : loan_amount}})
  console.log(funds);
   let idd = '61b0f52ff28a0a6319dd3ee2';
  let admin_total_bal = await AdmindataModel.findById(idd);
  let admin_bal = admin_total_bal.total_funds;
  if(admin_bal > loan_amount){
  let approved = await ApplicationModel.findByIdAndUpdate(id , {application_status : 'approved' , approved_date : dt , repayment_date : repayment_date});
  let new_bal = admin_bal - loan_amount ;
  let updated_admin_bal = await AdmindataModel.findByIdAndUpdate(idd , {total_funds : new_bal})
  }else{
    res.send('No Enough Funds ')
  }
  
  
  
  res.redirect('/user/admin')
  
})
router.get('/reject/app/:id' , tokenauth , ensureAdmin , async(req , res) =>{
  let id  = req.params.id;
  let approved = await ApplicationModel.findByIdAndUpdate(id , {application_status : 'rejected'});
  console.log(approved);
  res.redirect('/user/admin')
})


router.get('/view/app/:id' , tokenauth , ensureAdmin , async(req , res)=> {
  let id  = req.params.id;
 let  app = await ApplicationModel.findById(id);
  let  applied_date = app.applied_on;
let   duration = app.duration;
  let day = applied_date.getUTCDay() -1;
  let month = applied_date.getUTCMonth() + 1;
  console.log(Number(day)+Number(duration));
 let  phone = app.phone;
 let  user = await Usermodel.find({phone : phone})
  let u = user[0];
  console.log(user)
res.render('viewapp' , {app : app , user: u})
})



router.get('/view/repaid/app/:id' , tokenauth , ensureAdmin , async(req , res)=> {
  let id  = req.params.id;
 let  app = await ApplicationModel.findById(id);
  let  applied_date = app.applied_on;
let   duration = app.duration;
  let day = applied_date.getUTCDay() -1;
  let month = applied_date.getUTCMonth() + 1;
  console.log(Number(day)+Number(duration));
 let  phone = app.phone;
 let  user = await Usermodel.find({phone : phone})
  let u = user[0];
res.render('viewrepaid_app' , {app : app , user: u})
})



router.get('/view/approved/app/:id' , tokenauth , ensureAdmin , async(req , res)=> {
  let id  = req.params.id;
 let  app = await ApplicationModel.findById(id);
  let  applied_date = app.applied_on;
let   duration = app.duration;
  let day = applied_date.getUTCDay() -1;
  let month = applied_date.getUTCMonth() + 1;
  console.log(Number(day)+Number(duration));
 let  phone = app.phone;
 let  user = await Usermodel.find({phone : phone})
  let u = user[0];
res.render('viewapproved_app' , {app : app , user: u})
})

router.get('/dashboard' , tokenauth , async (req , res)=> {
  let user = req.user.phone;
  let app = await ApplicationModel.findOne({phone : user});
  res.render('reviewapp' , {app : app})
})

router.get('/repaid' , tokenauth , async (req , res)=> {
  let user = req.user.phone;
  let app = await ApplicationModel.findOne({phone : user});
  res.render('repaid' , {app : app})
})
router.get('/rejectedapp' ,tokenauth , async(req , res)=> {
  let user = req.user.phone;
  let app = await ApplicationModel.findOne({phone : user});
  res.render('rejectedapp' , {app : app})
})
router.get('/approvedapp' ,tokenauth , async(req , res)=> {
  let phone = req.user.phone;
  let app = await ApplicationModel.find({phone : phone})
 let  data = app[0];
  console.log(app);
  res.render('approvedapp' , {app : data})
})

router.get('/repayment/approved/:id' , tokenauth , ensureAdmin , async(req , res)=> {
  let id  = req.params.id;
 let  repay = await PaymentModel.findById(id);
  let phone = repay.phone ;
  let app = await ApplicationModel.findOneAndUpdate({phone : phone } , {
    application_status : 'repaid',
  });
    if(app){
res.redirect('back')
    
    }else{
    res.send('no app related to this phone ');
  }
})


router.get('/repayment/rejected/:id' , tokenauth , ensureAdmin , async(req , res)=> {

res.redirect('back')
    
   
})



router.get('/adminApproved' , tokenauth , ensureAdmin , async(req ,res)=> {
  let approved  =await ApplicationModel.find({application_status : 'approved'})
  res.render('adminapprovedplans' , {apps : approved} )
})



router.get('/adminTotal' , tokenauth , ensureAdmin , async(req ,res)=> {
  let total  =await ApplicationModel.find();
  res.render('admintotalplans' , {apps : total} )
})




router.get('/adminPending' , tokenauth , ensureAdmin , async(req ,res)=> {
  let pending  = await ApplicationModel.find({application_status : 'pending'})
  res.render('adminpendingplans' , {apps : pending} )
})





router.get('/adminRepaid' , tokenauth , ensureAdmin , async(req ,res)=> {
  let repaid  =await ApplicationModel.find({application_status : 'repaid'})
  res.render('adminrepaidplans' , {apps : repaid} )
})





router.get('/adminRepayments' , tokenauth , ensureAdmin , async(req ,res)=> {
  let repay = await PaymentModel.find();
  res.render('adminrepayments' , {repay : repay} )
})



router.get('/admin/addBalance' , tokenauth , ensureAdmin , async(req , res) => {
    let id = '61b0f52ff28a0a6319dd3ee2';
    let total_bal = await AdmindataModel.findById(id);
  res.render('adminaddbalance' , {total : total_bal})
})


router.post('/admin/addBalance' , tokenauth , ensureAdmin , async(req , res) => {
  let bal = req.body.addBalance;
  let amount = req.body.plan_amount;
  let duration = req.body.plan_duration;
  let charges = req.body.plan_charges;
  let id = '61b0f52ff28a0a6319dd3ee2';
  let updated_bal = await AdmindataModel.findByIdAndUpdate(id ,{total_funds:bal , plan_amount : amount , plan_duration : duration , plan_charges : charges})
  res.redirect('addBalance')
})


router.get('/repayment' , tokenauth , async(req , res) =>{
  res.render('repayment' , {alert : ''});
})


router.get('/admin/allusers', tokenauth , ensureAdmin , async(req , res )=>{
  let users = await Usermodel.find()
  console.log(users)
  if(users){
    res.render('admin_all_users' , {user: users})

  }else{
    res.send('no users')
  }

})





router.post('/repayment' , tokenauth , async(req , res) => {
      let pay = new PaymentModel({
        phone : req.body.phone ,
        order_id : req.body.order_id
      })
      let used_id = await PaymentModel.findOne({order_id : req.body.order_id});
  if(used_id){
   res.render('repayment' , {alert : "alert"})
  }else{
      let saved_pay = await pay.save();
      console.log(saved_pay);
  
    if(saved_pay){
      res.send('hogya repayment ');
    }else{
      res.send('failed to repay ! better luck next time');
    }  }
})

router.get('/otp' ,  (req , res)=> {
  res.render('otp');
})
router.post('/verify/otp' , async(req , res)=> {
  let otp = req.body.verify_otp;
  console.log(otp)
  let verified = await Usermodel.findOne({otp : otp});
  if(verified){
    let verify = await Usermodel.findOneAndUpdate({otp : otp} , {verified : true})
   res.redirect('/user/login')
  }else{
res.redirect('/user/verify/otp')  
  }
})

router.post("/get/otp", async (req,res)=>{
  let reg_phone = req.body.reg_phone;
  var otp = generateOTP();
  axios({
      url: "https://www.fast2sms.com/dev/bulkV2",
      method: "post",
      headers: {"authorization": "UwizLrB0fQhFpNVtYdy8xH4oMmlbGDv91qakTIg25ZSsPWKCu6NaFrqQZl0WGMLHzPIRnctfDxvs5uk6"},
      data: {
          "variables_values": otp,
          "route": "otp",
          "numbers": reg_phone,
      }
  }).then((ee)=>{
      console.log(ee.data);
  }).catch((err)=>{
      console.log(err);
  });
  console.log(otp);
  let save_otp = await Usermodel.findOneAndUpdate({phone : reg_phone } , {
    otp : otp , 

  })
  if(save_otp){ 
  res.render('verifyOtp'); }else{
    res.send('filed to save otp');
  }
});

function generateOTP() {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++ ) {
      OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}



  module.exports = router;