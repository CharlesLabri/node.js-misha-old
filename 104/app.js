
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');  
  
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8003 );
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));  
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
// app.get('/error', routes.error);
app.get('/service/*', routes.link_handler);
app.get('/administrative/*', routes.link_handler);
app.get('/parts/*', routes.link_handler);
app.get('/sales/*', routes.link_handler);
app.get('/fi/*', routes.link_handler);

app.get('/it/ticket', routes.ticket);
app.get('/it/training', routes.training);
app.get('/it/zerotolerance', routes.zerotolerance);
app.get('/it/contact', routes.contact);
app.get('/it/*', routes.link_handler);


app.get('/31337', routes.admin);
app.post('/insertlink', routes.insertlink);
app.post('/removelink', routes.removelink);
app.post('/insertdoc', routes.insertdoc);
app.post('/removedoc', routes.removedoc);

app.get('*[^/css/*|^/js/*|^/img/*]', function(req, res){
	res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
