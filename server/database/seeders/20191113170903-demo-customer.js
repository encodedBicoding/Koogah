const bcrypt = require('bcrypt');
const faker = require('faker');

const password = bcrypt.hashSync('1234567890', 8);

module.exports = {
  up: (queryInterface) => queryInterface.bulkInsert('Customers',
    [
      {
        first_name: 'Dominic',
        last_name: 'Olije',
        business_name: 'Devino',
        has_business: true,
        is_courier: false,
        is_active: true,
        virtual_balance: 34000.00,
        verify_token: null,
        mobile_number_one: '09032922527',
        mobile_number_two: null,
        verification_code: null,
        is_verified: true,
        profile_image: null,
        address: '17 bing street off facebook busstop',
        state: 'lagos',
        town: 'lagos',
        email: 'dominic@olije.com',
        password,
        is_admin: false,
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: 'Ruth',
        last_name: 'Temenu',
        business_name: 'Business',
        has_business: true,
        is_courier: false,
        is_active: false,
        mobile_number_one: faker.phone.phoneNumber(),
        mobile_number_two: faker.phone.phoneNumber(),
        address: 'any address will do',
        state: 'lagos',
        town: 'ojota',
        email: 'ruth@temenu.com',
        password,
        is_verified: false,
        is_admin: false,
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        business_name: 'Business',
        has_business: true,
        is_courier: false,
        is_active: false,
        mobile_number_one: faker.phone.phoneNumber(),
        mobile_number_two: faker.phone.phoneNumber(),
        address: 'any address will do',
        state: 'lagos',
        town: 'ojota',
        email: 'faker@email.com',
        password,
        is_verified: true,
        is_admin: false,
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        business_name: 'Business',
        has_business: true,
        is_courier: false,
        is_active: false,
        mobile_number_one: faker.phone.phoneNumber(),
        mobile_number_two: faker.phone.phoneNumber(),
        address: 'any address will do',
        state: 'lagos',
        town: 'ojota',
        email: faker.internet.email(),
        password,
        is_admin: false,
        is_verified: false,
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
      {
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        business_name: 'Business',
        has_business: true,
        is_courier: false,
        is_active: false,
        mobile_number_one: faker.phone.phoneNumber(),
        mobile_number_two: faker.phone.phoneNumber(),
        address: 'any address will do',
        state: 'lagos',
        town: 'ojota',
        email: faker.internet.email(),
        password,
        is_admin: false,
        is_verified: false,
        created_at: faker.date.future(1),
        updated_at: faker.date.future(1),
      },
    ], {}),

  down: (queryInterface) => queryInterface.bulkDelete('Customers', null, {}),
};
