import express from 'express';
import packageRouteV2 from './package.route.v2';
import notifyRoutesV2 from './notify.route.v2';

const routeV2 = express();

routeV2.get('/', async (req, res) => {
  return res.status(200).json({
    status: 200,
    message: 'Welcome to Koogah Nigeria',
    app_version: 'v2',
    app_name: 'Koogah',
    app_description: 'Online logistics company for the world',
  });
});

routeV2.use('/package', packageRouteV2);
routeV2.use('/notifications', notifyRoutesV2);



export default routeV2;