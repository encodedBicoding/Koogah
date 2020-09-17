import app from '../server';
import WebSocket from 'ws';
import fetch from 'node-fetch';
const server = require('http').createServer(app);

const WsServer = new WebSocket.Server({
  server,
  port: 8080,
  path: '/geotracking',
  host: '127.0.0.1',
});
WsServer.on('connection', function (ws, req) {
  if (ws.readyState == 1) {
    const urlQuery = new URLSearchParams(req.url.split('/geotracking').join(''));
    ws.id = `${urlQuery.get('userId')}:${urlQuery.get('type')}`
    ws.subscribed_channels = [];
    ws.send(`connected to the server, my id is ${ws.id}`);
    ws.on('message', function(message) {
      let msg = JSON.parse(message);
      if (msg.event === 'subscribe') {
        ws.subscribed_channels.push(msg.channel);
      }
      if (msg.event === 'publish') {
        WsServer.clients.forEach((client) => {
          if (client.subscribed_channels.includes(msg.channel) && client.id !== msg.senderId) {
            client.send(msg.message);
          }
        })
      }

    })
  }
});
export default WsServer;