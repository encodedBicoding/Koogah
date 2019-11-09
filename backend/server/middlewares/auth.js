import BearerStrategy from 'passport-http-bearer';
import jwt from '../api/v1/helpers/jwt';
import Couriers from '../../database/models/courier';

class Auth {
    
    static bearerStrategy() {
      return new BearerStrategy(async (token, done) => {
        let payload = await jwt.verify(token), is_found_user;

        if(!payload) return done(null, false);
        
        is_found_user = await Couriers.findOne({ 
          where: {
            email: payload.email
          }
        });

        if(!is_found_user) {
          // check main users table

        } else {
          return done(null, is_found_user)
        }
      })
    }
}

export default Auth;
