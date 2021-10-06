/* eslint-disable import/no-cycle */
import express from 'express';
import userRoute from './users.route';
import packageRoute from './packages.route';
import paymentRoutes from './payments.route';
import payoutRoutes from './payouts.route';
import notifyRoutes from './notify.route';
import profileRoutes from './profile.route';
import historyRoutes from './history.route';
import verifyRoute from './verifyme.route';
import companyRoute from './company.route';
import promoRoute from './promo.route';

const route = express();

route.get('/', async (req, res) => {
  return res.status(200).json({
    status: 200,
    message: 'Welcome to Koogah Nigeria',
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
route.use('/history', historyRoutes);
route.use('/verify', verifyRoute);
route.use('/company', companyRoute);
route.use('/promo', promoRoute);

export default route;
