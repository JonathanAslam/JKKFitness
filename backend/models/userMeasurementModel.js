const mongoose = require('mongoose');

// create a user schema for the mongodb database to use. have the email be the unique value since we will be using that to login and signup users
const userMeasurementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,  // reference the actual user _id
        ref: 'User',
        required: true,
        index: true
    },
    units: {
        type: String,
        enum: ['metric', 'imperial'], // helps with data consistency
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    sex: {
        type: String,
        enum: ['male', 'female'], // used for validation
        required: true
    },
    height: {
        type: String,
        required: true
    },
    weight: {
        type: String,
        required: true
    },
    bmi: {
        type: Number,
    },
    bodyFat: {
        type: Number,
    },
    updatedAt: {
        type: Date,
        default: Date.now       //default this so we dont need to update during the api call
    },
});


// Automatically update `updatedAt` whenever the document changes
userMeasurementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


const UserMeasurement = mongoose.model('UserMeasurement', userMeasurementSchema);

module.exports = UserMeasurement;