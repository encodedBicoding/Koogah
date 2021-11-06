import gcm from 'node-gcm';
import { config } from 'dotenv';

config();


class PushNotification {
  constructor() {
    this._senderCustomer = new gcm.Sender(process.env.FCM_SERVER_KEY_CUSTOMER);
    this._senderDispatcher = new gcm.Sender(process.env.FCM_SERVER_KEY_DISPATCHER)
  }
  get senderCustomer() {
    return this._senderCustomer;
  }
  get senderDispatcher() {
    return this._senderDispatcher;
  }
  createMessage(msg, data) {
    const message = new gcm.Message({
      priority: 'high',
      data: { ...data },
    });
    message.addNotification(msg);
    return message;
  }

  sendMessageCustomer(msg, tokens) {
    try {
      this.senderCustomer.send(msg, { registrationTokens: Array.isArray(tokens) ? tokens : [tokens]  }, function (err, result) { 
        if (err) {
          throw new Error(err);
        } else {
          return result
        }
      });
    } catch (err) {
      console.log(err);
    }
  }
  sendMessageDispatcher(msg, tokens) {
    try {
      this.senderDispatcher.send(msg, { registrationTokens: Array.isArray(tokens) ? tokens : [tokens] }, function (err, result) { 
        if (err) {
          throw new Error(err);
        } else {
          return result
        }
      });
    } catch (err) {
      console.log(err);
    }
  }
}

const PushNotify = new PushNotification();

export default PushNotify;
