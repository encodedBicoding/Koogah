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
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
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
        company_id: 1,
        last_payout: 3000.00,
        total_payouts: 7000.00,
        is_currently_dispatching: false,
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
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        password,
        nationality: 'nigerian',
        sex: 'M',
        bvn: '2354345200',
        is_currently_dispatching: false,
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
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy1.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy2.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy3.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy4.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy5.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy6.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy7.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Lizzy',
        last_name: 'Temenu',
        email: 'lizzy@breezy8.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy9.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy10.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy11.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy12.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy13.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy14.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy15.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy16.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy17.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy18.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy19.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: 'lizzy@breezy20.com',
        is_courier: true,
        is_active: true,
        virtual_balance: 0.00,
        verify_token: null,
        mobile_number: '09032922527',
        verification_code: null,
        is_verified: false,
        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        is_currently_dispatching: false,
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
        company_id: 1,
        referal_id: 'omanjnijad',
        ws_connected_channels: [''],
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
    ], {}),

  down: (queryInterface) => queryInterface.bulkDelete('Couriers', null, {}),
};
