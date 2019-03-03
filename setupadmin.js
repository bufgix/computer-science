const User = require('./models/user');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('./config');


// Createing database connection
let dbUri = config.dbUri;
mongoose.connect(dbUri, {
  useNewUrlParser: true
});
let db = mongoose.connection;

// is open db?
db.on('open', () => {
  console.log('Database connected, Uri: ' + dbUri);
  const email = "admin@email.com"
    ,password = "adminpassword"
    , name = "Adminname"
    , isAdmin = true;

    let newUser = new User({
        email: email,
        password: password,
        name: name,
        isAdmin: isAdmin
    })

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if(err){
                console.log(err);
            }
            newUser.password = hash;

            newUser.save((err) => {
                if(err){
                    console.log(err);
                }else{
                    console.log('Admin succesfuly genrated');
                }
                
            })

        })
    })
})

// Handing db errors
db.on('error', (error) => {
  console.log(error);
})


