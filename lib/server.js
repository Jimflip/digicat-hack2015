var express = require('express');
var app = express();
var https = require('https');
var console = require('console');
var config = require('config');
var fs = require('fs');
var pem = require('pem');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook-canvas');

var FACEBOOK_APP_ID = "1645786392369501";
var FACEBOOK_APP_SECRET = "a5a916e909d7e82287f0f248602c9ee4";

var file_opts = {
	root: __dirname + '/../public/',
	dotfiles: 'deny',
	headers: {
		'x-timestamp': Date.now(),
		'x-sent': true
	}
};

app.get('/', function (req, res)
{

	res.sendFile('html/index.html', file_opts);
});

app.get('/error', function (req, res)
{
	res.send('Bugger!');
});

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//app.use(multer());

app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (err, req, res, next)
{
	console.error("UNCAUGHT", [err, req.headers, req.body]);
	next();
});

function listen(config)
{
	if (config.ssl)
	{
		var options = {};

		if (config.ssl.key)
		{
			options.key = fs.readFileSync(config.ssl.key).toString();
		}

		if (config.ssl.cert)
		{
			options.cert = fs.readFileSync(config.ssl.cert).toString();
		}

		if (config.ssl.ca)
		{
			options.ca = fs.readFileSync(config.ssl.ca).toString();
		}

		https.createServer(options, app).listen(config.port);
	}
	else
	{
		pem.createCertificate({days: 365, selfSigned: true}, function (err, keys)
		{
			if (err)
			{
				console.error(err);
			}
			else
			{
				console.info("USING SELF SIGNED CERT");
				https.createServer({key: keys.serviceKey, cert: keys.certificate}, app).listen(config.port);
			}
		});
	}
};

passport.use(new FacebookStrategy({
		clientID: FACEBOOK_APP_ID,
		clientSecret: FACEBOOK_APP_SECRET,
		callbackURL: "https://apps.facebook.com/copyrighthub"
	},
	function (accessToken, refreshToken, profile, done)
	{
		console.dir(profile);
		return done(null, profile);

	}
));

passport.serializeUser(function (user, done)
{
	console.log('serialize', user);
	done(null, user);
});

app.all('/auth/facebook/canvas',
	passport.authenticate('facebook-canvas', {
		successRedirect: '/',
		failureRedirect: '/auth/facebook/canvas/autologin'
	}));

app.get('/auth/facebook/canvas/autologin', function (req, res)
{
	console.info('autologin');

	res.send('<!DOCTYPE html>' +
	'<html>' +
	'<body>' +
	'<script type="text/javascript">' +
	'top.location.replace("/auth/facebook");' +
	'</script>' +
	'</body>' +
	'</html>');
});

listen(config);