import gcm from 'node-gcm';
import { config } from 'dotenv';

config();


class PushNotification {
  constructor() {
    this._sender = new gcm.Sender(process.env.FCM_SERVER_KEY);
  }
  get sender() {
    return this._sender;
  }
  createMessage(msg, data) {
    const message = new gcm.Message({
      priority: 'high',
      data: {...data }
    });
    message.addNotification(msg);
    return message;
  }

  sendMessage(msg, tokens) {
    this.sender.send(msg, { registrationTokens: [tokens] }, function (err, result) { 
      if (err) {
        throw new Error(err);
      } else {
        return result
      }
    });
  }
}

const PushNotify = new PushNotification();

export default PushNotify;
