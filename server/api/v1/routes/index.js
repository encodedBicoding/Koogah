/* eslint-disable import/no-cycle */
import express from 'express';
import userRoute from './users.route';

const route = express();

route.get('/', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Welcome to version one of this delivery service with no name yet',
    app_version: 'v1',
    app_name: 'libera',
    app_description: 'Online logistics company for the world',
  });
});

route.use('/user', userRoute);

export default route;
