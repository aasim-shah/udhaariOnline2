const express = require('express')
const conn = require('./db/conn')
const Usermodel = require('./models/userModel')
const Planmodel = require('./models/applicationModel')
const userRouter = require('./routers/userrouter')
const session = require('express-session')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
const ejs = require('ejs')
const app = express()
const multer  = require('multer')
app.set('view engine' , 'ejs')
app.use(session({ secret: "cats" }));
app.use('/user' , userRouter)
// let static_path = path.join(__dirname +'/uploads')
let static_path = path.join(__dirname +'/uploads')
console.log(static_path);
app.use(express.static(static_path))
// app.use('/user/view',express.static(static_path))
console.log(static_path);

const http = require('http').Server(app);
const io = require('socket.io')(http);

const chatsSchema = mongoose.Schema({
    username: String,
    message: String,
    fromAdmin: Boolean, 
});
let Chat = mongoose.model('chat' , chatsSchema);

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')   
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)      
    }
})
const port = process.env.PORT || 3000;

app.get('/' , (req , res) => {
  res.render('home');

})
var upload = multer({ storage: storage });

// app.post('/profile', upload.array('image', 3), function (req, res, next) {
//     // req.files is array of `photos` files
//     console.log(req.files);
//     // req.body will contain the text fields, if there were any
//   })

  const cpUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image1', maxCount: 1 }, {name : 'image2', maxCount:1}])
app.post('/profile', cpUpload, function (req, res, next) {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
})

app.get('/profile', (req , res)=> {
    res.render('userdata2')
})
  

app.get('/contacts' , (req, res) => {
  res.render('contacts')
})



//socket.io
io.on("connection",socket => {

    socket.on("join room", roomName => {
        socket.join(roomName);
    });

    socket.on("new message",async message => {

        var chat = new Chat({
            username: message.username,
            message:message.message,
            fromAdmin: message.fromAdmin, 
        });

        chat.save();


        if(message.fromAdmin){
            await Usermodel.updateOne({username: message.username},{$set:{unreadMessages: true}});
        }else{
            await Usermodel.updateOne({username: message.username},{$set:{newMessages: true}});
        }

        io.sockets.in(message.username).emit("new message",chat);
        if(!chat.fromAdmin){
            io.sockets.in('admin').emit("new message",chat);
        }
    });

    socket.on("mark seen",async data =>{
        if(data.isAdmin){
            await Usermodel.updateOne({username: data.username},{$set: {newMessages: false}});
        }else{
            await Usermodel.updateOne({username: data.username},{$set: {unreadMessages: false}});
        }

        if(data.isAdmin){
            io.sockets.in('admin').emit("mark seen",data.username);
        }
    });

});

app.get('/support',async(req,res)=>{
    if(req.isAuthenticated()){
        if(!req.user.isAdmin){
            var messages = await Chat.find({username: req.user.username});
            res.render('support',{messages: messages, username: req.user.username, isAdmin: false});
        }else{
            res.redirect('/admin/support');
        }
    }else{
        res.redirect('/login');
    }
});


var server = http.listen(process.env.PORT || 3000, () => {
    console.log('server is running on port', server.address().port);
});




// app.listen(port , () => {
//     console.log(`server is running on ${port} at http://localhost:${port}`);
// })