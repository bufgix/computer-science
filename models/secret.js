let mongoose = require('mongoose');

let secretSchema = mongoose.Schema({
    data: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    }

})

let Secret = module.exports = mongoose.model('Secret', secretSchema);