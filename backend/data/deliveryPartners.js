const { faker } = require('@faker-js/faker');

const delhiLocations = [
  { lat: 28.6315, lng: 77.2167 }, // Connaught Place
  { lat: 28.5245, lng: 77.2066 }, // Saket
  { lat: 28.5921, lng: 77.0460 }, // Dwarka
  { lat: 28.7494, lng: 77.0565 }, // Rohini
  { lat: 28.6519, lng: 77.1909 }, // Karol Bagh
  { lat: 28.5677, lng: 77.2435 }, // Lajpat Nagar
  { lat: 28.7041, lng: 77.1025 }, // North Delhi
  { lat: 28.5355, lng: 77.3910 }, // East Delhi
];

function generateDeliveryPartners(count = 50) {

  const partners = [];

  for (let i = 1; i <= count; i++) {

    const location =
      faker.helpers.arrayElement(delhiLocations);

    partners.push({

      name: faker.person.fullName(),

      email: `delivery${i}@foodash.com`,

      password: "password123",

      role: "delivery",

      phone: `99${faker.string.numeric(8)}`,

      vehicleType:
        faker.helpers.arrayElement([
          "bike",
          "scooter",
          "cycle"
        ]),

      vehicleNumber:
        `DL${faker.number.int({ min: 1, max: 99 })}${faker.string.alpha({ length: 2, casing: 'upper' })}${faker.number.int({ min: 1000, max: 9999 })}`,

      isAvailable:
        faker.datatype.boolean(),

      isOnline:
        faker.datatype.boolean(),

      currentLocation: {
        type: "Point",
        coordinates: [
          location.lng,
          location.lat
        ]
      },

      lastLocationUpdate: new Date(),

      totalEarnings:
        faker.number.int({
          min: 1000,
          max: 100000
        }),

      completedDeliveries:
        faker.number.int({
          min: 10,
          max: 3000
        }),

      rating:
        Number(
          faker.number.float({
            min: 3.5,
            max: 5,
            fractionDigits: 1
          })
        ),

      ratingCount:
        faker.number.int({
          min: 20,
          max: 500
        }),

      isActive: true,

      isVerified: true,

      authProvider: "local"

    });

  }

  return partners;

}

module.exports = generateDeliveryPartners;