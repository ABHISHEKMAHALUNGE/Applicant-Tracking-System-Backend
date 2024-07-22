const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
    jobHeadlines:{
        type: String,
        default: null
    },
    jobEmploymentType:{
        type: String,
        default: null
    },
    jobCity:{
        type: String,
        default: null
    },
    jobOpenings:{
        type: Number,
        default: null
    },
    isParticipantsLocal:{
        type: Boolean,
        default: null
    },
    jobDescription:{
        type: String,
        default: null
    },
    clientRef: {
        type : String,
        default: null
    },
    industry: {
        type: String,
        default: null
    },
    functionalArea:{
        type: String,
        default: null
    },
    role:{
        type: String,
        default: null
    },
    educationReq:{
        type: String,
        default: null
    },
    refCode:{
        type: String,
        default: null
    },
    vacancies:{
        type: Number,
        default: null
    },
    includeWalkIn:{
        type: Boolean,
        default: null
    },
    walkInStartDate : {
        type: String,
        default: null
    },
    walkInDuration : {
        type: String,
        default: null
    },
    walkInTime:{
        type: String,
        default: null
    },
    awalkInAddress: {
        type: String,
        default: null
    },
    mapLink: {
        type: String,
        default: null
    },
    skills: {
        type: String,
        default: null
    },
    workExpMin: {
        type: Number,
        default: null
    },
    workExpMax: {
        type: Number,
        default: null
    },
    salaryUnit: {
        type: String,
        default: null
    },
    salaryMin: {
        type: Number,
        default: null
    },
    salaryMax: {
        type: Number,
        default: null
    },
    hideSalaryDetails:{
        type: Boolean,
        default: null
    },
    companyName:{
        type: String,
        default: null
    },
    clientName:{
        type: String,
        default: null
    },
    showRecruiterDetails:{
        type: Boolean,
        default: null
    },
    requirementName:{
        type: String,
        default: null
    },
    RequirementAddedBy:{
        type: String
    },
    addedDate: {
        type : Date,
        default: Date.now()
    },
    isComplete: {
        type: Boolean,
        default: false,
    },
    isApproved:{
        type: Boolean,
        default: false        
    },
    linkedin:{
        type: String,
        default: null        
    },
    instagram:{
        type: String,
        default: null 
    },
    facebook:{
        type: String,
        default: null        
    },
    imageUrl:{
        type: String,
        default: null
    },
    hrPerson:{
        type: String,
        default: null
    },
    isOpen:{
        type: Boolean,
        default: true
    },
    questions:[{
        ques: {
            type: String
        },
        nature:{
            type: String
        }
    }]
});

requirementSchema.methods.addAQuestion = async function(question,nature){

    const req = this;
    req.questions = req.questions.concat({ques: question,nature});
    await req.save();

    return true;
}

const requirement = mongoose.model('requirement',requirementSchema);
module.exports = requirement;