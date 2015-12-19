var express = require('express');
var router = express.Router();


router.get('/callback', function(req, res, next) {
  res.render('callback');
});

// router.get('/test', function(req, res, next) {
//   res.render('index');
// });

module.exports = router;
