import NodeGeodecoder from 'node-geocoder';
import { config } from 'dotenv';
import fetch from 'node-fetch';
config();
const options = {
  provider: 'google',
  apiKey: process.env.GOOGLE_API_KEY,
  formatter: null,
}

const geocoder = NodeGeodecoder(options);

export default geocoder;