let mongoose = require('mongoose');

let cvSchema = mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    downloadLink: {
        type: String,
        required: true
    }
})

let CV = module.exports = mongoose.model('CV', cvSchema);