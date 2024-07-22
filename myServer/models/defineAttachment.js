const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    dateTime:{
        type: String
    },
    subject:{
        type: String
    },
    attachmentUrl:{
        type: String
    },
    isParsed:{
        type: Boolean,
        default: false
    },
    recEmail:{
        type: String
    }
});

const attachment = mongoose.model('attachment',attachmentSchema);
module.exports = attachment;