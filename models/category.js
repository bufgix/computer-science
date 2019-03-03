const mongoose = require('mongoose');

let categorySchema = mongoose.Schema({
    display_name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    sub: {
        type: String,
        required: true
    }
})


let Category = module.exports = mongoose.model('Category', categorySchema);