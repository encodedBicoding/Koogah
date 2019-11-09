import redis from 'redis';
import { config } from 'dotenv';

config();
let client;
const isProduction = process.env.NODE_ENV === 'production';

if(isProduction) {
  client = redis.createClient(process.env.REDIS_URL)
} else {
  client = redis.createClient(6379)
}

export default client;

