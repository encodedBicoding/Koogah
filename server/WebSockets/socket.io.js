import app from '../server';
import socketIO from 'socket.io';

const server = require('http').createServer(app);
const io = socketIO(server);

io.on('connect', (socket) => {
  console.log(socket)
  socket.emit('connection', 'Connected to Koogah servers')
})