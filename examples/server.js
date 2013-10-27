var express = require('express'),
    app = express(),
    ubiquity = require('../src/ubiquity-server'),
    browserify = require('browserify-middleware'),
	port = 8080;

app.get('/ubiquity.js', browserify('../src/main.js'))
app.use(express.static(__dirname + '/public'));

var server = app.listen(port);
ubiquity(server);

console.log('Ubiquity examples running at localhost:' + port);