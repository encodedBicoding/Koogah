import log from 'fancy-log';
import { HistoryTransactions } from '../../../database/models';
import Sequelize from 'sequelize';
import moment from 'moment';

const { Op } = Sequelize;

class History { 
  static get_all_user_history(req, res) {
    return Promise.try(async () => { 
      const { user } = req.session;
      const user_type = user.is_courier ? 'dispatcher' : 'customer';
      let timestamp_benchmark = moment().subtract(5, 'months').format();
      const _histories =  await HistoryTransactions.findAll({
        where: {
          [Op.and]: [{ user_type }, { user_id: user.id }],
          created_at: {
            [Op.gte]: timestamp_benchmark
          }
        },
      });

      return res.status(200).json({
        status: 200,
        data: _histories,
        message: 'Transaction histories retrieved successfully'
      });
    }).catch((error) => { 
      log(error);
      return;
    })
  }
};

export default History;
