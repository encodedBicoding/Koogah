import { Customers, Couriers } from '../database/models';
import app from '../server';
import WebSocket from 'ws';
import isValidUT8 from 'utf-8-validate';
import http from 'http';
import { config } from 'dotenv';
import WebSocketFunctions from './functions';

const cluster = require('cluster');
const port = process.env.PORT || 8080;

config();

const socketFunction = new WebSocketFunctions();
const WsServer = new WebSocket.Server({
  noServer: true,
});


if (cluster.isMaster) {
  console.log(`Master ${process.pid} running...`);
  cluster.fork()
  // process is clustered on a core and process id is assigned
  cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is listening');
  });
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });

} else {
  // server upgrade function;
  const SERVER = http.createServer(app);
  SERVER.on('upgrade', function upgrade(request, socket, head) { 
    console.log(`worker ${process.pid} is upgrading...`);
  const accepted_hosts = [];
  const accepted_path = ['/geotracking'];
  const { __koogah_ws_session_secret } = request.headers;
  try {
    if (!isValidUT8(head)) {
      socket.destroy();
      return;
    }
    authenticate(request, (err, client) => {
      if (err || !client) {
        socket.destroy();
        return;
      }

      if (!__koogah_ws_session_secret) {
        socket.destroy();
        return;
      }

      if (__koogah_ws_session_secret !== process.env.KOOGAH_WS_SESSION_SECRET) {
        socket.destroy();
        return;
      }
      
      const { host } = request.headers;
      const { url } = request;
      const path = url.split('?')[0];
      if (!accepted_path.includes(path)) {
        socket.destroy()
        return;
      }

      // before final deploy, work on the acceptable hosts;
      // set websocket origin on the client
      console.log('before final deploy, work on the acceptable hosts')
      console.log('host', host);

      WsServer.handleUpgrade(request, socket, head, (ws) => {
        WsServer.emit('connection', ws, request, client);
      });
    });
    return;

  } catch (err) {
    console.log(err);
    return;
  }
  });
  // GEOTRACKING SOCKET SERVER;
  WsServer.on('connection', async function (ws, req, client) {
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
          // check ws.terminate() - it works
          ws.close();
          return false;
        }
      } else if (userType === 'customer') {
        try { 
          USER = await Customers.findOne({ where: { id: userId } });
          ws_connected_channels = USER.ws_connected_channels
        } catch (err) {
          ws.close();
          return false;
        }
      }
      if (!USER) {
        ws.close();
        return false;
      }

      if (ws.readyState === WebSocket.OPEN) {
        // find the client
        // check if the client is already subscribed to channels if the client exists.
        ws.connectionId = id;
        ws.userId = userId;
        ws.userType = userType;
        ws.subscribed_channels = ws_connected_channels;
        ws.send(`connected to the server, my id is ${ws.connectionId}`);
        ws.on('message', async function(message) {
          let msg = JSON.parse(message);
          // subscribe to channel
          if (msg.event === 'subscribe') {
            try { 
              let response = await socketFunction.subscribe(ws.userId, ws.userType, msg.channel);
              if (!response) ws.close();
              ws.subscribed_channels = response;
            } catch (err) {
              ws.close();
              return false;
            }
          }
          if (msg.event === 'publish') {
            WsServer.clients.forEach((client) => {
              if (client.subscribed_channels.includes(msg.channel)
                && client.connectionId !== msg.senderId
                && client.readyState === WebSocket.OPEN) {
                client.send(msg.message);
              }
            });
          }
    
        })
      }

    } catch (err) {
      ws.close();
      return false;
    };
  });

  function authenticate(req, cb) {
    cb(req.socket._hadError, req.client);
  }
  SERVER.listen(port, () => {
    console.log(`Websocket and APP running on same port: %d for ${process.pid}`, port)
  });
}

    

export default WsServer;