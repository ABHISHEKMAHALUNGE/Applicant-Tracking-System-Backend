const express = require('express');
const client = require('../models/defineClient.js');
const auth = require('../middleware/auth.js');
const multer   = require('multer');
const path      =   require('path');

const router = new express.Router();

// Multer setup
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,(path.join(__dirname,'../assets/clientImage')));
    },
    filename:function(req,file,cb){
        const file_name = Date.now()+".jpg";
        cb(null,file_name)
    }
});
const upload = multer({storage:storage});



// add new client
router.post('/addClient', auth , upload.single('image') , async (req,res)=>{
    req.body.clientAddedBy = req.myuser.email;
    
    if(req.file == undefined || req.file.size == 0){
        
        throw('Please upload image!');
    }
    const image_url = `http://143.110.191.52:8089/clientImage/${req.file.filename}`;
    req.body.imageUrl = image_url;
    try{
        const clientDetails = new client(req.body);   
        await clientDetails.save();
        res.status(200).json({
            success: true,
            message: 'Successfully added client!'
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

//to read all data from client database
router.post('/getAllClients', auth , async (req,res)=>{
    
    try{
        const clients = await client.find({isApproved: true});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: clients
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


//to read all data from client database of a particular recruiter
router.post('/getClientsByRecruiter', auth , async (req,res)=>{
    
    try{
        const clients = await client.find({clientAddedBy: myuser.email , isApproved: true});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: clients
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: 'Server not responding!'
        });
    }
});



// delete client from database
router.post('/deleteClient', auth , async (req,res)=>{
    
    try{
        const clientDetails = await client.findOne({_id: req.body.id});
        await clientDetails.remove();
        res.status(200).json({
            success: true,
            message: 'Sucessfully deleted!'
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

// get all un-approved clients from database
router.post('/getUnapprovedClient', auth , async (req,res)=>{
    
    try{
        const clientDetails = await client.find({isApproved: false});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: clientDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

// get a client from database
router.post('/getClient', auth , async (req,res)=>{
    
    try{
        const myClient = await client.findOne({_id:req.body.id});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: myClient
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: 'Server not responding!'
        });
    }
});

// update client
router.post('/updateClient',auth , upload.single('image') , async (req,res)=>{
    
    try{        
        const myClient = await client.findOne({_id:req.body.id});
        if(!(req.file == undefined || req.file.size == 0)){
            const image_url = `http://143.110.191.52:8089/${req.file.filename}`;
            myClient.imageUrl = image_url;
        }
        for (var key in req.body) {
            myClient[key]=req.body[key];
        }
        await myClient.save();

        res.status(200).json({
            status: true,
            message: 'Client updated successfully!'
        });
    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

// approve client
router.post('/approveClient',auth , async (req,res)=>{
    
    try{        
        if(req.myuser.status === "admin" || req.myuser.status === "superAdmin")
        {
            const myClient = await client.findOne({_id:req.body.id});
            myClient.isApproved = true;
            await myClient.save();
            
            res.status(200).json({
                status: true,
                message: 'Client updated successfully!'
            });

        }
        else
        throw 'Donot have Authority to Approve!';
        

    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

// exporting module
module.exports = router;