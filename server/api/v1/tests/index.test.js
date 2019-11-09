import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../../server';

const { expect } = chai;
chai.use(chaiHttp);

describe('Homepage test', () => {
  it('Should show welcome message and redirect to app current version', (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        done();
      });
  });
});
