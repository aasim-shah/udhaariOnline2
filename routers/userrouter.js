require('dotenv').config()
const express = require("express");
const conn = require("../db/conn");
const bcrpyt = require("bcrypt");
const passport = require("passport");
const local = require("../passport/passportconfig");
const tokenauth = require("../passport/authuser");
const session = require("express-session");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
const Razorpay = require('razorpay')
const Usermodel = require("../models/userModel");
const AdmindataModel = require("../models/adminModel");
const PaymentModel = require("../models/paymentModel");
const ApplicationModel = require("../models/applicationModel");
const Notifications = require("../models/notificationsModel");
const nodemailer = require("nodemailer");
const btoa = require('btoa')
const { findByIdAndUpdate } = require("../models/userModel");
const { application } = require("express");
const axios = require("axios");
const router = express.Router();
router.use(session({ secret: "cats" }));
router.use(passport.initialize());
router.use(passport.session());
router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(session({ secret: "cats" }));
router.use(cookieParser());
// const instance = new Razorpay({key_id: process.env.RAZORPAY_KEY, key_secret: process.env.RAZORPAY_SECRET;
var instance = new Razorpay({ key_id: 'rzp_test_k1kZX1GsWpK5jl', key_secret: 'qkgPz3aB4xZt4crNIfZBno6I' })

// multer config started
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads");
  },
  filename: function(req, file, cb) {
    let d = file.originalname;
    cb(null, d);
  }
});
var upload = multer({ storage: storage });

router.get("/", tokenauth, (req, res) => {
  res.send(req.user);
  console.log("hahha");
});
// multer config ends

// otp verification middleware
const otpVerifeid = async function(req, res, next) {
  let userr = await Usermodel.findOne({ phone: req.body.phone });
  console.log("userrr");
  let verified = userr.verified;
  if (verified) {
    return next();
  } else {
    res.render("otp", { reg_user: userr });
  }
};
// otp verification middleware

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'asimshah8110@gmail.com',
    pass: 'Noob@developer'
  }
});


// confirming admin middleware
const ensureAdmin = function(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
      console.log("isAdmin");
      return next();
    } else {
      console.log("not admin");
      res.redirect("/");
    }
  }
};
// confirming admin  middleware

// user register , login and logout routeing strted
// user registeration get route
router.get("/register", (req, res) => {
  res.render("registeration");
});

// user registeration post route
router.post("/register", async (req, res) => {
  let password = req.body.password;
  let cpassword = req.body.cpassword;
  if (password === cpassword) {
    let encpassword = await bcrpyt.hash(password, 10);
    const user = new Usermodel({
      phone: req.body.phone,
      password: encpassword
    });
    const registered_user = await Usermodel.findOne({ phone: req.body.phone });
    console.log(registered_user);
    const userregistered = await user.save();
    if (registered_user) {
      res.redirect("/user/login");
    } else {
      const regtoken = await user.authuser();
      console.log(userregistered);
      res.render("otp", { reg_user: userregistered });
    }
  } else {
    console.log("cpas doesnt matches");
  }
});

// user login get route
router.get("/login", (req, res) => {
  res.render("login");
});

// user loging in
router.post(
  "/login",
  otpVerifeid,
  passport.authenticate("local", { failureRedirect: "/user/login" }),
  async (req, res) => {
    const loginToken = await req.user.authuser_login();
    res.cookie("Token", loginToken, {
      expires: new Date(Date.now() + 1000 * 60 * 100),
      httpOnly: true
    });
    // ss = req.user;
    const phone = req.user.phone;
    console.log(loginToken);
    console.log("hahhaa login");
    let app = await ApplicationModel.findOne({ phone: phone });
    if (app) {
      switch (app.application_status) {
        case "pending":
          res.redirect("/user/dashboard");
          break;
        case "approved":
          res.redirect("/user/approvedapp");
          break;
        case "rejected":
          res.redirect("/user/rejectedapp");
          break;
        case "repaid":
          res.redirect("/user/repaid");
          break;
      }
    } else {
      res.redirect("/user/package");
    }
  }
);

// user logout
router.get("/logout", tokenauth, (req, res) => {
  res.clearCookie("Token");
  console.log("logged out");
  res.redirect("/user/login");
});

// user registeration , login and logout ends here

// saving user info get route
router.get("/info", tokenauth, async (req, res) => {
  let e = req.user.id;
  const user = await Usermodel.findById(e);
  res.render("userdata", { user: user, alert: "" });
});

// updating user info post route
const cpUpload = upload.fields([
  { name: "image_1", maxCount: 1 },
  { name: "image_2", maxCount: 1 },
  { name: "video", maxCount: 1 }
]);
router.post("/info", tokenauth, cpUpload, async (req, res) => {
  let {
    first_name,
    middle_name,
    last_name,
    email,
    password,
    phone,
    father_name,
    mother_name,
    dob,
    address,
    state,
    city,
    pin_code,
    referrence1_name,
    referrence1_contact,
    referrence2_name,
    referrence2_contact,
        referrence3_name,
    referrence3_contact,
        referrence4_name,
    referrence4_contact,
    bank_name,
    account_holder_name,
    gender,
    ifsc_code,
    account_number,
    documnet_id
  } = req.body;
  if (req.body.referrence1_name == "" || req.body.referrence2_name == "") {
    res.render("userdata", { alert: "alert", user: req.body });
  } else {
    const userInfo = {
      first_name: first_name,
      middle_name: middle_name,
      last_name: last_name,
      phone: phone,
      email: req.body.email,
      father_name: father_name,
      mother_name: mother_name,
      dob: dob,
      address: address,
      state: state,
      city: city,
      pin_code: pin_code,
      referrence1_name: referrence1_name,
      referrence1_contact: referrence1_contact,
      referrence2_name: referrence2_name,
      referrence2_contact: referrence2_contact,
       referrence3_name: referrence3_name,
      referrence3_contact: referrence3_contact,
       referrence4_name: referrence4_name,
      referrence4_contact: referrence4_contact,
      bank_name: req.body.bank_name,
      account_holder_name: account_holder_name,
      ifsc_code: req.body.ifsc_code,
      gender: gender,
      account_number: account_number,
      document_id: documnet_id,
      image_1: "/" + req.files["image_1"][0].originalname,
      image_2: "/" + req.files["image_2"][0].originalname,
      video: "/" + req.files["video"][0].originalname
    };
    const userinfo = await Usermodel.findByIdAndUpdate(req.user.id, userInfo);
    console.log(req.user.id);
    console.log(userinfo);
    res.redirect("/user/package");
  }
});
// updating user info post route ends

// user plan get route
router.get("/package", tokenauth, async (req, res) => {
  let phone = req.user.phone;
  let id = "61b0f52ff28a0a6319dd3ee2";
  let checkapps = await ApplicationModel.findOne({ phone: phone });
  let adminData = await AdmindataModel.findById(id);
  if (checkapps) {
    switch (checkapps.application_status) {
      case "pending":
        res.redirect("/user/dashboard");
        break;
      case "approved":
        res.redirect("/user/approvedapp");
        break;
      case "rejected":
        res.redirect("/user/rejectedapp");
        break;
      case "repaid":
        res.redirect("/user/repaid");
        break;
    }
  } else {
    res.render("package", { adminData: adminData });
  }
});

// user plan post route
router.post("/package", tokenauth, async (req, res) => {
  let phone = req.user.phone;

  let checkapps = await ApplicationModel.findOne({ phone: phone });
  console.log(phone);
  if (checkapps) {
    res.send("you already have requested an application");
  } else {
    let amount = req.body.amount;
    let duration = req.body.duration;
    let charges = req.body.charges;
    let user_info = await Usermodel.findOne({ phone: phone });
    if (user_info.email && user_info.bank_name) {
      res.render("signature", {
        user: req.user,
        amount: amount,
        duration: duration,
        charges: charges
      });
    } else {
      res.redirect("/user/info");
    }
  }
});

// user plan confirmation start
router.get("/sign", tokenauth, async (req, res) => {
  res.render("signature");
});
router.post("/sign", tokenauth, async (req, res) => {
  const app = new ApplicationModel({
    amount: req.body.amount,
    duration: req.body.duration,
    charges: req.body.charges,
    phone: req.body.phone,
    repayment_date: "",
    application_status: "pending"
  });
  let result = await app.save();
   
  let  phone = req.body.phone;
 let   app_id = result.id;
 let    amount = req.body.amount;
 let    charges = req.body.charges;
  
  
   var mailOptions = {
  from: 'asimshah8110@gmail.com',
  to: 'syedaasimshah1@gmail.com',
  subject: 'subject' ,
  text: `User ` + phone + 'requestet for loan amount : ' + amount + '  on charegs  ' + charges + ' and his applicatoin id is  ' + app_id,
};
   await transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    res.send(error);
  console.log('last errror')
  } else {
    res.send('email send')
    console.log('Email sent: ' + info.response);
  }
});

  // let noti = new Notifications({
  //   title : "New Application Request Recived",
  //   phone : req.body.phone,
  //   app_id : result.id,
  // })
  // let notified = await noti.save()
  res.redirect("/user/dashboard");
});
// user plan confirmation end

// admin home page route start>
router.get("/admin", tokenauth, ensureAdmin, async (req, res) => {
  let total = await ApplicationModel.count();
  let pending = await ApplicationModel.count({ application_status: "pending" });
  let approved = await ApplicationModel.count({
    application_status: "approved"
  });
  let repaid = await ApplicationModel.count({ application_status: "repaid" });
  let rejected = await ApplicationModel.count({
    application_status: "rejected"
  });
  let id = "61b0f52ff28a0a6319dd3ee2";
  let total_bal = await AdmindataModel.findById(id);

  let repay = await PaymentModel.count();
  let notifications = await Notifications.count()

  if (total) {
    res.render("adminhome", {
      apps: total,
      total: total_bal,
      pending: pending,
      approved: approved,
      repay: repay,
      repaid: repaid,
      rejected: rejected,
      notifications : notifications
    });
  } else {
    res.render("adminhome");
  }
});
// admin home page route end>

// updating user plan status from admin side start>
// approving user plan
router.post("/approve", tokenauth, ensureAdmin, async (req, res) => {
  let id = req.body.app_id;
  let phone = req.user.phone;
  let repayment_date = req.body.repayment_date;
  console.log(repayment_date);
  let dt = Date.now();
  let loan = await ApplicationModel.findById(id);
  let loan_amount = loan.amount;
  console.log(loan_amount);
  let funds = await AdmindataModel.find({ total_funds: { $gt: loan_amount } });
  console.log(funds);
  let idd = "61b0f52ff28a0a6319dd3ee2";
  let admin_total_bal = await AdmindataModel.findById(idd);
  let admin_bal = admin_total_bal.total_funds;
  if (admin_bal > loan_amount) {
    let approved = await ApplicationModel.findByIdAndUpdate(id, {
      application_status: "approved",
      approved_date: dt,
      repayment_date: repayment_date
    });
    let new_bal = admin_bal - loan_amount;
    let updated_admin_bal = await AdmindataModel.findByIdAndUpdate(idd, {
      total_funds: new_bal
    });
  } else {
    res.send("No Enough Funds ");
  }
  res.redirect("/user/admin");
});

// rejecting user plan
router.get("/reject/app/:id", tokenauth, ensureAdmin, async (req, res) => {
  let id = req.params.id;
  let approved = await ApplicationModel.findByIdAndUpdate(id, {
    application_status: "rejected"
  });
  console.log(approved);
  res.redirect("/user/admin");
});
// updating user plan status from admin side end>

// =========***** admin view  user plan status route started ****==========
// viewing all user plans admin side
router.get("/view/app/:id", tokenauth, ensureAdmin, async (req, res) => {
  let id = req.params.id;
  let app = await ApplicationModel.findById(id);
  let applied_date = app.applied_on;
  let duration = app.duration;
  let day = applied_date.getUTCDay() - 1;
  let month = applied_date.getUTCMonth() + 1;
  console.log(Number(day) + Number(duration));
  let phone = app.phone;
  let user = await Usermodel.find({ phone: phone });
  let u = user[0];
  console.log(user);
  res.render("viewapp", { app: app, user: u });
});

// render repaid plans admin side
router.get("/view/repaid/app/:id", tokenauth, ensureAdmin, async (req, res) => {
  let id = req.params.id;
  let app = await ApplicationModel.findById(id);
  let applied_date = app.applied_on;
  let duration = app.duration;
  let day = applied_date.getUTCDay() - 1;
  let month = applied_date.getUTCMonth() + 1;
  console.log(Number(day) + Number(duration));
  let phone = app.phone;
  let user = await Usermodel.find({ phone: phone });
  let u = user[0];
  res.render("viewrepaid_app", { app: app, user: u });
});

// render approved  plan  admin side
router.get(
  "/view/approved/app/:id",
  tokenauth,
  ensureAdmin,
  async (req, res) => {
    let id = req.params.id;
    let app = await ApplicationModel.findById(id);
    let applied_date = app.applied_on;
    let duration = app.duration;
    let day = applied_date.getUTCDay() - 1;
    let month = applied_date.getUTCMonth() + 1;
    console.log(Number(day) + Number(duration));
    let phone = app.phone;
    let user = await Usermodel.find({ phone: phone });
    let u = user[0];
    res.render("viewapproved_app", { app: app, user: u });
  }
);
// =========***** admin view user plan status route started ****==========

// =========***** user landing according to plan status route started ****==========

router.get("/dashboard", tokenauth, async (req, res) => {
  let user = req.user.phone;
  let app = await ApplicationModel.findOne({ phone: user });
  res.render("reviewapp", { app: app });
});

router.get("/repaid", tokenauth, async (req, res) => {
  let user = req.user.phone;
  let app = await ApplicationModel.findOne({ phone: user });
  res.render("repaid", { app: app });
});
router.get("/rejectedapp", tokenauth, async (req, res) => {
  let user = req.user.phone;
  let app = await ApplicationModel.findOne({ phone: user });
  res.render("rejectedapp", { app: app });
});
router.get("/approvedapp", tokenauth, async (req, res) => {
  let phone = req.user.phone;
  let app = await ApplicationModel.find({ phone: phone });
  let data = app[0];
  console.log(app);
  res.render("approvedapp", { app: data });
});

// =========***** user landing according to plan status route ended ****==========




// =========***** admin fetch according to plan status  route started ****==========

router.get("/adminApproved", tokenauth, ensureAdmin, async (req, res) => {
  let approved = await ApplicationModel.find({
    application_status: "approved"
  });
  res.render("adminapprovedplans", { apps: approved });
});

router.get("/adminTotal", tokenauth, ensureAdmin, async (req, res) => {
  let total = await ApplicationModel.find();
  res.render("admintotalplans", { apps: total });
});

router.get("/adminPending", tokenauth, ensureAdmin, async (req, res) => {
  let pending = await ApplicationModel.find({ application_status: "pending" });
  res.render("adminpendingplans", { apps: pending });
});

router.get("/adminRepaid", tokenauth, ensureAdmin, async (req, res) => {
  let repaid = await ApplicationModel.find({ application_status: "repaid" });
  res.render("adminrepaidplans", { apps: repaid });
});

// =========***** admin fetch according to plan status  route ended ****==========

// =========***** add balance  route started ****==========

router.get("/admin/addBalance", tokenauth, ensureAdmin, async (req, res) => {
  let id = "61b0f52ff28a0a6319dd3ee2";
  let total_bal = await AdmindataModel.findById(id);
  res.render("adminaddbalance", { total: total_bal });
});

router.post("/admin/addBalance", tokenauth, ensureAdmin, async (req, res) => {
  let bal = req.body.addBalance;
  let amount = req.body.plan_amount;
  let duration = req.body.plan_duration;
  let charges = req.body.plan_charges;
  let id = "61b0f52ff28a0a6319dd3ee2";
  let updated_bal = await AdmindataModel.findByIdAndUpdate(id, {
    total_funds: bal,
    plan_amount: amount,
    plan_duration: duration,
    plan_charges: charges
  });
  res.redirect("addBalance");
});
// =========***** admmin add balance route ended ****==========

// =========***** admin_all users route started ****==========

router.get("/admin/allusers", tokenauth, ensureAdmin, async (req, res) => {
  let users = await Usermodel.find();
  console.log(users);
  if (users) {
    res.render("admin_all_users", { user: users });
  } else {
    res.send("no users");
  }
});
// =========***** admin all users route ended ****==========

// paymenmt api razorpay

router.post('/payout' ,tokenauth, async(req , res) => {
 let phone = req.body.phone;
  let app_id = req.body.app_id;
  let my_accountNo = process.env.ACCOUNT_NUMBER;
  let app = await ApplicationModel.findById(app_id);
  let user = await Usermodel.findOne({ phone: phone });
  let amount = app.amount;
  let charges = app.charges;
  let first_name = user.first_name;
  let email = user.email;
  let final_amount = amount - charges ;
  let user_bank_accountNO = user.account_number;
  let account_holder_name = user.account_holder_name;
  let ifsc_code = user.ifsc_code;
    try{
var data = JSON.stringify({
  "account_number": "4564566014017142",
  "amount": final_amount * 100,
  "currency": "INR",
  "mode": "IMPS",
  "purpose": "payout",
  "fund_account": {
    "account_type": "bank_account",
    "bank_account": {
      "name": account_holder_name,
      "ifsc": ifsc_code,
      "account_number": user_bank_accountNO
    },
    "contact": {
      "name": first_name,
      "email": email,
      "contact": phone,
      "type": "vendor",
      "reference_id": phone,
    }
  },
  "queue_if_low_balance": true,
  "reference_id": phone,
  "narration": "Uhaari Store",
  });

var  config = {
  method: 'post',
  url: 'https://api.razorpay.com/v1/payouts',
  headers: { 
    'Authorization': 'Basic cnpwX2xpdmVfdUVpb0toTWtwdDJNN1Q6VzZxS3JueEV0T3BNTnRxQTN5UDAzVG5o', 
    'Content-Type': 'application/json'
  },
  data : data
};

await axios(config)
.then(function (response) {
  let app = ApplicationModel.findOne({phone : phone});
  console.log(app)
  res.send(JSON.stringify(response.data));
})
.catch(function (error) {
  res.send(error);
});

  }catch(e){
    res.send(e)
  }
});



// router.post("/payment_link",tokenauth, async (req, res) => {
  
// try{
//   let phone = req.user.phone;
// let app = await ApplicationModel.findOne({phone : phone});
// let amount = app.amount;
//   console.log(amount)
  
  
// var  data = JSON.stringify({
//   "accept_partial": false,
//   "amount": Number(amount) * 100,
//   "currency": "INR",
//   "customer": {
//     "contact": "+919999999999",
//     "email": "gaurav.kumar@example.com",
//     "name": "Gaurav Kumar"
//   },
//   "description": phone,
//   "notify": {
//     "email": true,
//     "sms": true
//   }
// });

// var config = {
//   method: 'post',
//   url: 'https://api.razorpay.com/v1/payment_links/',
//   headers: { 
//     'Authorization': 'Basic cnpwX3Rlc3RfbVVvR1JpVEVibVhCMUs6QURzNzBFcnRMdEx0MnFKT2lMVWo5WE1U', 
//     'Content-Type': 'application/json'
//   },
//   data : data
// };

// await axios(config)
// .then(function (response) {
  
//   if(response.data.short_url == ''){
//     res.send(JSON.stringify(response.data));
//   }else{
//     console.log(response.data)
//     res.redirect(response.data.short_url)
//   }
// })
// .catch(function (error) {
//   res.send(error);
// });

// }catch(e){
//   console.log(e)
  
// }
  
// });
// =========***** repayment route started ****==========
router.get("/repayment", tokenauth, async (req, res) => {
  let phone = req.user.phone;
  let repayment_req = await PaymentModel.find({phone : phone})
  console.log(repayment_req)
  res.render("repayment", { alert: ""  , reqq : repayment_req});
});

router.post("/repayment", tokenauth, async (req, res) => {
  let pay = new PaymentModel({
    phone: req.body.phone,
    order_id: req.body.order_id,
    status : "pending"
  });
  let used_id = await PaymentModel.findOne({ order_id: req.body.order_id });
  if (used_id) {
    res.render("repayment", { alert: "alert" });
  } else {
    let saved_pay = await pay.save();
    console.log(saved_pay);
    if (saved_pay) {
  let phone = req.body.phone;
let order_id = req.body.order_id;
  
   var mailOptions = {
  from: 'asimshah8110@gmail.com',
  to: 'syedaasimshah1@gmail.com',
  subject: 'subject' ,
  text: 'User Phone : ' + phone + ' Requested for repayment with order_id ' + order_id
};
   await transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    res.send(error);
  console.log('last errror')
  } else {
    res.send('email send')
    console.log('Email sent: ' + info.response);
  }
});

      //===============================================================================================
      res.redirect('back')
    } else {
      res.send("failed to repay ! better luck next time");
    }
  }
});

router.get("/adminRepayments", tokenauth, ensureAdmin, async (req, res) => {
  let repay = await PaymentModel.find();
  res.render("adminrepayments", { repay: repay });
});

router.get(
  "/repayment/approved/:id",
  tokenauth,
  ensureAdmin,
  async (req, res) => {
    let id = req.params.id;
    let repay = await PaymentModel.findById(id);
    let phone = repay.phone;
    let app = await ApplicationModel.findOneAndUpdate(
      { phone: phone },
      {
        application_status: "repaid"
      }
    );
    let repayment_req = await PaymentModel.findByIdAndUpdate(
      id,
      {
        status: "Approved"
      }
    );
    if (app) {
      res.redirect("back");
    } else {
      res.send("no app related to this phone ");
    }
  }
);

router.get(
  "/repayment/rejected/:id",
  tokenauth,
  ensureAdmin,
  async (req, res) => {
    let id = req.params.id;
    let repayment_req = await PaymentModel.findByIdAndUpdate(
      id,
      {
        status: "Rejected"
      }
    );
    res.redirect("back");
  }
);

// =========***** repayment route ended ****==========

// otp routeing started
router.get("/otp", (req, res) => {
  res.render("otp");
});

router.post("/verify/otp", async (req, res) => {
  let otp = req.body.verify_otp;
  console.log(otp);
  let verified = await Usermodel.findOne({ otp: otp });
  if (verified) {
    let verify = await Usermodel.findOneAndUpdate(
      { otp: otp },
      { verified: true }
    );
    res.redirect("/user/login");
  } else {
    res.redirect("/user/verify/otp");
  }
});

router.post("/get/otp", async (req, res) => {
  let reg_phone = req.body.reg_phone;
  var otp = generateOTP();
  axios({
    url: "https://www.fast2sms.com/dev/bulkV2",
    method: "post",
    headers: {
      authorization:
        "UwizLrB0fQhFpNVtYdy8xH4oMmlbGDv91qakTIg25ZSsPWKCu6NaFrqQZl0WGMLHzPIRnctfDxvs5uk6"
    },
    data: {
      variables_values: otp,
      route: "otp",
      numbers: reg_phone
    }
  })
    .then(ee => {
      console.log(ee.data);
    })
    .catch(err => {
      console.log(err);
    });
  console.log(otp);
  let save_otp = await Usermodel.findOneAndUpdate(
    { phone: reg_phone },
    {
      otp: otp
    }
  );
  if (save_otp) {
    res.render("verifyOtp");
  } else {
    res.send("filed to save otp");
  }
});

function generateOTP() {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}
// otp routeing ended

module.exports = router;
