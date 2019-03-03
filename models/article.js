const mongoose = require('mongoose');
const uniqueValitador = require('mongoose-unique-validator');

let articleSchema = mongoose.Schema({
    title: {
        type: String,
        requirerd: true
    },
    content: {
        type: String,
        requirerd: true
    },
    category: {
        type: String,
        requirerd: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    owner_name: {
        type: String,
        require: true
    },
    owner_email: {
      type: String,
      require: true  
    },
    img_path:{
        type: String,
        require: true
    },
    slug: {
        type: String,
        require: true,
        unique: true
    },
    spoiler: {
        type: String
    },
    publising_date: {
        type: Date,
        default: Date.now
    }
})

articleSchema.plugin(uniqueValitador, {message: "Başlık daha önceden var!"});

let Article = module.exports = mongoose.model('Article', articleSchema);