var http = require('http')
var fs = require('fs')
var path = require('path')
var mime = require('mime')
var catanServerModule = require('./catan-server-module')

var cache = {}

var server = http.createServer(function (request, response) {
  var filePath = false
  if (request.url === '/') {
    filePath = 'public/catan.html'
  } else {
    filePath = 'public' + request.url
  }
  var absPath = './' + filePath
  return serveStatic(response, cache, absPath)
})

function send404 (response) {
  response.writeHead(404, { 'Content-Type': 'text/plain' })
  response.write('404: file not found')
  response.end()
}

function sendFile (response, filePath, fileContents) {
  response.writeHead(200, { 'content-type': mime.lookup(path.basename(filePath)) })
  response.end(fileContents)
}

function serveStatic (response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath])
  } else {
    fs.access(absPath, function (err) {
      if (!err) {
        fs.readFile(absPath, function (err, data) {
          if (err) {
            send404(response)
          } else {
            cache[absPath] = data
            sendFile(response, absPath, cache[absPath])
          }
        })
      } else {
        send404(response)
      }
    })
  }
}

server.listen(process.env.PORT || 3000, function () {
  console.log('Server listening on port 3000.')
})
catanServerModule.listen(server)
