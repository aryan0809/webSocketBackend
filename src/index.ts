import WebSocket, { WebSocketServer } from 'ws';

const PORT = 8080;
const server = new WebSocketServer({ port: PORT });
console.log(`WebSocket server is running on ws://localhost:${PORT}`);

interface User {
  username: string;
  avatar: string;
  socket: WebSocket;
}

interface Rooms {
  [roomName: string]: User[];
}

const rooms: Rooms = {}; // Store active users in memory

server.on('connection', (socket) => {
  socket.on('message', (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === 'join') {
      const { username, roomName, avatar } = message;
      (socket as any).username = username;
      (socket as any).roomName = roomName;
      (socket as any).avatar = avatar;

      if (!rooms[roomName]) rooms[roomName] = [];
      rooms[roomName].push({ username, avatar, socket });

      rooms[roomName].forEach((user) => {
        if (user.socket !== socket) {
          user.socket.send(
            JSON.stringify({
              type: 'notification',
              message: `${username} has joined the room`,
              username,
              avatar,
            })
          );
        }
      });
    }

    if (message.type === 'message') {
      const { roomName, text } = message;
      rooms[roomName].forEach((user) => {
        user.socket.send(
          JSON.stringify({
            type: 'message',
            text,
            username: (socket as any).username,
            avatar: (socket as any).avatar,
          })
        );
      });
    }
  });

  socket.on('close', () => {
    const roomName = (socket as any).roomName;
    if (roomName) {
      rooms[roomName] = rooms[roomName].filter((user) => user.socket !== socket);
    }
  });
});