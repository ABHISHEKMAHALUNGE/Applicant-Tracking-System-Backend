const express = require('express');
const attachmentModel = require('../models/defineAttachment.js');
var fs = require('fs');
var base64 = require('base64-stream');
var Imap = require('node-imap');
const uniqid    =   require('uniqid');
const path      =   require('path');
const auth = require('../middleware/auth.js');
const candidate = require('../models/defineCandidate');
const axios = require('axios');

const router = new express.Router();


router.post('/fetchAttachments',auth, async (req, res) => {

        var imap = new Imap({
            user: req.myuser.gmailId,
            password: req.myuser.gmailPassword,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            secure: true,
            // connTimeout: 10000,
            // authTimeout: 5000,
            tlsOptions: {
                rejectUnauthorized: false
            }
        });


        function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing; }


        function findAttachmentParts(struct, attachments) {
            return new Promise((resolve,reject) => {
                attachments = attachments || [];
                for (var i = 0, len = struct.length, r; i < len; ++i){
                    if (Array.isArray(struct[i])) {
                        findAttachmentParts(struct[i], attachments);
                    } else {
                        if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
                            attachments.push(struct[i]);
                        }
                    }
                }
                resolve(attachments);
            })
        }

        function buildAttMessageFunction(attachment,dateTime,subject) {
            return new Promise((resolve,reject)=>{

                var filename = attachment.params.name;
                var encoding = attachment.encoding;
                var file_name='';
                if(filename.endsWith(".pdf"))
                file_name = uniqid()+".pdf";
                else if(filename.endsWith(".doc"))
                file_name = uniqid()+".doc"; 
                else
                file_name = uniqid()+".docx"; 
                
                resolve(function (msg, seqno) {
                    msg.on('body', async (stream, info) => {
                        if (filename.endsWith(".pdf") || filename.endsWith(".doc") || filename.endsWith(".docx")) {
                            
                            var writeStream = fs.createWriteStream(path.join(__dirname,'../assets/resumes/') + file_name);
                            
                            if (toUpper(encoding) === 'BASE64') {
                                stream.pipe(new base64.Base64Decode()).pipe(writeStream);
                            }
                            else {
                                stream.pipe(writeStream);
                            }
                        }
                    });
                    msg.once('end', async ()=> {
                        const attachmentDetails = new attachmentModel();
                        attachmentDetails.dateTime = dateTime;
                        attachmentDetails.subject = subject;
                        attachmentDetails.recEmail = req.myuser.email;
                        attachmentDetails.attachmentUrl = `http://143.110.191.52:8089/resumes/${file_name}`;
                        await attachmentDetails.save();
                    });
                })
            })
        }
        const currDate = req.myuser.lastFetchedTime;
        imap.once('ready', function () {
            imap.openBox('INBOX', true, function (err, box) {
                if (err) throw err;
                imap.search([ ['SINCE',req.myuser.lastFetchedTime] ], function(err, results11) {
                    if (err)
                    {
                        res.status(401).json({
                            success: false,
                            type: "Internal server error",
                            message: err
                        });
                    }
                    if(results11.length === 0)
                    {
                       return res.status(200).json({
                            success: true,
                            message: "Nothing to fetch",
                        });
                    }
                    var f = imap.fetch(results11, { 
                    // var f = imap.seq.fetch('1:*', {
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
                        struct: true
                    });
                    const xyz = ()=>{
                        return new Promise((resolve,reject)=>{
                            f.on('message', function (msg, seqno) {

                                var subject='';

                                msg.on('body', function (stream, info) {
                                    var buffer = '';
                                    stream.on('data', function (chunk) {
                                        buffer += chunk.toString('utf8');
                                    });
                                    stream.once('end', function () {
                                        subject = Imap.parseHeader(buffer).subject[0];
                                    });
                                });
                                msg.once('attributes', async (attrs)=> {
                                    var attachments = await findAttachmentParts(attrs.struct);
                                    for (var i = 0, len = attachments.length; i < len; ++i) {
                                        var attachment = attachments[i];
                                        
                                        var f = imap.fetch(attrs.uid, {
                                            bodies: [attachment.partID],
                                            struct: true
                                        });
                                        if(Date.parse(currDate) < Date.parse(attrs.date))
                                        {
                                            f.on('message', await buildAttMessageFunction(attachment,attrs.date,subject));
                                        }
                                    }
                                });
                            });
                            f.once('error', function (err) {
                                reject(err);
                            });
                            f.once('end', function () {
                                resolve();
                                imap.end();
                            });
                        })
                    }
                    xyz().then(()=>{
                        req.myuser.lastFetchedTime = new Date();
                        req.myuser.save();
                        res.status(200).json({
                            success: true,
                            message: 'Successfully fetched all attachments!'
                        });
                    })
                    .catch((e)=>{
                        res.status(500).json({
                            success: false,
                            message: e
                        });
                    })
                });
            });
        });

        imap.once('error', function (err) {
            res.status(401).json({
                success: false,
                message: err
            });
        });

        imap.connect();

})


// get all attachments
router.post('/getAllAttachments',auth,async (req,res)=>{

    try{
        const allAttDetails = await attachmentModel.find({isParsed: false});
        res.status(200).json({
            success: true,
            message: 'Successfully fetched all attachments!',
            allAttDetails
        });
    }catch(e){
        res.status(500).json({
            success: false,
            message: e
        });
    }
});

// parse all attachments
router.post('/parseAllAttachments',auth,async (req,res)=>{

    const allAttDetails = await attachmentModel.find({isParsed: false});
    if(allAttDetails.length === 0 || !allAttDetails)
        return res.status(200).json({
            success: true,
            message: "No resumes to parse"
        });
    for (const key in allAttDetails) {
        let apiRes = await axios.post('http://143.110.191.52:5000/getResumeData',{
            resume_url: allAttDetails[key].attachmentUrl
        });
        if(!apiRes)
            return res.status(500).json({
                success: false,
                message: "flask server not responding"
            });
        if(!(apiRes.data.email === null && apiRes.data.name === null))
        {

            let candidateDetails = new candidate();  
    
            candidateDetails.name = apiRes.data.name;
            candidateDetails.email = apiRes.data.email;
            candidateDetails.skills = apiRes.data.skills;
            candidateDetails.degree = apiRes.data.degree;
            candidateDetails.collegeName = apiRes.university;
            candidateDetails.totalExp = apiRes.data.total_exp;
            candidateDetails.designation = apiRes.data.designition;
            candidateDetails.contactNumber = apiRes.data.phone;
            candidateDetails.refReqId = "none";
            candidateDetails.resumeUrl = allAttDetails[key].attachmentUrl;
            candidateDetails.candidateAddedBy = allAttDetails[key].recEmail;
            candidateDetails.time = allAttDetails[key].dateTime;
            
            await candidateDetails.save();
            await attachmentModel.findOneAndUpdate({_id: allAttDetails[key]._id},{isParsed: true});
        }
        
    }
    res.status(200).json({
        success: true,
        message: "All resumes parsed successfully"
    });
});

module.exports = router;