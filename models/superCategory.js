let mongoose = require('mongoose');


let superCategorySchema = mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    categoryes: []
})

let SuperCategory = module.exports = mongoose.model('SuperCategory', superCategorySchema);