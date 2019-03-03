const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');
const passport = require('passport');
const {articleController, paginate} = require('./controllers/articleControler');
const removeMd = require('remove-markdown');
const slugify = require('slugify');

const PORT = config.port;

// DeprecationWarning ignore
mongoose.set('useCreateIndex', true);
// Createing database connection
let dbUri = config.dbUri;
mongoose.connect(dbUri, {
  useNewUrlParser: true
});
let db = mongoose.connection;

// is open db?
db.on('open', () => {
  console.log('Database connected, Uri: ' + dbUri);
})

// Handing db errors
db.on('error', (error) => {
  console.log(error);
})

// Start Server
const server = app.listen(PORT, () => {
  console.log("Server start on port " + PORT);
})
// Connect socket.io to express server
const io = require('socket.io').listen(server);
// Calling Models
let User = require('./models/user');
let Secret = require('./models/secret');
const Category = require('./models/category');
const Article = require('./models/article');
const CV = require('./models/cvs');

// Set view enigne
app.set('view engine', 'pug');
// Set templates foder
app.set('views', path.join(__dirname + '/templates'));
// Set static folder
app.use("/static", express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')))
// Add body parser middleware
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json());



// Preparing session manager
app.use(session({
  secret: 'this secret',
  resave: true,
  saveUninitialized: true,
}))
// Preparing flash messages
app.use(flash());
app.use((req, res, next) => { // Custom Middleware
  res.locals.messages = require('express-messages')(req, res);  // ! important 'messages'
  next();
})

// Validator Middleware. Idk what this code does :/
app.use(expressValidator({
  errorFormatter: (param, msg, value) => {
    var namespace = param.split('.')
    , root = namespace.shift()
    , formParam = root;

    while(namespace.length){
      formParam = '[' + namespace.shift() + ']';
    }

    return {
      param: formParam,
      msg: msg,
      value: value
    };
  }
}))

// Calling passport config
require('./passport')(passport);
// Preparing passport middleware
app.use(passport.initialize());
app.use(passport.session());


// This code if you use as second parameter if user is not authenticate 
// redirect to home page.
const loginRequired = (req, res, next) => {
  try {
    if (req.user){
      return next();
    }else {
      req.flash('danger', 'Cok ileri gittin.');
      res.redirect('/')
    }
  } catch (error) {
    req.flash('danger', 'Cok ileri gittin.');
    res.redirect('/')
  }
}



// Handling all url path
app.get('*', (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.removeMd = removeMd;
  Category.find({}, (err, data) => {
    if (err) throw err;
    res.locals.cats = data || null;
    next();
  })


})
// Set atricle controllers
app.use('/articles', articleController);


// home route
app.get('/', paginate, (req, res) => {
  const pg = res.locals.paginate;
  Article.find({}).skip(pg.page * pg.perPage).limit(pg.perPage).sort('-publising_date').exec((err, posts) => {
    res.render('index', {
      title: 'Ana Sayfa',
      posts: (posts) ? posts: null,
      pageLimit: pg.limit,
      pageCount: pg.displayPageCount,
      currentPage: pg.currentPage
    })
  })
})

app.get('/search', paginate, (req, res) => {
  const pg = res.locals.paginate;
  Article.find({slug: slugify(req.query.query, {lower: true})}, (err, data) => {
    res.render('index', {
      title: 'Arama sonuçları',
      posts: data,
      pageLimit: pg.limit,
      pageCount: pg.displayPageCount,
      currentPage: pg.currentPage
    })
  })
})

// About route
app.get('/about', (req, res) => {
  res.render('about');
})


// CV's route
app.get('/cvs', (req, res) => {
  CV.find({}, (err, cvs) => {
    res.render('cvs', {
      title: 'CVler',
      cvs: cvs
    })
  })
})

// This route, create new cv but only admin access
app.post('/generatecv', loginRequired, (req, res) => {
  if (req.user.isAdmin) {
    const cvName = req.body.cvname,
      cvlink = req.body.cvlink
    let newCV = new CV({
      name: cvName,
      downloadLink: cvlink
    })
    newCV.save((err) => {
      if (err) throw err;
      req.flash('success', newCV.name + ' oluşturuldu')
      res.redirect('/panel');
    })
  }else {
    req.flash('danger', 'Yönetici hesabınız yok');
    res.redirect('/')
  }
})

// writer login page render
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Yazar girişi'
  })
})
app.post('/login', (req, res, next) => {
  req.checkBody('email', 'Email gereklidir').notEmpty();
  req.checkBody('password', 'Sifre girmelisin').notEmpty();


  let errors = req.validationErrors();

  if(errors){
    console.log(errors)
    res.redirect('login');
  }else{
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
    })(req, res, next);
  }

  
})
// Logout
app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'Çıkış Yaptın.');
  res.redirect('/');

})

// writer register page render
app.get('/register', (req, res) => {
  res.render('register', {
    title: 'Yazar Kayıt'
  })
})
app.post('/register', (req, res) => {

  // Gettting values from body
  const email = req.body.email
  ,password = req.body.password
  ,name = req.body.name
  ,secretFromUser = req.body.secret;
  // getting all keys
  Secret.find({}, (err, keys) => {
    if(err) throw err;
    // Validation check
    let secretErr = "Sanırım yanlış anahtar";
    let secretData = [];
    keys.forEach((key) => {
      secretData.push(key.data);
    })
    if (secretData.includes(secretFromUser)){
      secretErr = null;
    }
    req.checkBody('password_confirm', 'Hmm... Şifreler eşleşmiyor').equals(password);

    let errors = req.validationErrors();

    if (errors || secretErr){
      res.render('register', {
        title: 'Kayıt Ol',
        errors: errors,
        secretErr: secretErr
      })
    }else{
      // create user instance
      let newUser = new User({
        email: email,
        password: password,
        name: name
      })

      // this code convert password to hash
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err){
            console.log(err);
          }
          newUser.password = hash;
          newUser.save((err) => {
            if(err){
              if (err.code == 11000){
                req.flash('danger', 'Bu e-posta daha önce kullanılmış :(');
                res.redirect('/register');
                return;
              }
              throw err;
            }
            // Delete used secret key from database
            Secret.findOneAndDelete({data: secretFromUser}, (err, key) => {
              if (err) throw err;
            })
            req.flash('success', 'Artık yazarsın :)');
            res.redirect('/login');
          })
        })
      })
    }
  })
})

// Handling panel page for admins
app.get('/panel', loginRequired, (req, res) => {
  if (req.user.isAdmin) {
    res.render('panel', {
      title: 'Panel'
    })
  }else {
    req.flash('danger', 'Yönetici hesabınız yok');
    res.redirect('/')
  }


  // This code receive from client generated secret key
  io.on('connection', (socket) => {
    socket.on('secret key', (key) => {
      let secret_key = new Secret({
        data: key,
        owner: req.user.email
      })
      secret_key.save((err) => {
        if (err) throw err;
        socket.emit('success', key);
      })
    })
  })

})


module.exports.paginate = paginate;