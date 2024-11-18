const { Server } = require('socket.io');
const socketsByRoom = new Map();

function initIO(server) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  console.log(`WebSocket basePath: ${basePath}/socket.io`); // 確認のため出力
  
  const io = new Server(server, {
    path: `${basePath}/socket.io`,  // Socket.IO のパスを設定
    //transports: ['websocket'], // WebSocket のみを許可
    transports: ['websocket', 'polling'], // WebSocket とポーリングの両方を許可
    cors: {
      origin: '*',
      methods: ["GET", "POST"],
      credentials: false
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });
  // サーバの設定を確認するためのログ
  console.log(`WebSocket Server path: ${io.path()}`)
  //const namespaces = io.of(basePath);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinGroup', ({ groupId }) => {
      const roomId = `group_${groupId}`;
      socket.join(roomId);
      if (!socketsByRoom.has(roomId)) {
        socketsByRoom.set(roomId, new Set());
      }
      socketsByRoom.get(roomId).add(socket.id);
      console.log(`Socket joined group_${groupId}`);
    });

    // 必要に応じて他のイベントリスナーを追加

    socket.on('disconnect', () => {
      socketsByRoom.forEach((sockets, roomId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            socketsByRoom.delete(roomId);
          }
        }
      });
      console.log('A user disconnected');
    });

    // 他のイベントハンドラーをここに追加
  });

  return io;
}

module.exports = { initIO };