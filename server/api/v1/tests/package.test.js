/* eslint-disable camelcase */
/* eslint-disable no-undef */
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../../server';
import { Packages } from '../../../database/models';

const { expect } = chai;
const KoogahURLV1 = '/v1/package';
chai.use(chaiHttp);
let verified_customer_token;
let another_customer_token;
let unverified_customer_token;
let approved_courier_token;
let unapproved_courier_token;
let package_id;

describe('Handle package tests', () => {
  before(() => Packages.sync({ force: true }));
  before('Sign in a user', (done) => {
    chai.request(app)
      .post('/v1/user/customer/signin')
      .send({ email: 'dominic@olije.com', password: '1234567890' })
      .end((err, res) => {
        verified_customer_token = res.body.user.token;
        done();
      });
  });
  before('Sign in a user', (done) => {
    chai.request(app)
      .post('/v1/user/customer/signin')
      .send({ email: 'ruth@temenu.com', password: '1234567890' })
      .end((err, res) => {
        unverified_customer_token = res.body.user.token;
        done();
      });
  });
  describe('Handle package creating in requesting dispatch', () => {
    it('Should fail if user is not authorized', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/intra`)
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          expect(res.error.text).to.equal('Unauthorized');
          done();
        });
    });
    it('Should fail if token is invalid', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/intra`)
        .set({
          Authorization: 'Bearer fake_token',
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
    it('Should fail if token is invalid', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/intra`)
        .set({
          Authorization: 'Bearer fake_token',
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
    it('Should fail if req.params.type is invalid', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/jkjkj`)
        .set({
          Authorization: `Bearer ${verified_customer_token}`,
        })
        .send({
          weight: '0-5',
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.error[0].message).to.equal('"type" must be one of [intra, inter, international]');
          done();
        });
    });
    it('Should fail if any data in req.body is missing or invalid', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/intra`)
        .set({
          Authorization: `Bearer ${verified_customer_token}`,
        })
        .send({
          description: 'a lite package',
          from_state: 'lagos',
          from_town: 'ojota',
          to_town: 'ojota',
          pickup_address: '17 oyebola street ojota lagos',
          dropoff_address: '25 kujore street ojota lagos',
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(400);
          done();
        });
    });
    it('Should pass and create package id all is well', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/intra`)
        .set({
          Authorization: `Bearer ${verified_customer_token}`,
        })
        .send({
          weight: '0-5',
          description: 'a lite package',
          from_state: 'lagos',
          from_town: 'ojota',
          to_town: 'ojota',
          pickup_address: '17 oyebola street ojota lagos',
          dropoff_address: '25 kujore street ojota lagos',
          image_urls: ['image.jpg'],
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          package_id = res.body.package_detail.package_id;
          done();
        });
    });
    it('Should fail if user has not been verified', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/intra`)
        .set({
          Authorization: `Bearer ${unverified_customer_token}`,
        })
        .send({
          weight: '0-5',
          description: 'a lite package',
          from_state: 'lagos',
          from_town: 'ojota',
          to_town: 'ojota',
          pickup_address: '17 oyebola street ojota lagos',
          dropoff_address: '25 kujore street ojota lagos',
          image_urls: ['image.jpg'],
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
  });
  describe('Handle Courier ability to show interest in a package', () => {
    before('Signin a courier', (done) => {
      chai.request(app)
        .post('/v1/user/courier/signin')
        .send({ email: 'ruth@temenu.com', password: '1234567890' })
        .end((err, res) => {
          unapproved_courier_token = res.body.user.token;
          done();
        });
    });
    before('Sign in a user', (done) => {
      chai.request(app)
        .post('/v1/user/courier/signin')
        .send({ email: 'dominic@olije.com', password: '1234567890' })
        .end((err, res) => {
          approved_courier_token = res.body.user.token;
          done();
        });
    });
    it('Should fail if authorization is not provided', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/courier/interest/${package_id}`)
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
    it('Should fail if package id is not found', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/courier/interest/!@#`)
        .set({
          Authorization: `Bearer ${approved_courier_token}`,
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(404);
          done();
        });
    });
    it('Should fail if and unapproved user tries to access this route', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/courier/interest/${package_id}`)
        .set({
          Authorization: `Bearer ${unapproved_courier_token}`,
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
    it('should pass if authorization is provided', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/courier/interest/${package_id}`)
        .set({
          Authorization: `Bearer ${approved_courier_token}`,
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          done();
        });
    });
  });
  describe('Handle approve or decline a courier request', () => {
    before('Sign in a user', (done) => {
      chai.request(app)
        .post('/v1/user/customer/signin')
        .send({ email: 'dominic@olije.com', password: '1234567890' })
        .end((err, res) => {
          verified_customer_token = res.body.user.token;
          done();
        });
    });
    before('Sign in another user', (done) => {
      chai.request(app)
        .post('/v1/user/customer/signin')
        .send({ email: 'faker@email.com', password: '1234567890' })
        .end((err, res) => {
          another_customer_token = res.body.user.token;
          done();
        });
    });
    it('should fail if no response is provided', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/customer/interest/not_found`)
        .set({
          Authorization: `Bearer ${verified_customer_token}`,
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(400);
          done();
        });
    });
    it('should fail if package is not found', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/customer/interest/not_found?response=approve`)
        .set({
          Authorization: `Bearer ${verified_customer_token}`,
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(404);
          done();
        });
    });
    it('should fail if another customer tries to verify the package', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/customer/interest/${package_id}?response=approve`)
        .set({
          Authorization: `Bearer ${another_customer_token}`,
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(401);
          done();
        });
    });
    it('should pass if all is well', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/customer/interest/${package_id}?response=approve`)
        .set({
          Authorization: `Bearer ${verified_customer_token}`,
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          done();
        });
    });
  });
  describe('Handle pending dispatches', () => {
    before('create a new package', (done) => {
      chai.request(app)
        .post(`${KoogahURLV1}/intra`)
        .set({
          Authorization: `Bearer ${verified_customer_token}`,
        })
        .send({
          weight: '0-5',
          description: 'a lite package',
          from_state: 'lagos',
          from_town: 'ojota',
          to_town: 'ojota',
          pickup_address: '17 oyebola street ojota lagos',
          dropoff_address: '25 kujore street ojota lagos',
          image_urls: ['https://image1', 'https://image2'],
        })
        .end((err, res) => {
          package_id = res.body.package_detail.package_id;
          done();
        });
    });
    it('should fail if the package has no pending dispatcher', (done) => {
      chai.request(app)
        .patch(`${KoogahURLV1}/customer/interest/${package_id}?response=approve`)
        .set({
          Authorization: `Bearer ${verified_customer_token}`,
        })
        .end((err, res) => {
          expect(res.statusCode).to.equal(400);
          done();
        });
    });
  });
});
