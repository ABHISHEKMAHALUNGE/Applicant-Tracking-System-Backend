"use strict";
const nodemailer = require("nodemailer");
const express = require('express');
const user = require('../models/defineUser.js');
const auth = require('../middleware/auth.js');

const router = new express.Router();

// register new user
router.post('/register', async (req,res)=>{
    
    req.body.lastFetchedTime = new Date();
    const userCredentials =  await user.emailValidation(req.body.email);
    
    if(userCredentials===1)
    {
        res.status(401).json({
            success: false,
            message: 'Email Already there!'
        });
    }
    else
    {
        req.body.status='none';
        const userDetails = new user(req.body);   
        try{
            await userDetails.save();
            res.status(200).json({
                success: true,
                message: 'Successfully registered!'
            });
        }catch(e){
            res.status(500).json({
                success: false,
                message: e
            });
        }
    }
});

//to read all data from database
router.get('/getAll', async (req,res)=>{
    
    try{
        const users = await user.find({});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: users
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: 'Server not responding!'
        });
    }
});

// login 
router.post('/login', async (req,res)=>{

    try{
        const userCredentials =  await user.findByCredentials(req.body.email,req.body.password);
        if(userCredentials.status=="none")
        throw "Not approved by Admin!";
        else
        {
            const token = await userCredentials.getAuthenticationToken();
            if(!token)
            throw "Server is not responding!";

            res.status(200).json({
                status: true,
                message: 'Successfully executed!',
                token: token,
                status: userCredentials.status
            });
        }

    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

//logout
router.post('/logout',auth, async (req,res)=>{

    try{
        req.myuser.tokens = req.myuser.tokens.filter((tok)=>{
        return tok.token !== req.token;
        });

        await req.myuser.save();
        res.status(200).json({
            status: true,
            message: 'Successfully Logged out!'
        });
    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

router.post('/generateToken',async(req,res)=>{

        try{
            const myUser = await user.findOne({email: req.body.email});
            if(!myUser)
            throw 'Email Not there!';
            else
            {

                const token = await myUser.getAuthenticationToken();
                if(!token)
                throw "Server is not responding!";


                async function main() {
                let transporter = nodemailer.createTransport({

                    service:'gmail',
                    secure: false, 
                    auth: {
                        user: 'email',
                        pass: 'password'  
                    },
                    tls:{
                        rejectUnauthorized:false
                    }
                });

                let info = await transporter.sendMail({
                    from: 'email',
                    to: myUser.email,
                    subject: "Recover Password", 
                    html: "<b>Hello "+myUser.name+",<br>Click on the given Link  to update password <br> <a href='http://localhost:4200/setNewPassword?token="+token+"'>Click Here</a>" 
                });
                }
                main().catch(console.error);

                res.status(200).json({
                    status: true,
                    message: 'Successfully executed!',
                    token: token
                });
            }
        }
        catch(e){
            res.status(500).json({
                status: false,
                message: e
            });
        }


})

// log out of all devices
router.post('/logoutAll',auth, async (req,res)=>{

    try{
        req.myuser.tokens = [];
        await req.myuser.save();

        res.status(200).json({
            status: true,
            message: 'Successfully Logged out of all devices!'
        });
    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

//delete account
router.delete('/delete',auth, async (req,res)=>{

    try{
        if(req.myuser.status == 'superAdmin')
            throw 'SuperAdmin account cannot be deleted!';
        await req.myuser.remove();

        res.status(200).json({
            status: true,
            message: 'Account successfully deleted!'
        });
    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

// update password
router.post('/updatePassword',auth, async (req,res)=>{

    try{        
        
        req.myuser.password = req.body.password;
        await req.myuser.save();

        res.status(200).json({
            status: true,
            message: 'Password updated successfully!'
        });
    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

// exporting module
module.exports = router;
