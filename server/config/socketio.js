'use strict';

function _log(message) {
  const now = new Date();
  return {
    time: now,
    time_str: now.toLocaleTimeString(),
    type: 'info',
    message: message
  };
}

// When the user disconnects.. perform this
function onDisconnect(socket) {
  socket.emit('log', _log('"'+socket.address+'" leave virtual-service!'));
}

// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', (data) => console.info('[%s] %s (by socket)', socket.address, JSON.stringify(data, null, 2)));

  // Insert sockets below
  // require('../api/log/log.socket').register(socket);
  // require('../api/data/data.socket').register(socket);

  socket.emit('log', _log('Wellcome "'+socket.address+'" to virtual-service!'));
}

module.exports = (socketio) => {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));

  socketio.on('connection', (socket) => {
    const hs = socket.handshake.address||{};
    socket.address = hs.address ? hs.address + ':' + hs.port : hs;
    //console.log('handshake:', socket.handshake);

    socket.connectedAt = new Date();
    // Call onDisconnect.
    socket.on('disconnect', () => {
      onDisconnect(socket);
      console.info('[SOCKET.IO on %s] DISCONNECTED', socket.address);
    });

    // Call onConnect.
    onConnect(socket);
    console.info('[SOCKET.IO on %s] CONNECTED', socket.address);
  });

  socketio.on('error', (err) => console.error(err));
};

