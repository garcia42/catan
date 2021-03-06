/* global io Chat $ */

function divEscapedContentElement (message) {
  return $('<div></div>').text(message)
}

function spanEscapedContentElement (message) {
  return $('<span></span>').text(message)
}

function divSystemContentElement (message) {
  return $('<div></div>').html('<i>' + message + '</i>')
}

function processUserInput (chatApp, socket) {
  var message = $('#send-message').val()
  var systemMessage

  if (message.charAt(0) === '/') {
    systemMessage = chatApp.processCommand(message)
    if (systemMessage) {
      $('#messages').scrollToTop($('#messages').prop('scrollHeight'))
    }
  } else {
    chatApp.sendMessage($('#room').text(), message)
    $('#messages').append(divEscapedContentElement('Self: ' + message))
    // $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }

  var chatBox = $('#messages')
  var height = chatBox[0].scrollHeight
  chatBox.scrollTop(height)

  $('#send-message').val('')
}

var socket = io.connect()

$(document).ready(function () {
  var chatApp = new Chat(socket)

  socket.on('nameResult', function (result) {
    var message

    if (result.success) {
      message = 'You are now known as ' + result.name + '.'
    } else {
      message = result.message
    }
    $('#messages').append(divSystemContentElement(message))
  })

  socket.on('joinResult', function (result) {
    $('#room').text(result.room)
    $('#messages').append(divSystemContentElement('Room Changed.'))
  })

  socket.on('message', function (message) {
    var newElement = $('<div></div>').text(message.text)
    $('#messages').append(newElement)
  })

  socket.on('rooms', function (rooms, currentRoom) {
    $('#room-list').empty()
    for (var room in rooms) {
      if (room !== '') {
        var roomDiv = $('<div></div>')
        roomDiv.append(spanEscapedContentElement(room))
        if (room !== currentRoom) {
          roomDiv.append(' <span class="joinroom">(Join)</span>')
        }
        $('#room-list').append(roomDiv)
      }
    }

    $('#room-list .joinroom').click(function () {
      var text = $(this).parent().children(':first').text()
      chatApp.processCommand('/join ' + text)
    })
  })

  setInterval(function () {
    socket.emit('rooms')
  }, 1000)

  $('#send-form').submit(function () {
    processUserInput(chatApp, socket)
    return false
  })
})
