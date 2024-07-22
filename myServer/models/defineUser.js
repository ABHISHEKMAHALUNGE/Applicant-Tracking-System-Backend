const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passwordValidator = require('password-validator');
require("dotenv").config();

 
var passwordSchema = new passwordValidator();
passwordSchema.has().lowercase();
passwordSchema.has().uppercase();
passwordSchema.has().symbols();
passwordSchema.has().digits();


const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw 'Invalid Email!';
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength:8,
        validate(value){
            if(!passwordSchema.validate(value)){
                throw "Invalid password!";
            }
        }
    },
    status: {
        type: String,
        required:true
    },
    facebook: {
        type: String
    },
    linkedin: {
        type: String
    },
    gmailId:{
        type: String
    },
    gmailPassword:{
        type: String
    },
    lastFetchedTime:{
        type: Date,
        default: Date.now
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

userSchema.methods.getAuthenticationToken = async function(){

    const myUser = this;
    const apiKey = process.env.TOKEN_SECRET || 'Trial_key';
    const token = jwt.sign({_id: myUser._id.toString()},apiKey,{
        expiresIn: "30d",
    });
    if(!token)
        throw 'JWT Error!';
    myUser.tokens = myUser.tokens.concat({token});
    await myUser.save();

    return token;
}

userSchema.statics.findByCredentials = async (email,pass)=>{

    const myUser = await user.findOne({email});
    if(!myUser){
        throw 'Email not registered';
    }

    const boolean = await bcrypt.compare(pass,myUser.password);
    if(!boolean){
        throw 'Incorrect password!';
    }

    return myUser;
}

userSchema.statics.findByStatus = async (status)=>{

    const data = await user.find({status});
    if(!data){
        throw 'No data found!';
    }
    return data;
}

userSchema.statics.emailValidation = async (email)=>{

    const myUser = await user.findOne({email});
    if(!myUser){
        return 0;
    }
    return 1;
}

userSchema.pre('save',async function(next){
    const user = this;
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8);
    }
    next();
})

const user = mongoose.model('user',userSchema);
module.exports = user;