import log from 'fancy-log';
import { TransactionHistory, Transactions } from '../../../database/models';
import Sequelize from 'sequelize';

const { Op } = Sequelize;

class History { 
  static get_all_user_history(req, res) {
    return Promise.try(async () => { 
      const { user } = req.session;
      const user_type = user.is_courier ? 'dispatcher' : 'customer';
      const _histories = TransactionHistory.findAll({
        where: {
          [Op.and]: [{user_type}, {user_id: user.id}]
        },
        include: [
          {
            model: Transactions,
            as: 'Transactions'
          }
        ]
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
