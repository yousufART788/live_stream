const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const streams = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected');

    // Remove user from the stream
    const streamId = streams.get(socket.id);
    if (streamId) {
      io.to(streamId).emit('viewer-disconnected', socket.id);
      streams.delete(socket.id);
    }
  });

  // Handle streamer invite
  socket.on('invite-viewer', (viewerId) => {
    io.to(viewerId).emit('invitation', socket.id);
  });

  // Handle viewer acceptance
  socket.on('accept-invitation', (streamerId) => {
    const streamId = socket.id + '-' + streamerId;
    streams.set(socket.id, streamId);

    socket.join(streamId);
    io.to(streamerId).emit('viewer-joined', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
