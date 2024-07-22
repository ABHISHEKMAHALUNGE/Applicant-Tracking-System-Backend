const express = require('express');
const candidate = require('../models/defineCandidate');
const auth = require('../middleware/auth.js');
const multer   = require('multer');
const path      =   require('path');
const uniqid    =   require('uniqid');
const axios = require('axios');
const client = require('../models/defineClient');

const router = new express.Router();

// Multer setup
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,(path.join(__dirname,'../assets/resumes')));
    },
    filename:function(req,file,cb){

        const file_name = uniqid()+".pdf";
        cb(null,file_name)
    }
});
const upload = multer({storage:storage});



// add and parse resume
router.post('/parseResume', auth , upload.single('resume') , async (req,res)=>{

    if(req.file == undefined || req.file.size == 0){    
        throw('Please upload resume!');
    }

    const resume_url = `http://143.110.191.52:8089/resumes/${req.file.filename}`;
    req.body.resumeUrl = resume_url;
    
    try{
        const apiRes = await axios.post('http://143.110.191.52:5000/getResumeData',{
            resume_url: resume_url
        });

        req.body.name = apiRes.data.name;
        req.body.email = apiRes.data.email;
        req.body.skills = apiRes.data.skills;
        req.body.degree = apiRes.data.degree;
        req.body.collegeName = apiRes.data.college_name;
        req.body.totalExp = apiRes.data.total_experience;
        req.body.designation = apiRes.data.designition;
        req.body.contactNumber = apiRes.data.mobile_number;
    
        
        const candidateDetails = new candidate(req.body);   
        res.status(200).json({
            success: true,
            message: 'Successfully parsed resume!',
            res: candidateDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


// save candidate
router.post('/saveCandidate', auth , async (req,res)=>{

    req.body.candidateAddedBy = req.myuser.email;
    
    try{
        
        const candidateDetails = new candidate(req.body);   
        await candidateDetails.save();

        res.status(200).json({
            success: true,
            message: 'Successfully saved!'
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

//to read all data from Candidates database
router.post('/getAllCandidates', auth , async (req,res)=>{
    
    try{
        const candidates = await candidate.find({});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: candidates
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});


//to read all data from candidate database of a particular req
router.post('/getCandidatesByReq', auth , async (req,res)=>{
    
    try{
        const candidateDetails = await candidate.find({refReqId: req.body.refReqId});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: candidateDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});



// delete client from database
router.post('/deleteCandidate', auth , async (req,res)=>{
    
    try{
        const candidateDetails = await candidate.findOne({_id: req.body.id});
        await candidateDetails.remove();
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

// get a candidate from database
router.post('/getCandidate', auth , async (req,res)=>{
    
    try{
        const myCandidate = await candidate.findOne({_id:req.body.id});
        res.status(200).json({
            success: true,
            message: 'Sucessfully fetched!',
            result: myCandidate
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});




//  isgraded or not
router.post('/isGraded' , async (req,res)=>{
    
    try{
        const candidateDetails = await candidate.findOne({_id: req.body.candidateId});
        
        if(!candidateDetails)
        {
          res.status(401).send({
              status: false,
              message: "could not find candidate details!"
          })
        }
        else if(candidateDetails.score)
        {
            res.status(200).json({
                status: true,
                isGraded: true,
                message: "Graded!"
            });
        }
        else
        {
            res.status(200).json({
                status: true,
                isGraded: false,
                message: 'Not graded'
            });
        }
    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})


// grade candidate
router.post('/gradeCandidate' , async (req,res)=>{
    
    try{
        const candidateDetails = await candidate.findOne({_id: req.body.candidateId});
        
        if(!candidateDetails)
        {
          res.status(401).send({
              status: false,
              message: "could not find candidate details"
          })
        }
        else
        {
            candidateDetails.score = req.body.score;
            candidateDetails.response = req.body.responseArray;
            candidateDetails.isGraded = true;
            await candidateDetails.save();
            
            res.status(200).json({
                status: true,
                message: 'Candidate has been graded successfully!'
            });
        }
    }catch(e){
        res.status(500).json({
            status: false,
            message: e
        });
    }
})

// exporting module
module.exports = router;