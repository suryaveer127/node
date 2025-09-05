const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
         match: /^[A-Za-z\s]+$/
    },
    lastName: {
        type: String,
        required: true,
        match: /^[A-Za-z\s]+$/
    },
    mobile: {
        type: String,
        required: true,
        match: /^\d{10}$/,
              
    },
    email: {
        type: String,
        required: true,
        unique: true,
       
    },
    address: {
        street: { type: String,  required: true },
        city: { type: String, match: /^[A-Za-z\s]+$/, required: true },
        state: { type: String, match: /^[A-Za-z\s]+$/, required: true },
        country: { type: String, match: /^[A-Za-z\s]+$/, required: true },
    },
    loginId: {
        type: String,
        required: true,
        unique: true,
         match: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{8}$/
        
    },
            password: {
        type: String,
        required: true,
        minlength: 6,
        match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/
        
        },
    creationTime: {
        type: Date,
        default: Date.now
    },
    lastUpdateOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
