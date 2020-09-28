import app from '../server';
import { Customers, Couriers } from '../database/models';
import WebSocket from 'ws';
import { config } from 'dotenv';
import WebSocketFunctions from './functions';
let server = require('http').createServer(app)

config();

const socketFunction = new WebSocketFunctions();
let WsServer;

if (process.env.NODE_ENV === 'production') {
  server = require('https').createServer(app);
  WsServer = new WebSocket.Server({
    server,
    port: 8080,
    host: 'koogah.herokuapp.com',
    path: '/geotracking',
    clientTracking: true,
  })
} else {
  WsServer = new WebSocket.Server({
    server,
    port: 8080,
    path: '/geotracking',
    host: '0.0.0.0',
    clientTracking: true,
  });
}
WsServer.on('connection', async function (ws, req) {
  const urlQuery = new URLSearchParams(req.url.split('/geotracking').join(''));
  let id = `${urlQuery.get('userId')}:${urlQuery.get('type')}`;
  let userId = urlQuery.get('userId').toString();
  let userType = urlQuery.get('type');
  let USER;
  let ws_connected_channels;

  if (userType === 'dispatcher') {
    try { 
      USER = await Couriers.findOne({ where: { id: userId } });
      ws_connected_channels = USER.ws_connected_channels;
    } catch (err) {
      ws.close();
      console.log(err);
    }
  } else if (userType === 'customer') {
    try { 
      USER = await Customers.findOne({ where: { id: userId } });
      ws_connected_channels = USER.ws_connected_channels
    } catch (err) {
      ws.close();
      console.log(err)
    }
  }

  if (!USER) {
    ws.close();
  }

  if (ws.readyState == 1) {
    // find the client
    // check if the client is already subscribed to channels if the client exists.
    ws.connectionId = id;
    ws.userId = userId;
    ws.userType = userType;
    ws.subscribed_channels = ws_connected_channels;
    ws.send(`connected to the server, my id is ${ws.connectionId}`);
    ws.on('message', async function(message) {
      let msg = JSON.parse(message);
      if (msg.event === 'subscribe') {
        try { 
          let response = await socketFunction.subscribe(ws.userId, ws.userType, msg.channel);
          if (!response) ws.close();
          ws.subscribed_channel = response;
        } catch (err) {
          ws.close();
          console.log(err)
        }
      }
      if (msg.event === 'publish') {
        WsServer.clients.forEach((client) => {
          if (client.subscribed_channels.includes(msg.channel) && client.connectionId !== msg.senderId) {
            client.send(msg.message);
          }
        })
      }

    })
  }
});



export default WsServer;