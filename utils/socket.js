let io;
const socketsByRoom = new Map();

function initIO(server) {
  if (io) return io;

  io = require('socket.io')(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', socket => {
    console.log('New client connected:', socket.id);

    socket.on('joinGroup', ({ groupId }) => {
      const roomId = `group_${groupId}`;
      socket.join(roomId);
      if (!socketsByRoom.has(roomId)) {
        socketsByRoom.set(roomId, new Set());
      }
      socketsByRoom.get(roomId).add(socket.id);
      console.log(`Client ${socket.id} joined ${roomId}`);
    });

    // addEventおよびdeleteEventのリスナーを削除
    // これにより、API経由でのみイベントが追加・削除されるようになります

    socket.on('disconnect', () => {
      socketsByRoom.forEach((sockets, roomId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            socketsByRoom.delete(roomId);
          }
        }
      });
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = { initIO };