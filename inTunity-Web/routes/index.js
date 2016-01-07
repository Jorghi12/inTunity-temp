var express = require('express');
var router = express.Router();


router.get('/login', function(req, res, next) {
  res.render('index');
});

router.get('/about', function(req, res, next) {
  res.render('index');
});

router.get('/location', function(req, res, next) {
  res.render('index');
});


router.get('/profile/:id', function(req, res, next) {
  res.render('index');
});

router.get('/add-song', function(req, res, next) {
  res.render('index');
});




module.exports = router;
