const express = require('express');
const requirement = require('../models/defineRequirement.js');
const client = require('../models/defineClient.js');
const auth = require('../middleware/auth.js');

const router = new express.Router();



// update a question
router.post('/updateQues', auth , async (req,res)=>{

    try{
        const reqDetails = await requirement.findOne({_id: req.body.reqId});

        for (x in reqDetails.questions) {
            if(reqDetails.questions[x]._id==req.body.ques_id)
            {
                reqDetails.questions[x].ques = req.body.question;
                reqDetails.questions[x].nature = req.body.nature;
            }
          }

        await reqDetails.save();
        res.status(200).json({
            success: true,
            message: 'Successfully updated question!'
        });

    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


// delete a question
router.post('/deleteQues', auth , async (req,res)=>{

    try{
        const reqDetails = await requirement.findOne({_id: req.body.reqId});

        reqDetails.questions = reqDetails.questions.filter((q)=>{
            return q._id != req.body.ques_id;
            });

        await reqDetails.save();
        res.status(200).json({
            success: true,
            message: 'Successfully deleted question!'
        });

    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

// add all questions
router.post('/addQues', auth , async (req,res)=>{

    try{
        const updated = await requirement.findOneAndUpdate({_id: req.body.reqId},{questions: req.body.questionsArray});
        if(updated)
            res.status(200).json({
                success: true,
                message: 'Successfully added question!'
            });
        else
            res.status(404).json({
                success: false,
                message: 'could not find the requirements'
            });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

// add a new question
router.post('/addAQues', auth , async (req,res)=>{

    try{
        const reqDetails = await requirement.findOne({_id: req.body.reqId});
        reqDetails.questions = reqDetails.questions.concat({ques: req.body.question,nature: req.body.nature});
        await reqDetails.save();
        res.status(200).json({
            success: true,
            message: 'Successfully added question!'
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

// get all questions
router.post('/getAllQues', async (req,res)=>{

    try{
        const reqDetails = await requirement.findOne({_id: req.body.reqId});

        res.status(200).json({
            success: true,
            message: 'Successfully fetched questions!',
            questions: reqDetails.questions
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});



// add new requirement
router.post('/addReq', auth , async (req,res)=>{
    
    req.body.RequirementAddedBy = req.myuser.email;
        
    try{
        const clients = await client.findOne({_id: req.body.clientRef});
        req.body.imageUrl = clients.imageUrl;
        
        const reqDetails = new requirement(req.body);
        await reqDetails.save();
        res.status(200).json({
            success: true,
            message: 'Successfully added client!',
            id: reqDetails._id
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


// update requirement (Details)
router.post('/updateReq', auth , async (req,res)=>{
    
    try{
        const reqDetails = await requirement.findOne({_id: req.body.id}); 
        for (var key in req.body) {
            if(key !== "id")
                reqDetails[key]=req.body[key];
        }

        await reqDetails.save();
        res.status(200).json({
            success: true,
            message: 'Successfully added client!',
            id: reqDetails._id
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


// approve requirement (Details)
router.post('/approveReq', auth , async (req,res)=>{
    
    try{
        if(req.myuser.status === "admin" || req.myuser.status === "superAdmin" )
        {
            const reqDetails = await requirement.findOne({_id: req.body.id}); 
            reqDetails.isApproved = true;
            await reqDetails.save();

            res.status(200).json({
                success: true,
                message: 'Successfully approved Requirement!',
                id: reqDetails._id
            });
        }
        else
        throw "Donot have Authority to approve!";
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


// close requirement
router.post('/closeReq', auth , async (req,res)=>{
    
    try{
        if(req.myuser.status === "admin" || req.myuser.status === "superAdmin" )
        {
            const reqDetails = await requirement.findOne({_id: req.body.id}); 
            reqDetails.isOpen = false;
            await reqDetails.save();

            res.status(200).json({
                success: true,
                message: 'Successfully closed Requirement!',
                id: reqDetails._id
            });
        }
        else
        {
            const reqDetails = await requirement.findOne({_id: req.body.id}); 
            if(reqDetails.RequirementAddedBy === req.myuser.email)
            {
                reqDetails.isOpen = false;
                await reqDetails.save();

                res.status(200).json({
                    success: true,
                    message: 'Successfully closed Requirement!',
                    id: reqDetails._id
                });
            }   
            else
            {
                throw "Donot have Authority to close requirement!";
            }
        }
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


//to read paricular requirement from database
router.post('/getParticularReq', auth , async (req,res)=>{
    
    try{
        const reqDetails = await requirement.findOne({_id: req.body.id});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: reqDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


//to read all data from unapproved requirement from database
router.post('/getUnapprovedReq', auth , async (req,res)=>{
    
    try{
        let reqDetails = await requirement.find({isApproved: false , isComplete: true});
        
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: reqDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

//to read all data of closed requirement from database
router.post('/getClosedReq', auth , async (req,res)=>{
    
    try{
        let reqDetails = await requirement.find({isOpen: false , isComplete: true , isApproved: true});
        
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: reqDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

//to read all data of open requirement from database
router.post('/getOpenReq', auth , async (req,res)=>{
    
    try{
        let reqDetails = await requirement.find({isOpen: true , isComplete: true , isApproved: true});
        
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: reqDetails,
            hello: "hiii",
            fbLink: req.myuser.facebook,
            linkedinLink: req.myuser.linkedin
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

//to get all requirement of a particular cleint
router.post('/getReq', auth , async (req,res)=>{
    
    try{
        const reqDetails = await requirement.find({RequirementAddedBy: req.myuser.email , clientRef: req.body.id, isApproved: true , isComplete: true});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: reqDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


//to get all requirement of a particular recruiter
router.post('/getReqByRecruiter', auth , async (req,res)=>{
    
    try{
        const reqDetails = await requirement.find({RequirementAddedBy: req.myuser.email , isApproved: true , isComplete: true});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: reqDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


//to get all approved requirementr
router.post('/getAllReq', auth , async (req,res)=>{
    
    try{
            const reqDetails = await requirement.find({isComplete: true, isApproved: true });
            res.status(200).json({
                success: true,
                message: 'Sucessfully fetched!',
                result: reqDetails
            });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

//to delete data from Requirement Database
router.post('/deleteReq', auth , async (req,res)=>{
    
    try{
        const reqDetails = await requirement.findOne({_id: req.body.id});
        await reqDetails.remove();
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


// Exporting Module
module.exports = router;