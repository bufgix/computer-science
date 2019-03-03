let mongoose = require('mongoose');


let userSchema = mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        required: true
    }
})

let User = module.exports = mongoose.model('User', userSchema);