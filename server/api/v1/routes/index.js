/* eslint-disable import/no-cycle */
import express from 'express';
import userRoute from './users.route';
import packageRoute from './packages.route';
import paymentRoutes from './payments.route';
import payoutRoutes from './payouts.route';
import notifyRoutes from './noify.route';
import profileRoutes from './profile.route';

const route = express();

route.get('/', (req, res) => {
  console.log(req);
  return res.status(200).json({
    status: 200,
    message: 'Welcome to Koogah',
    app_version: 'v1',
    app_name: 'Koogah',
    app_description: 'Online logistics company for the world',
  })
});

route.use('/user', userRoute);
route.use('/package', packageRoute);
route.use('/payment', paymentRoutes);
route.use('/payout', payoutRoutes);
route.use('/notifications', notifyRoutes);
route.use('/profile', profileRoutes);

export default route;
