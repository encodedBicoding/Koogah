/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import 'babel-polyfill';
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import connectRedis from 'connect-redis';
import errorHandler from 'errorhandler';
import session from 'express-session';
import { config } from 'dotenv';
import log from 'fancy-log';
import helmet from 'helmet';
import compression from 'compression';
import RateLimit from 'express-rate-limit';
import enforce from 'express-sslify';
import RedisStore from 'rate-limit-redis';
import morgan from 'morgan';
import client from './redis/redis.client';
import RouteV1 from './api/v1/routes';
import RouteV2 from './api/v2/routes';
import Auth from './middlewares/auth';
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: "https://8a2cb24ac17c481db14713ae1649a627@o816982.ingest.sentry.io/5810631",
  tracesSampleRate: 1.0,
});

Sentry.startTransaction({
  op: "production",
  name: "production transaction",
});

const accepted_urls = [
  'https://www.koogah.com',
  'https://www.koogah.com.ng',
  'http://www.koogah.com',
  'http://www.koogah.com.ng',
  'https://koogah.com',
  'https://koogah.com.ng',
  'http://koogah.com',
  'http://koogah.com.ng',
  'http://localhost:8081',
  'http://localhost:8080',
  'http://10.0.2.2:8081',
];

const { bearerStrategy } = Auth;


const corsOption = {
  origin: (origin, cb) => {
    if (accepted_urls.indexOf(origin) !== -1) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200
};


config();


const app = express();
const SessionStore = connectRedis(session);
app.enable('trust proxy');

const isProduction = app.get('env') === 'production';

if (isProduction) {
  app.set('trust proxy', 1)
}

const apiLimiter = new RateLimit({
  store: new RedisStore({
    client,
  }),
  windowMs: 15 * 60 * 1000,
  max: 150,
  delayMs: 0,
});

app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.0' }));
if (isProduction) app.use(enforce.HTTPS());
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: { secure: isProduction ? true : false, path: "/", httpOnly: true, sameSite: 'none' },
  name: '__KoogahSess__',
  resave: false,
  proxy: true,
  saveUninitialized: true,
  store: new SessionStore({ client, ttl: 60 * 60 * 24 }),
}));
app.use(compression());
app.use(passport.initialize());
app.use(passport.session());
passport.use('bearer', bearerStrategy());

if (!isProduction) {
  app.use(errorHandler({
    dumpExceptions: true,
    showStack: true,
  }));
} else {
  app.use(errorHandler());
}
app.get('/', (req, res) => res.redirect('/v1'));
app.use(morgan('dev'));
app.use('*', apiLimiter);
app.use('/v1', RouteV1);
app.use('/v2', RouteV2);

app.set('title', 'Koogah');

app.use((req, res, next) => {
  const err = new Error('Resource does not exist');
  err.status = 404;
  next(err);
});


if (!isProduction) {
  // eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(err.status || 500).json({
  error: {
    message: err.message,
    error: {},
  },
  status: false,
}));

app.on('error', (error) => {
  log.error(error);
  Sentry.captureException(error);
});



process.on('uncaughtException', (error) => {
  log.error('uncaughtException ', error.message);
  log.error(error.stack);
  Sentry.captureException(error);

  // More work to be done here
  // you should send DevOps the stack error via mail and/or sms
  process.exit(1);
});

export default app;
