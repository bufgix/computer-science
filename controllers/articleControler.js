const express = require("express");
const Article = require('../models/article');
const User = require('../models/user');
const articleController = express.Router();
const multer = require('multer');
const path = require('path');
const slugify = require('slugify');
const Category = require('../models/category');
const passport = require('passport');
var md = require("node-markdown").Markdown;

const upload = multer({
    dest: 'public/images/'
})

//This middleware, prepare pagination for post lister router
const paginate = (req, res, next) => {
    Article.countDocuments((req.params.category) ? {category: req.params.category} : {}, (err, postCount) => {
        if (err) throw err;
        let perPage = 2;
        let page = parseInt(req.query.page);
        let limit = Math.ceil(postCount / perPage);
        if (!page){page = 1}
        if (page + 1 <= limit){}
        if (page != 1){
            if (page + 1 <= limit){
                var displayPageCount = [page -1, page, page + 1];
            }
            else {
                var displayPageCount = [page -1, page]
            }
        }
        else {
            var displayPageCount = [page, page + 1]
        }

        res.locals.paginate = {
            page: page - 1,
            perPage: perPage,
            limit: limit,
            displayPageCount: displayPageCount
        }
        next();
    //Article.find().skip((page -1) * perPage).limit(perPage).sort('-publising_date').exec((err, data) => {})
    })
} 





// This middleware check user auth
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


// New article form router
articleController.get('/new', loginRequired, (req, res) => {
    Category.find({}, (error, data) => {
        res.render('newarticle', {
            title: 'Yeni yazı',
            categories: data,
            user: req.user
        })
    })

})

articleController.get('/test', (req, res) => {
})

// Article save from new article form
articleController.post('/new', upload.single('img-path') ,loginRequired, (req, res) => {
    const title = req.body.title,
        content = req.body.content,
        category = req.body.category,
        img = req.file

    
        let newArticle = new Article({
            title: title,
            content: content,
            category: category,
            owner: req.user._id,
            owner_name: req.user.name,
            owner_email: req.user.email,
            img_path: (img) ? img.filename : 'defaultpost.png',
            slug: slugify(title,{lower: true}),
            spoiler: content.slice(0, 200),
        })
        newArticle.save((err) => {
            if (err){
                if (err.code == 11000){ // this err code is unique err
                    req.flash('danger', 'Başlık daha önce açılmış');
                    res.redirect('/articles/new');
                    return
                }else{
                    req.flash('danger', err.message);
                    res.redirect('/articles/new');
                    return
                }
            }
            req.flash('success', 'Yazınız yayınlandı :)')
            res.redirect('/');
        })


})

// Category router
articleController.get('/:category', paginate, (req, res) => {
    pg = res.locals.paginate
    Article.find({category: req.params.category}).skip(pg.page * pg.perPage).limit(pg.perPage).sort('-publising_date').exec((err, posts) => {
        res.render('index', {
            title: 'Computer Science',
            posts: (posts) ? posts: null,
            pageCount: pg.limit,
            pageCount: pg.displayPageCount,
        })
    })
})

articleController.get('/:category/:article', (req, res) => {
    Article.findOne({slug: req.params.article}, (err, data) => {
        if (err) throw err;
        owner_status = false;
        if (req.user) {
            if (req.user._id.equals(data.owner)){
                owner_status = true;
            }
        }

        res.render('singlearticle.pug', {
            title: data.title,
            post: data,
            md: md,
            owner_status : owner_status
        })
    })
})


articleController.get('/:category/:article/delete', loginRequired, (req, res) => {
    Article.findOne({slug: req.params.article}, (err, art) => {
        if(req.user._id.equals(art.owner) || req.user.isAdmin) {
            Article.deleteOne({slug: req.params.article}, (err, article) => {
                if (err){
                    req.flash('danger', 'Hata oluştu');
                    res.redirect('/');
                }else {
                    req.flash('success', 'Başarıyla silindi');
                    res.redirect('/');
                }
            })
        }else {
            req.flash('danger', 'Yasak')
            res.status(403).redirect('/')
        }
    })
})

articleController.get('/:category/:article/update', loginRequired, (req, res) => {
    Article.findOne({slug: req.params.article}, (err, art) => {
        if (req.user._id.equals(art.owner) || req.user.isAdmin){
            res.render('newarticle', {
                title: 'Düzenle',
                post: art
            })
        }else{
            req.flash('danger', 'Yasak')
            res.status(403).redirect('/')
        }
    })
})
articleController.post('/:category/:article/update',loginRequired, (req, res) => {
    const title=req.body.title,
        content = req.body.content,
        category = req.body.category;
    Article.updateOne({slug: req.params.article}, {
        title: title,
        content: content,
        category: category,
        slug: slugify(title, {lower: true}),
        owner: req.user._id,
        spoiler: content.slice(0, 200),
    }, (err, post) =>{
        if (err){
            if (err.code == 11000){ // this err code is unique err
                req.flash('danger', 'Başlık daha önce açılmış');
                res.redirect('/articles/' + post.category + "/" + post.slug + "/update");
                return
            }
            throw err;
        }
        req.flash('success', 'Güncellendi :)');
        res.redirect('/');
     })
})



module.exports = {
    articleController: articleController,
    paginate: paginate
}