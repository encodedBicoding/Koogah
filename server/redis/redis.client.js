import redis from 'redis';
import { config } from 'dotenv';
import log from 'fancy-log';

config();
// eslint-disable-next-line import/no-mutable-exports
let client;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  client = redis.createClient(process.env.REDIS_URL);
}
if (process.env.NODE_ENV === 'test') {
  console.log(process.env.REDIS_URL_TEST);
  client = redis.createClient(6379);
}
if (process.env.NODE_ENV === 'development') {
  client = redis.createClient(6379);
}

client.on('error', (err) => {
  log(err);
});

export default client;
