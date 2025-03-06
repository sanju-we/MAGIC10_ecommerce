const express = require("express")
const app = express()
const nocache = require('nocache')
const env = require("dotenv").config()
const MongoStore = require('connect-mongo')
const session = require('express-session')
const passport = require('./config/passport')
const db = require("./config/db")
const bodyParser = require("body-parser")
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
const path = require('path')
db()
 
app.use(nocache())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
  }),
  
  cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use((req,res,next)=>{
  res.set('cache-control','no-store')
  next()
})

//passport initialization
app.use(passport.initialize())
app.use(passport.session())

app.set("view engine","ejs")
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,"public")))

app.use("/",userRouter)
app.use("/admin",adminRouter)


app.listen(process.env.PORT, () => {
  console.log(`Server Running on ${process.env.PORT}`)
})

module.exports = app
