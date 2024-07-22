const mongoose = require('mongoose');
const validator = require('validator');

 

const candidateSchema = new mongoose.Schema({
    time:{
        type: String
    },
    name:{
        type: String
    },
    collegeName:{
        type: Array
    },
    degree:{
        type: Array
    },
    totalExp:{
        type: Number
    },
    designation:{
        type: Array
    },
    contactNumber:{
        type: String
    },
    email:{
        type: String,
        trim: true,
        lowercase: true
    },
    skills:{
        type: Array
    },
    refReqId: {
        type: String,
        required: true
    },
    resumeUrl:{
        type: String,
        required: true
    },
    candidateAddedBy: {
        type: String,
        required: true
    },
    score:{
        type: Number,
        default: null
    },
    response:[{
        ques_id:{
            type: String
        },
        question:{
            type: String
        },
        points:{
            type: Number
        }
    }],
    isGraded: {
        type: Boolean,
        default: false
    }
});

const candidate = mongoose.model('candidate',candidateSchema);
module.exports = candidate;