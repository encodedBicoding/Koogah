const bcrypt = require('bcrypt');
const faker = require('faker');

const password = bcrypt.hashSync('Blood&ice3000', 8);

module.exports = {
  up: (queryInterface) => queryInterface.bulkInsert('Couriers',
    [
      {
        first_name: 'Dominic',
        last_name: 'Olije',
        email: 'dominic@olije.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 34000.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: true,
        profile_image: null,
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        password,
        nationality: 'nigerian',
        sex: 'M',
        bvn: '2354345400',
        rating: 3.4,
        no_of_raters: 4,
        pickups: 4,
        deliveries: 3,
        account_number: '2234849553',
        bank_name: 'uba',
        pending: 0,
        is_approved: true,
        last_payout: 3000.00,
        total_payouts: 7000.00,
        is_admin: false,
        referal_id: '93nsajnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Ruth',
        last_name: 'Temenu',
        email: 'ruth@temenu.com',
        is_courier: true,
        is_active: false,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: null,
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        password,
        nationality: 'nigerian',
        sex: 'M',
        bvn: '2354345200',
        rating: 0,
        no_of_raters: 0,
        pickups: 0,
        deliveries: 0,
        account_number: '223482253',
        bank_name: 'uba',
        pending: 0,
        is_approved: true,
        last_payout: 0.00,
        total_payouts: 0.00,
        is_admin: false,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy.com',
        is_courier: true,
        is_active: false,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: null,
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        password,
        nationality: 'nigerian',
        sex: 'M',
        bvn: '2354345200',
        rating: 0,
        no_of_raters: 0,
        pickups: 0,
        deliveries: 0,
        account_number: '223482253',
        bank_name: 'uba',
        pending: 0,
        is_approved: false,
        last_payout: 0.00,
        total_payouts: 0.00,
        is_admin: false,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },

    ], {}),

  down: (queryInterface) => queryInterface.bulkDelete('Couriers', null, {}),
};
