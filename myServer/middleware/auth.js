const jwt = require('jsonwebtoken');
const user = require('../models/defineUser.js');
require("dotenv").config();

const auth = async (req,res,next)=>{
    try{
        const token = req.header('Authorisation').replace('Bearer','');
        const apiKey = process.env.TOKEN_SECRET || 'Trial_key';
        const decoded = jwt.verify(token,apiKey);
        const myuser = await user.findOne({_id : decoded._id,'tokens.token': token}); 
        
        if(!myuser){
            throw new Error();
        }
        
        req.myuser = myuser;
        req.token = token;
        next();
    }
    catch(e){
        res.status(500).json({
            status: false,
            message: 'Authentication failed!'
        });
    }
}
module.exports = auth;
