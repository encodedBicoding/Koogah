/* eslint-disable no-undef */
/* eslint-disable camelcase */
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../../server';
import { Couriers } from '../../../database/models';
import courier_data from '../test_data/courier.data';
import jwt from '../helpers/jwt';

const { expect } = chai;
const KoogahURLV1 = '/v1/user';
chai.use(chaiHttp);

let courier_verify_token;
let mob_code;

describe('Handle Courier controller', () => {
  before(() => Couriers.sync({ force: true }));
  describe('Test courier signup step one', () => {
    it('Should fail if first_name field is empty', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/courier/signup`)
        .send(courier_data[0])
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
    });
    it('Should pass and send verification code to courier email address', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/courier/signup`)
        .send(courier_data[1])
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal('A verificaton link has been sent to your email address');
          courier_verify_token = res.body.verify_token;
          done();
        });
    });
    it('Should fail if email already exists', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/courier/signup`)
        .send(courier_data[1])
        .end((err, res) => {
          expect(res.status).to.equal(409);
          done();
        });
    });
  });
  describe('Handle signup courier step two', () => {
    it('Should send a verification message to the user and update it accordingly in the database', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/email?key=${courier_verify_token}&code=COURIER`)
        .end((err, res) => {
          console.log(res.body);
          expect(res.status).to.equal(200);
          expect(res.body.message).to.equal('Please insert the verification code sent to the mobile number you provided on registeration');
          done();
        });
    });
    it('Should fail and return status 400 if token is invalid', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/email?key=invalid_token.ksjokeojinad9edkmdfs&code=COURIER`)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.equal('Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com');
          done();
        });
    });
  });
  describe('Handle failing if user has been previously verified', () => {
    before(async () => {
      const payload = await jwt.verify(courier_verify_token);
      const verifying_user = await Couriers.findOne({
        where: {
          email: payload.email,
        },
      });
      mob_code = verifying_user.verification_code;
      await Couriers.update(
        {
          verify_token: null,
        },
        {
          where: {
            email: payload.email,
          },
        },
      );
    });
    after(async () => {
      const payload = await jwt.verify(courier_verify_token);
      await Couriers.update(
        {
          verify_token: courier_verify_token,
        },
        {
          where: {
            email: payload.email,
          },
        },
      );
    });
    it('Should fail and return status 400 if user had previously verified their account', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/email?key=${courier_verify_token}&code=COURIER`)
        .end((err, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.equal('Oops, seems you have already verified your email and mobile number.');
          done();
        });
    });
  });
  describe('Test courier mobile verification code', () => {
    it('Should fail if mobile verification code is of invalid type', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/mobile?key=${courier_verify_token}&code=COURIER`)
        .send({ code: 'invalid_type' })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
    });
    it('Should fail if mobile verification code doesn\'t match the one sent to the user', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/mobile?key=${courier_verify_token}&code=COURIER`)
        .send({ code: '92890' })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
    });
    it('Should fail if user verification token is invalid', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/mobile?key=invalid_token&code=COURIER`)
        .send({ code: '92890' })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
    });
    it('Should pass if code matches the one sent to the user mobile', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/mobile?key=${courier_verify_token}&code=COURIER`)
        .send({ code: mob_code })
        .end((err, res) => {
          expect(res.status).to.equal(200);
          done();
        });
    });
  });
  describe('Handle failing if user has been previously verified their mobile code', () => {
    before(async () => {
      const payload = await jwt.verify(courier_verify_token);
      await Couriers.update(
        {
          verification_code: null,
        },
        {
          where: {
            email: payload.email,
          },
        },
      );
    });
    after(async () => {
      const payload = await jwt.verify(courier_verify_token);
      await Couriers.update(
        {
          verification_code: mob_code,
        },
        {
          where: {
            email: payload.email,
          },
        },
      );
    });
    it('Should fail and return status 400 if user had previously verified their account', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/mobile?key=${courier_verify_token}&code=COURIER`)
        .send({ code: mob_code })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
    });
  });
  describe('Handle failing if token is valid but user is not in the database', () => {
    before(async () => {
      const payload = await jwt.verify(courier_verify_token);
      await Couriers.destroy(
        {
          where: {
            email: payload.email,
          },
        },
      );
    });
    it('Should fail and return status 404', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/email?key=${courier_verify_token}&code=COURIER`)
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
    });
    it('Should fail and return status 404', (done) => {
      chai.request(app)
        .get(`${KoogahURLV1}/verify/mobile?key=${courier_verify_token}&code=COURIER`)
        .send({ code: mob_code })
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
    });
  });
});
