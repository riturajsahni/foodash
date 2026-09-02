const { faker } = require('@faker-js/faker');

function generateCustomers(count = 100) {
  const customers = [];

  const delhiAreas = [
    { area: "Connaught Place", pincode: "110001" },
    { area: "Saket", pincode: "110017" },
    { area: "Dwarka", pincode: "110075" },
    { area: "Rohini", pincode: "110085" },
    { area: "Karol Bagh", pincode: "110005" },
    { area: "Lajpat Nagar", pincode: "110024" },
    { area: "Janakpuri", pincode: "110058" },
    { area: "Pitampura", pincode: "110034" },
    { area: "Rajouri Garden", pincode: "110027" },
    { area: "Malviya Nagar", pincode: "110017" }
  ];

  for (let i = 1; i <= count; i++) {

    const location =
      faker.helpers.arrayElement(delhiAreas);

    customers.push({

      name: faker.person.fullName(),

      email: `customer${i}@foodash.com`,

      password: "password123",

      role: "customer",

      phone: `98${faker.string.numeric(8)}`,

      isActive: true,

      isVerified: true,

      authProvider: "local",

      addresses: [
        {
          label: "Home",
          street: faker.location.streetAddress(),
          city: "Delhi",
          state: "Delhi",
          pincode: location.pincode,
          landmark: location.area,
          isDefault: true
        }
      ]

    });

  }

  return customers;
}

module.exports = generateCustomers;