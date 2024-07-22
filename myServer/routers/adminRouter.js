const express = require('express');
const user = require('../models/defineUser.js');
const auth = require('../middleware/auth.js');

const router = new express.Router();


// register new user
router.post('/createNewStackHolder', auth , async (req,res)=>{
    
    if(req.myuser.status === "superAdmin")
    {
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

            if(req.body.status === "admin" || req.body.status ==="recruiter")
            {

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
            else
            {
                res.status(500).json({
                    success: false,
                    message: "Pass a valid status of stackholder!"
                });
            }
        }
    }
    else
    {
        res.status(500).json({
            success: false,
            message: "Don't have authority"
        });
    }
});



// login 
router.post('/login', async (req,res)=>{

    try{
        const userCredentials =  await user.findByCredentials(req.body.email,req.body.password);
        if( !(userCredentials.status =="admin" || userCredentials.status == "superAdmin") )
        throw "Not an admin";
        else
        {
            const token = await userCredentials.getAuthenticationToken();
            if(!token)
            throw "Server is not responding!";

            res.status(200).json({
                status: true,
                message: 'Successfully executed!',
                token: token
            });
        }

    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})


// approve to Recruiter
router.post('/approve', auth, async (req,res)=>{

    try{
        if(req.myuser.status=='admin' || req.myuser.status=='superAdmin')
        {
            const myUser = await user.findOne({email: req.body.email});
            if(!myUser){
                throw 'Not an authorized user!';
            }
            myUser.status = req.body.status;

            await myUser.save();
            res.status(200).json({
                status: true,
                message: 'Successfully executed!'
            });
        }
        else
        {
            throw 'Permission Denied!';
        }
    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

// discard the  Recruiter
router.post('/discard', auth, async (req,res)=>{

    try{
        if(req.myuser.status == "admin" || req.myuser.status=="superAdmin")
        {
            const myUser = await user.findOne({email: req.body.email});
            await myUser.remove();
            res.status(200).json({
                status: true,
                message: 'Account successfully deleted!'
            });
        }
        else
        {
            throw 'Permission Denied!';
        }

    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})


// get all data by status
router.post('/getByStatus', auth, async (req,res)=>{

    try{
        if(req.myuser.status=='admin' || req.myuser.status == 'superAdmin')
        {
            const myUser = await user.findByStatus(req.body.status);
            res.status(200).json({
                status: true,
                message: 'Successfully executed!',
                result: myUser
            });
        }
        else
        {
            throw 'Permission Denied!';
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
        else
        {
            await req.myuser.remove();
            res.status(200).json({
                status: true,
                message: 'Account successfully deleted!'
            });
        }
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