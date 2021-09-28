import { Customers, Couriers, PackagesTrackings, Notifications, Companies } from '../database/models';
import app from '../server';
import WebSocket from 'ws';
import isValidUT8 from 'utf-8-validate';
import http from 'http';
import { config } from 'dotenv';
import WebSocketFunctions from './functions';
import jwt from '../api/v1/helpers/jwt';
import eventEmitter from '../EventEmitter';
import Notifier from '../api/v1/helpers/notifier';
import Sequelize from 'sequelize';
import moment from 'moment';

const { Op } = Sequelize;

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
  const accepted_path = ['/geotracking', '/data_seeking'];
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
      const { host, origin } = request.headers;
      const accepted_web_hosts = [
        'http://localhost:8080',
        'http://www.koogah.com.ng',
        'http://www.koogah.com',
        'https://www.koogah.com.ng',
        'https://www.koogah.com',
        'https://koogah-web-staging.herokuapp.com'
      ];
      if (accepted_web_hosts.includes(origin)) {
        var cookies = {};
        // treat as web
        // check for req cookie.
        if(request.headers.cookie) request.headers.cookie.split(';').forEach(function(cookie)
          {
            var parts = cookie.match(/(.*?)=(.*)$/);
            var name = parts[1].trim();
            var value = (parts[2] || '').trim();
            cookies[ name ] = value;
        });
        let found = Object.keys(cookies).find((c) => c === 'koogah_session_token');
        if (found === -1) {
          socket.destroy();
          return;
        }
      } else {
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
        
      }


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
  eventEmitter.on('new_company_dispatcher_tracking', async function (d) {
    const { companyId } = d;
    const all_tracking_dispatchers = await socketFunction.getCompanyTrackingDispatchers(companyId);
    let result = JSON.stringify({
      payload: all_tracking_dispatchers,
      event: 'company_tracking_dispatchers_result',
    });
    WsServer.clients.forEach((c) => {
      if (c.companyId === companyId) {
        if (c.readyState === WebSocket.OPEN) {
          c.send(result);
        }
      }
    })
  });
  eventEmitter.on('new_company_notification', function (d) {
    const { companyWSId, data } = d;
    WsServer.clients.forEach((client) => {
      if (client.connectionId === companyWSId) {
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
  eventEmitter.on('package_approval', async function (msg) {
    try {
      const m = JSON.stringify(msg);
      WsServer.clients.forEach((client) => {
        if (
          client.connectionId === msg.dispatcherWSId
          && client.readyState == WebSocket.OPEN
        ) {
          client.send(m);
        }
      })
    } catch (err) {
      console.log(err);
      return;
    }
  });
  eventEmitter.on('package_after_pickup_decline', async function (msg) {
    try {
      const m = JSON.stringify(msg);
      WsServer.clients.forEach((client) => {
        if (
          client.connectionId === msg.dispatcherWSId
          && client.readyState == WebSocket.OPEN
        ) {
          client.send(m);
        }
      })
    } catch (err) {
      console.log(err);
      return;
    }
  });
  eventEmitter.on('unsubscribe', async function (msg) {
    try {
      const m = JSON.stringify(msg);
      WsServer.clients.forEach((client) => {
        if (
          client.connectionId === msg.connectionId
          && client.readyState == WebSocket.OPEN
        ) {
          client.send(m);
        }
      })

    } catch (err) {
      console.log(err);
      return;
    }
  });

  eventEmitter.on('notify_new_package_creation', async function (msg) {
    const user_state = msg.pickup_state.split(',')[0]; 
    try {
      const allDispatchers = await Couriers.findAll({
        where: {
          is_verified: true,
          is_active: true,
          is_approved: true,
          state: user_state,
        }
      });
      let timestamp_benchmark = moment().subtract(5, 'months').format();

      allDispatchers.forEach(async (dispatcher) => {
        let all_notifications = await Notifications.findAll({
          where: {
            [Op.and]: [{ email: dispatcher.email }, { type: 'courier' }],
            created_at: {
              [Op.gte]:timestamp_benchmark
            }
          }
        });
        const device_notify_obj = {
          title: 'Koogah Logistics',
          body: msg.detail,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          icon: 'ic_launcher'
        };
        const _notification = {
          email: dispatcher.email,
          desc: 'CD012',
          message: msg.detail,
          title: 'Koogah Logistics',
          action_link: '',
          id: msg.notification_id,
        };
        await Notifier(
          all_notifications,
          dispatcher,
          'dispatcher',
          device_notify_obj,
          _notification
        );
      });
    } catch (err) {
      console.log(err);
      return;
    }
  });

  // GEOTRACKING SOCKET SERVER;
  WsServer.on('connection', async function (ws, req, client) {
    try {
      console.log('server says connected to wss');
      // check if connection is from website;
      if (req.url === '/data_seeking') {
        let user;
        let connectionId;
        // coming from landing page.
        // company landing page.
        // get token from cookie.
        var cookies = {};
        // treat as web
        // check for req cookie.
        if(req.headers.cookie) req.headers.cookie.split(';').forEach(function(cookie)
          {
            var parts = cookie.match(/(.*?)=(.*)$/);
            var name = parts[1].trim();
            var value = (parts[2] || '').trim();
            cookies[ name ] = value;
        });
        let token = cookies['koogah_session_token'];
        const payload = await jwt.verify(token);
        if (!payload) {
          ws.terminate();
          return false;
        }
        try {
          user = await Companies.findOne({
            where: {
              email: payload.email
            }
          });
          if (!user) {
            ws.terminate();
            return false;
          }

          connectionId = `company:${user.email}:${user.id}`;
          ws.connectionId = connectionId;
          ws.companyEmail = user.email;
          ws.companyId = user.id;
          if (ws.readyState === WebSocket.OPEN) {
            try { 
            let timestamp_benchmark = moment().subtract(5, 'months').format();
            // get notificatons dedicated to company and send.
            const all_company_notifications = await Notifications.findAll({
              where: {
                [Op.and]: [
                  {
                    email: user.email,
                  },
                  {
                    is_read: false,
                  },
                  {
                    type: 'company'
                  }
                ],
                created_at: {
                  [Op.gte]: timestamp_benchmark
                }
              }
            });

            let wsNotifyMsg = {
              event: 'in_app_notification',
              payload: all_company_notifications,
            }
            wsNotifyMsg = JSON.stringify(wsNotifyMsg);
            ws.send(wsNotifyMsg);

            ws.on('message', async function (message) {
              let connectionId = ws.connectionId;
              let userEmail = ws.companyEmail;
              let companyId = ws.companyId;
              let msg = JSON.parse(message);
              if (msg.event === 'get_company_tracking_dispatchers') {
                const all_tracking_dispatchers = await socketFunction.getCompanyTrackingDispatchers(companyId);
                let result = {
                  payload: all_tracking_dispatchers,
                  event: 'company_tracking_dispatchers_result',
                }
                ws.send(JSON.stringify(result));
              }

            });
            }catch(err) {
              console.log(err);
            }
          }

        } catch (err) {
          console.log(err);
          ws.terminate();
          return false;
        }
      }
      if (req.url === '/geotracking') {
        // coming from app.
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
                if (!response) return false;
                ws.subscribed_channels = response;
                return true;
              } catch (err) {
                return false;
              }
            }
            if (msg.event === 'unsubscribe_from_package') {
              try {
                let response = await socketFunction.unsubscribe(msg);
                if (!response) return false;
                ws.subscribed_channels = response;
              } catch (err) {
                return false;
              }
            }
            if (msg.event === 'subscribe_and_send_tracking_data') {
              try {
                let response = await socketFunction.subscribe(msg);
                if (!response) return false;
                ws.subscribed_channels = response;
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
                })
  
              } catch (err) {
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
                return false;
              }
            }
            if (msg.event === 'ws_get_all_tracking') {
              try {
                const updated_customer_trackings = await socketFunction.getCustomerTrackings(msg);
                const customer_updated_trackings_message = JSON.stringify({
                  event: 'tracking_update',
                  payload: updated_customer_trackings,
                });
                WsServer.clients.forEach((client) => {
                  if (
                     client.connectionId === msg.receiver_id
                    && client.readyState === WebSocket.OPEN
                  ) {
                    client.send(customer_updated_trackings_message);
                  }
                });
              } catch (err) {
                return false;
              }
            }
            if (msg.event === 'subscribe_to_location') {
              try {
                ws.current_location = msg.channel.split(' ')[0].split('/')[0];
                console.log(ws.current_location);
              } catch (err) {
                return false;
              }
            }
          })
        }
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