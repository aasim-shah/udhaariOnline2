const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const conn = require('../db/conn')

const userSchema = mongoose.Schema({
    email : {type : String   },
    password : {type : String   },
    first_name : {type : String   },
    middle_name :  {type : String  } ,
    last_name :  {type : String   },
    phone : {type : String , unique: true,integer: true },
    father_name :{type : String   },
    mother_name :{type : String   },
    dob : {type : String  },
    otp : {type: String},
    user_age_points : {type : Number,  default: 0},
    user_city_points : {type : Number,  default: 0},
    user_gender_points : {type : Number,  default: 0},
    user_total_points : {type : Number,  default: 0},
    gender : String,
    address : String,
    state : {type : String   },
    city : {type : String   },
    pin_code : {type : String   },
    referrence1_name : {type : String },
    referrence1_contact : {type : String  },
    referrence2_name : {type : String },
    referrence2_contact : {type : String  },
      referrence3_name : {type : String },
    referrence3_contact : {type : String  },
      referrence4_name : {type : String },
    referrence4_contact : {type : String  },
    document_id : {type : String },
    image_1 : {type : String },
    image_2 : {type : String },
    image_3 : {type : String },
    video : {type : String  },
    bank_name :{type : String},
    account_holder_name :{type : String},
    ifsc_code :{type : String },
    account_number :{type : String   },
    verified : {type : String},
  agent_role : String,
  ref_code : String,
    isAdmin : String,
    isInvestor : String,    
    isAgent : String,

    tokens : [{

        token : {
            type : String,
            required : true
        }
    }
    ]
})

userSchema.methods.authuser =async function(){
     const jwttoken = jwt.sign({_id : this._id} , 'stgfingsecretkey')
     this.tokens = this.tokens.concat({token : jwttoken})
     await this.save()
     return jwttoken;
}
userSchema.methods.authuser_login = async function(){
     const jwttoken = jwt.sign({_id : this._id} , 'stgfingsecretkey')
     this.tokens = this.tokens.concat({token : jwttoken})
     return jwttoken;
}
const Usermodel = mongoose.model('users' , userSchema)

module.exports = Usermodel;