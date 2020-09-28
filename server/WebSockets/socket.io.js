import app from '../server';
import { Customers, Couriers } from '../database/models';
import WebSocket from 'ws';
import { config } from 'dotenv';
import WebSocketFunctions from './functions';
const SERVER = require('http').createServer(app);

const port = process.env.PORT ||  8080;

config();

const socketFunction = new WebSocketFunctions();

const WsServer = new WebSocket.Server({
  server: SERVER,
});

WsServer.on('connection', async function (ws, req) {
  console.log('connected to websocket');
  const { __koogah_ws_session_secret } = req.headers;
  if (!__koogah_ws_session_secret) {
    ws.close();
  }
  if (__koogah_ws_session_secret !== process.env.KOOGAH_WS_SESSION_SECRET) {
    ws.close();
    console.log('passed here');
  }
  try { 
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

  } catch (err) {
    console.log(err);
    ws.close();
  };
});

SERVER.listen(port, () => {
  console.log('Websocket and APP running on same port: %d', port)
});

export default WsServer;