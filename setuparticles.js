const slugify = require('slugify');
const Category = require('./models/category');
const config = require('./config');
const mongoose = require('mongoose');

// Createing database connection
let dbUri = config.dbUri;
mongoose.connect(dbUri, {
  useNewUrlParser: true
});
let db = mongoose.connection;

db.on('open', () => {
    const CATEGORYLIST = [
        {name: "Yapay Zeka", sub: "main"},
        {name: "Oyun Programlama",sub: "main"},
        {name: "Algoritmalar", sub: "main"},
        {name: "Web", sub: "main"},
        {name: "Mobil", sub: "main"},
        {name: 'Diğer', sub: 'main'},
        {name: "Projeler", sub: "nondisplay"},
        {name: "Görüntü İşleme", sub: "main"},
        {name: "Siber güvenlik", sub: "main"},
        {name: "Python", sub: "Programlama"},
        {name: "C/C++", sub: "Programlama"},
        {name: "Java", sub: "Programlama"},  
    ]

    /*const CATEGORYLIST = [
        "Yapay Zeka",
        "Oyun Programlama",
        "Python",
        "C/C++",
        "Java",
        "Javascipt",
        "Algoritma"
    ]*/
    CATEGORYLIST.forEach((elem) => {

        let newCategory = new Category({
            display_name: elem.name,
            slug: slugify(elem.name, {lower: true}),
            sub: elem.sub
        })
        newCategory.save((err) => {
            if (err){
                console.log(err)
            }else {
                console.log(newCategory);
            }
            
        })
    })
}) 

// Handing db errors
db.on('error', (error) => {
    console.log(error);
  })
  

