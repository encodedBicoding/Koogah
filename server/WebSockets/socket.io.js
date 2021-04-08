import { Customers, Couriers, PackagesTrackings } from '../database/models';
import app from '../server';
import WebSocket from 'ws';
import isValidUT8 from 'utf-8-validate';
import http from 'http';
import { config } from 'dotenv';
import WebSocketFunctions from './functions';
import jwt from '../api/v1/helpers/jwt';
import eventEmitter from '../EventEmitter';

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
    const { authorization } = request.headers;
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
      if (!authorization) {
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
  eventEmitter.on('new_notification', function (d) {
    // here send notification message to a certain user when they
    // get new notification
    const { connectionId, data } = d;
    WsServer.clients.forEach((client) => {
      if (client.connectionId === connectionId) {
        if (client.readyState === WebSocket.OPEN) {
          let wsNotifyMsg = {
            event: 'in_app_notification',
            payload: data
          }
          wsNotifyMsg = JSON.stringify(wsNotifyMsg);
          client.send(wsNotifyMsg);
        }
      }
    })
  });

  eventEmitter.on('tracking', async function (msg) { 
    try {
      const updated_customer_trackings = await socketFunction.getCustomerTrackings(msg);
      const customer_updated_trackings_message = JSON.stringify({
        event: 'tracking_update',
        payload: updated_customer_trackings,
      });

      WsServer.clients.forEach((client) => {
        if (
          client.subscribed_channels.includes(msg.channel)
          && client.connectionId === msg.receiverId
          && client.readyState === WebSocket.OPEN
        ) {
          client.send(customer_updated_trackings_message);
          }
      })
    } catch (error) {
      return false;
    }
  });
  // GEOTRACKING SOCKET SERVER;
  WsServer.on('connection', async function (ws, req, client) {
    try { 
      let user;
      let ws_connected_channels;
      let connectionId;
      let userType;
      const token = req.headers.authorization;
      const payload = await jwt.verify(token);
      if (!payload) {
        ws.terminate();
        return false;
      }
      if (payload.is_courier) {
        try {
          user = await Couriers.findOne({ where: { email: payload.email } });
          ws_connected_channels = user.ws_connected_channels;
          connectionId = `dispatcher:${user.email}:${user.id}`;
          userType = 'dispatcher'
        } catch (error) {
          ws.terminate();
          return false;
        }
      } else {
        try {
          user = await Customers.findOne({ where: { email: payload.email } });
          ws_connected_channels = user.ws_connected_channels;
          connectionId = `customer:${user.email}:${user.id}`;
          userType = 'customer'
        } catch (error) {
          ws.terminate();
          return false;
        }
      }
      if (!user) {
        ws.terminate();
        return false;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.connectionId = connectionId;
        ws.subscribed_channels = ws_connected_channels;
        ws.userType = userType;
        const firstMsg = JSON.stringify({
          type: 'welcome',
          data: {
            message: `connected to the server, my id is ${ws.connectionId}`
          }
        })
        ws.send(firstMsg);
        // check if customer has tracking packages;
        if (userType == 'customer') {
          const all_trackings = await PackagesTrackings.findAll({
            where: {
              customer_id: user.id
            }
          });
          
          if (all_trackings.length > 0) {
            const customer_updated_trackings_message = JSON.stringify({
              event: 'tracking_update',
              payload: all_trackings,
            });

            WsServer.clients.forEach((client) => {
              if (
                client.readyState === WebSocket.OPEN
                && client.connectionId === `customer:${user.email}:${user.id}`
              ) {
                client.send(customer_updated_trackings_message);
              }
            });
          }
      
        }
        ws.on('message', async function(message) {
          let msg = JSON.parse(message);
          // subscribe to channel
          if (msg.event === 'subscribe') {
            try { 
              let response = await socketFunction.subscribe(msg);
              if (!response) ws.close();
              ws.subscribed_channels = response;
            } catch (err) {
              ws.close();
              return false;
            }
          }
          if (msg.event === 'tracking') {
            try {
              const updated_customer_trackings = await socketFunction.updateAndGetCustomerTrackings(msg);
              const customer_updated_trackings_message = JSON.stringify({
                event: 'tracking_update',
                payload: updated_customer_trackings,
              });

              WsServer.clients.forEach((client) => {
                if (
                  client.subscribed_channels.includes(msg.channel)
                  && client.connectionId === msg.receiverId
                  && client.readyState === WebSocket.OPEN
                ) {
                  client.send(customer_updated_trackings_message);
                }
              });
            } catch (error) {
              ws.close();
              return false;
            }
          }
          // if (msg.event === 'publish') {
          //   WsServer.clients.forEach((client) => {
          //     if (client.subscribed_channels.includes(msg.channel)
          //       && client.connectionId !== msg.senderId
          //       && client.readyState === WebSocket.OPEN) {
          //       client.send(msg.message);
          //     }
          //   });
          // }
  
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