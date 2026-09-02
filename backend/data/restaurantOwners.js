const { faker } = require('@faker-js/faker');

function generateRestaurantOwners(count = 30) {
  const owners = [];

  for (let i = 1; i <= count; i++) {
    owners.push({
      name: faker.person.fullName(),
      email: `restaurant${i}@foodash.com`,
      password: 'password123',
      phone: `98${faker.string.numeric(8)}`,
      role: 'restaurant',
      isActive: true,
      isVerified: true,
      avatar: '',
      avatarPublicId: '',
      authProvider: 'local'
    });
  }

  return owners;
}

module.exports = generateRestaurantOwners;