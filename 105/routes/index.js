var mongo = require('mongodb'),
	Server = mongo.Server,
	Db = mongo.Db;

//	 +-*/*-+-*/*-+-*/*-+-*/*-+-*/*-+
//	Change database names and port here...
//	 +-*/*-+-*/*-+-*/*-+-*/*-+-*/*-+
var links_db 		= '105_links' 
var docs_db 		= '105_docs'
var port_db			= 27017
// +-*/*-+-*/*-+-*/*-+-*/*-+-*/*-+
	
var links_flood 	= 0;
var docs_flood 		= 0;
	
var db 				= new Db(links_db, new Server('localhost', port_db), {auto_reconnect: true, safe: false}); 
var db_docs 		= new Db(docs_db, new Server('localhost', port_db), {auto_reconnect: true, safe: false}); 


openLinks = function(){
	db.open(function(err){
		if (err) {			
			setTimeout(function(){openLinks()}, 5000);
		}
		else { 
			links_flood = 0 			
		}
	});
}
user_openLinks = function() {
	if (links_flood == 0) {
		links_flood = 1;
		openLinks();
	}	
}
openLinks();

openDocs = function(){
	db_docs.open(function(err){
		if (err) {							
			setTimeout(function(){openDocs()}, 5000);
		}
		else { 
			docs_flood = 0 			
		}
	});
}
user_openDocs = function() {
	if (docs_flood == 0) {
		docs_flood = 1;
		openDocs();
	}	
}
openDocs();

// +-*/*-+-*/*-+-*/*-+-*/*-+-*/*-+
// 							Routes
// +-*/*-+-*/*-+-*/*-+-*/*-+-*/*-+

exports.index = function(req, res){	
	res.render('index', { title: 'misha', active: 'null' });
};

exports.admin = function(req, res){	
	var db_list = ["administrative", "parts", "sales", "fi", "service", "it"];	
	var rem_list = {};
	var doc_rem_list = {};
	var count 		= db_list.length;
	var doc_count 	= db_list.length;
	db_list.forEach(function(li) {
		db.collection(li, function(err, collection){			
			collection.find().toArray(function(err, items) {				
				rem_list[li] = (items);				
				count --;
				if (count <= 0){
					db_list.forEach(function(li) {
						db_docs.collection(li, function(err, collection){
							collection.find().toArray(function(err, items) {				
								doc_rem_list[li] = (items);
								doc_count --;
								if (doc_count <= 0) {
									if (!err) {
										res.render('admin', { title: 'Admin', active: 'null', 'data': rem_list, 'doc_data' : doc_rem_list});
									}
									else {
										res.render('adminerror', {title: "Datebase Error", active: "null"});
									}
								}
							});
						});
					});	
				}
			});
		});		
		
	});
};

exports.removelink = function(req, res){	
	var count = 0;
	for(var key in req.body) {
		count++;
	}
	for(var key in req.body){ 
		if (key == "collection") { var db_coll = req.body[key]; }
		else {						
			db.collection(db_coll, function(err, collection){
				if (!err) {
					collection.remove({_id: new mongo.ObjectID(req.body[key])});			
				}
				else {
					user_openLinks();
					res.render('error', {title: "Datebase Error", active: "null"});
				}
			});
		}
		count --;
		if (count <= 0){
			res.redirect('/31337');
		}
	}	
};

exports.insertlink = function(req, res){
	var name 		= req.body.name,
        url 		= req.body.url,
		icon 		= req.body.icon;
		var boxes 	= 	[ 
							req.body.administrative,
							req.body.sales,
							req.body.fi,
							req.body.parts,
							req.body.service,
							req.body.it 
						];	
	boxes.forEach(function(box){
		if (box != null) {
			db.collection(box, function(err, collection) {
				if (!err) {
					collection.insert({"name": name, "url": url, "icon": icon});
				}
				else {
					user_openLinks();
					res.render('error', {title: "Datebase Error", active: "null"});
				}
			});
		}
	});	
	res.redirect('/31337');
};

exports.link_handler = function(req, res){	
	var path 	= req.route['path'].toString();
	var params 	= req.route['params'].toString();
	var browser = req.headers['user-agent'];
	var regex	= /(iPhone|iPad|Android)/;
	var results = browser.match(regex);
	
	var subaddress = function(dbcoll, link) {
		if (params == 'links') {
			db.collection(dbcoll, function(err, collection) {				
				collection.find().toArray(function(err, items) {
					if (!err) {
						var stuff = {db_links: items, active: link, title: link};							
						res.render('links', stuff);
					}
					else {
						user_openLinks();
						res.render('error', {title: "Datebase Error", active: "null"});
					}
				});				
			});
		}
		else if (params == 'docs') {
			db_docs.collection(dbcoll, function(err, collection) {				
				collection.find().toArray(function(err, items) {
					if (!err) {
						var stuff = {db_docs: items, active: link, title: link};
						if (results) {
							if (results[1] == 'iPhone' || results[1] == 'iPad' || results[1] == 'Android' ) {
								console.log("MOBILE");
								res.render('mdocs', stuff);
							}		
						}
						else {
							console.log("BROWSER");
							res.render('docs', stuff);
						}
						
					}
					else {
						user_openDocs();
						res.render('error', {title: "Datebase Error", active: "null"});
					}
				});				
			});
		}
	};	
	switch(path) {
		case '/service/*':						
			subaddress('service', 'Service')
			break;
		case '/administrative/*':						
			subaddress('administrative', 'Administrative')
			break;			
		case '/sales/*':			
			subaddress('sales', 'Sales')
			break;
		case '/fi/*':
                        subaddress('fi', 'FI')
                        break;
		case '/parts/*':						
			subaddress('parts', 'Parts')
			break;
		case '/it/*':						
			subaddress('it', 'IT')
			break;	
		default:			
			res.redirect('/');
	}	
};

exports.ticket = function(req, res){
	res.render('ticket', {active: 'IT', title: 'IT Tickets'});
};

exports.contact = function(req, res){
	res.render('contact', {active: 'IT', title: 'IT Contact'});
};

exports.training = function(req, res){
        res.render('training', {active: 'IT', title: 'Training'});
};
exports.zerotolerance = function(req, res){
        res.render('zerotolerance', {active: 'IT', title: 'ZeroTolerance'});
};


exports.removedoc = function(req, res){		
	var count = 0;
	for(var key in req.body) {
		count++;
	}
	for(var key in req.body){ 
		if (key == "collection") { var db_coll = req.body[key]; }
		else {						
			db_docs.collection(db_coll, function(err, collection){
				if (!err) {
					collection.remove({_id: new mongo.ObjectID(req.body[key])});			
				}
				else {
					user_openDocs();
					res.render('error', {title: "Datebase Error", active: "null"});
				}
			});
		}
		count --;
		if (count <= 0){
			res.redirect('/31337');
		}
	}	
};

exports.insertdoc = function(req, res){
	var name 		= req.body.name,
        url 		= req.body.url;
		
		var boxes 	= 	[ 
							req.body.administrative,
							req.body.sales,
							req.body.fi,
							req.body.parts,
							req.body.service,
							req.body.it 
						];	
	boxes.forEach(function(box){
		if (box != null) {
			db_docs.collection(box, function(err, collection) {
				if (!err) {
					collection.insert({"name": name, "url": url});
				}
				else {
					user_openDocs();
					res.render('error', {title: "Datebase Error", active: "null"});
				}
			});
		}
	});	
	res.redirect('/31337');
};






