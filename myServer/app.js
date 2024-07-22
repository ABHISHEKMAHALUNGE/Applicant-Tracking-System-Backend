//Including require modules
var base64 = require('base64-stream');
var Imap = require('node-imap');
var fs = require('fs');
const uniqid    =   require('uniqid');
const path      =   require('path');
const express       =   require('express');
const bodyparser    =   require('body-parser');
const app           =   express();
const cors          =   require("cors");
const userAuth      =   require('./routers/userRouter');
const reqAuth      =   require('./routers/reqRouter');
const adminAuth      =   require('./routers/adminRouter');
const clientAuth      =   require('./routers/clientRouter');
const candidateAuth      =   require('./routers/candidateRouter');
const attAuth      =   require('./routers/fetchingAttachmentRouter');
const validateUser = require('./middleware/validateUser.js');
const attachmentModel = require('./models/defineAttachment.js');
const candidate = require('./models/defineCandidate');
const axios = require('axios');
const user = require('./models/defineUser.js');

//BODY PARSER PRESET
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.text({ limit: '200mb' }));


// Multer image upload
// app.use('/uploads',express.static('uploads'));
app.use("/assets",express.static('assets'));



// CORS PRESETS
app.use(cors());

app.use(express.static("docs"));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,PUT,OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

const parseFetchedResumes= async ()=>{
    const allAttDetails = await attachmentModel.find({isParsed: false});
    for (const key in allAttDetails) {
        try{

            let apiRes = await axios.post('http://143.110.191.52:5000/getResumeData',{
                resume_url: allAttDetails[key].attachmentUrl
            });
            if(!apiRes)
            throw "Internal server error";
            
            if(apiRes.data.name !== null)
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
                console.log("One more resume parsed");
            }
        }
        catch(error){
            console.log("Error : "+error);
        }
    }
    return console.log("all resumes parsed!");
}
setTimeout(parseFetchedResumes, 60000);
setInterval(parseFetchedResumes,3600000);


const fetcheResumes= async ()=>{
    const allUsers = await user.find();
    for (const key in allUsers)
    {
        if(allUsers[key].gmailId !== null && allUsers[key].gmailPassword !== null && allUsers[key].lastFetchedTime !== null)
        {
            var imap = new Imap({
                user: allUsers[key].gmailId,
                password: allUsers[key].gmailPassword,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
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
                                
                                var writeStream = fs.createWriteStream(path.join(__dirname,'./assets/resumes/') + file_name);
                                
                                if (toUpper(encoding) === 'BASE64') {
                                    stream.pipe(new base64.Base64Decode()).pipe(writeStream);
                                }
                                else {
                                    stream.pipe(writeStream);
                                }
                            }
                        });
                        msg.once('end', async ()=> {
                            console.log(file_name+" is fetched from "+allUsers[key].gmailId);
                            const attachmentDetails = new attachmentModel();
                            attachmentDetails.dateTime = dateTime;
                            attachmentDetails.subject = subject;
                            attachmentDetails.recEmail = allUsers[key].email;
                            attachmentDetails.attachmentUrl = `http://143.110.191.52:8089/resumes/${file_name}`;
                            await attachmentDetails.save();
                        });
                    })
                })
            }
            const currDate = allUsers[key].lastFetchedTime;
            imap.once('ready', function () {
                imap.openBox('INBOX', true, function (err, box) {
                    if (err) throw err;
                    imap.search([ ['SINCE',allUsers[key].lastFetchedTime] ], function(err, results11) {
                        if (err)
                        {
                            return console.log("error");
                        }
                        if(results11.length === 0)
                        {
                        return console.log("No new message!");
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
                        xyz().then(async ()=>{
                            await user.findOneAndUpdate({_id: allUsers[key]._id},{lastFetchedTime: Date.now()});
                        })
                        .catch((e)=>{
                            console.log("Error: "+e);
                        })
                    });
                });
            });

            imap.once('error', function (err) {
                console.log("Error: "+err);
            });

            imap.connect();        
        }
    }
    return ;
}
fetcheResumes();
setInterval(fetcheResumes,3600000);

// User Login/Signup
app.use('/api/user', validateUser,userAuth);

//Admin login
app.use('/api/admin',validateUser,adminAuth);

// Client APIs
app.use('/api/client',validateUser,clientAuth);

//requirement APIs
app.use('/api/req',validateUser,reqAuth);

//candidate APIs
app.use('/api/candidate',validateUser,candidateAuth);

//candidate APIs
app.use('/api/fetchAtt',validateUser,attAuth);

//Exports
module.exports = app;