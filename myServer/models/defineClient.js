const mongoose = require('mongoose');
const validator = require('validator');
require("dotenv").config();

 

const clientSchema = new mongoose.Schema({
    clientName:{
        type: String,
        required: true
    },
    clientCompany:{
        type: String,
        required: true
    },
    companyAddress:{
        type: String,
        required: true
    },
    clientCity:{
        type: String,
        required: true
    },
    clientState:{
        type: String,
        required: true
    },
    clientContact:{
        type: String,
        required: true
    },
    imageUrl:{
        type: String,
        required: true
    },
    clientEmail:{
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw 'Invalid Email!';
            }
        }
    },
    clientAddedBy:{
        type: String,
        required: true
    },
    isApproved: {
        type: Boolean,
        default: false
    }
});

const client = mongoose.model('client',clientSchema);
module.exports = client;