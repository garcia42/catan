var http = require('http')
var fs = require('fs')
var path = require('path')
var mime = require('mime')

var cache = {}

var server = http.createServer(function(request, response) {
	filePath = false;
	if (request.url == "/") {
		filePath = 'public/catan.html';
	} else {
		filePath = 'public' + request.url;
	}
	absPath = "./" + filePath;
	return serveStatic(response, cache, absPath);
});

function send404(response) {
	response.writeHead(404, {"Content-Type": "text/plain"});
	response.write('404: file not found');
	response.end();
}

function sendFile(response, filePath, fileContents) {
	response.writeHead(200, {'content-type': mime.lookup(path.basename(filePath))});
	response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists) {
			if (exists) {
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, cache[absPath]);
					}
				});
			} else {
				send404(response);
			}
		});
	}
}

server.listen(3000, function() {
	console.log("Server listening on port 3000.");
});
var catanServer = require('./lib/catan-server');
catanServer.listen(server);
