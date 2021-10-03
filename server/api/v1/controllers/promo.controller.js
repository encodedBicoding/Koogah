/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import { config } from 'dotenv';
import log from 'fancy-log';
import Sequelize from 'sequelize';

const { Op } = Sequelize;
config();

const isProduction = process.env.NODE_ENV === 'production';
/**
 * @class PromoController
 */
class PromoController {

}