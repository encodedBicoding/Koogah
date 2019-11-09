import 'babel-polyfill';
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import connectRedis from 'connect-redis';
import bodyParser from 'body-parser';
import errorHandler from 'errorhandler'
import session from 'express-session';
import { config } from 'dotenv';
import log from 'fancy-log';
import helmet from 'helmet';
import compression from 'compression';
import RateLimit from 'express-rate-limit';
import enforce from 'express-sslify';
import RedisStore from 'rate-limit-redis';
import client from '../redis/redis.client';
import morgan from 'morgan';
import RouteV1 from './api/v1/routes';
import Auth from './middlewares/auth';

const accepted_urls = ['https://website.com', 'https://website_2.com'];

const { bearerStrategy } = Auth;


const corsOption = {
  origin: (origin, cb) => {
    if(accepted_urls.indexOf(origin) !== -1) {
      return cb(null, true)
    } else {
      cb(null, false)
    }
  }
}


config();

const app = express();
const sessionStore = connectRedis(session);
app.enable('trust proxy');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const isProduction = app.get('env') === 'production';

let apiLimiter = new RateLimit({
  store: new RedisStore({
    client: client,
  }),
  windowMs: 15*60*1000,
  max: 50,
  delayMs: 0
});

app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.0' }));
if(isProduction) app.use(enforce.HTTPS());
app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb'}));
app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  cookie: { maxAge: 60000, secure: true }, 
  resave: false, 
  saveUninitialized: true,
  store: new sessionStore({ client })
}));
app.use(compression());
app.use(passport.initialize());
app.use(passport.session());
if(!isProduction) {
  app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
  }))
} else {
  app.use(errorHandler())
}
app.use(morgan('dev'));
app.use('*', apiLimiter);
app.use('/v1', RouteV1);

app.set('title', 'Koogah')

app.use((req, res, next) => {
  const err = new Error('Resource does not exist');
  err.status = 404;
  next(err);
});

passport.use('bearer', bearerStrategy());

if (!isProduction) {
  app.use((err, req, res, next) => {
    log(err.stack);
    res.status(err.status || 500).json({
      error: {
        message: err.message,
        error: err,
      },
      status: false,
    });
  });
}

app.use((err, req, res, next) => {
  return res.status(err.status || 500).json({
    error: {
      message: err.message,
      error: {},
    },
    status: false,
  });
});

app.on('error', function(error){
  log.error(error);
});


process.on('uncaughtException', (error) => {
  log.error('uncaughtException ', error.message);
  log.error(error.stack);

  // More work to be done here
  // you should send DevOps the stack error via mail and/or sms
  process.exit(1);
})

app.listen(PORT, () => {
  if(!isProduction) log(`App running on port ${PORT}`)
})



export default app;


