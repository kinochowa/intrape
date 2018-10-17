var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2');

var indexRouter = require('./routes/index');
var studentsRouter = require('./routes/students');
var housesRouter = require('./routes/houses');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new AzureAdOAuth2Strategy({
  clientID: '81c83509-229a-460d-97c0-3fa0b31beae3',
  clientSecret: 'zievEGA31^{mrcUTJP743}]',
  callbackURL: 'https://www.example.net/auth/azureadoauth2/callback'

},
function (accessToken, refresh_token, params, profile, done) {
  var waadProfile = profile || jwt.decode(params.id_token);

  console.log(waadProfile);
}));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.status(401).json({status: 401});
}

app.post('/login', (req, res, next) => {
	console.log(req.get('authorization'));
	res.json({auth: req.get('authorization')});
});

app.use('/', indexRouter);
app.use('/students', /*ensureAuthenticated,*/ studentsRouter);
app.use('/houses', /*ensureAuthenticated,*/ housesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;

console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV == 'test')
	app.listen(3001, function () {
  		console.log('Example app listening on port 3001!')
	})
else
	app.listen(3000, function () {
  		console.log('Example app listening on port 3000!')
	})