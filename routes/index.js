var express = require('express');
var router = express.Router();

/*
**
**	GET HOME PAGE
**
*/
router.get('/', function(req, res, next) {
  res.render('index', {});
});

module.exports = router;
