import redis from 'redis';
import { config } from 'dotenv';
import log from 'fancy-log';
import url from 'url';

config();
// eslint-disable-next-line import/no-mutable-exports
let client;
const isProduction = process.env.NODE_ENV === 'production';
var rtg;
if (isProduction) {
  rtg = url.parse(process.env.REDIS_URL);
  client = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(':')[1]);
}
if (process.env.NODE_ENV === 'test') {
  if (process.env.REDIS_URL_TEST) {
    client = redis.createClient(process.env.REDIS_URL_TEST);
  } else {
    client = redis.createClient(6379);
  }
}
if (process.env.NODE_ENV === 'development') {
  client = redis.createClient(6379);
}

client.on('error', (err) => {
  log(err);
});

export default client;
