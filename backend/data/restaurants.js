const { faker } = require('@faker-js/faker');

const restaurantNames = [
  "Karim's",
  "Biryani Blues",
  "Burger Singh",
  "Pizza Hub",
  "Chinese Wok",
  "The Punjabi Dhaba",
  "South Spice",
  "Rolls Republic",
  "Momo Nation",
  "Tandoori Nights",
  "Cafe Coffee House",
  "BBQ Junction",
  "Royal Mughlai",
  "Chaat Bazaar",
  "Delhi Darbar",
  "Amritsari Kulcha",
  "Bombay Bites",
  "Healthy Bowl",
  "Wrap House",
  "Spice Kitchen",
  "The Pasta Place",
  "Kebab Express",
  "Food Factory",
  "Taste of India",
  "The Curry Club",
  "Street Food Hub",
  "Masala Magic",
  "Royal Biryani",
  "The Burger Spot",
  "Pizza Paradise"
];

const cuisines = [
  "North Indian",
  "South Indian",
  "Chinese",
  "Italian",
  "Fast Food",
  "Biryani",
  "Desserts",
  "Cafe"
];

const delhiAreas = [
  {
    area: "Connaught Place",
    pincode: "110001",
    lat: 28.6315,
    lng: 77.2167
  },
  {
    area: "Saket",
    pincode: "110017",
    lat: 28.5245,
    lng: 77.2066
  },
  {
    area: "Rohini",
    pincode: "110085",
    lat: 28.7494,
    lng: 77.0565
  },
  {
    area: "Dwarka",
    pincode: "110075",
    lat: 28.5921,
    lng: 77.0460
  },
  {
    area: "Karol Bagh",
    pincode: "110005",
    lat: 28.6519,
    lng: 77.1909
  },
  {
    area: "Lajpat Nagar",
    pincode: "110024",
    lat: 28.5677,
    lng: 77.2435
  }
];

function generateRestaurants(owners) {
  const restaurants = [];

  owners.forEach((owner, index) => {

    const location =
      delhiAreas[index % delhiAreas.length];

    restaurants.push({

      owner: owner._id,

      name: restaurantNames[index],

      description:
        faker.company.catchPhrase(),

      cuisine: [
        faker.helpers.arrayElement(cuisines),
        faker.helpers.arrayElement(cuisines)
      ],

      address: {

        street:
          faker.location.streetAddress(),

        city: "Delhi",

        state: "Delhi",

        pincode: location.pincode,

        coordinates: {

          type: "Point",

          coordinates: [
            location.lng,
            location.lat
          ]

        }

      },

      phone: `98${faker.string.numeric(8)}`,

      email:
        `restaurant${index + 1}@foodash.com`,

      isApproved: true,

      isOpen: faker.datatype.boolean(),

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

      totalOrders:
        faker.number.int({
          min: 100,
          max: 5000
        }),

      deliveryTime:
        `${faker.number.int({
          min: 20,
          max: 50
        })} min`,

      minimumOrder:
        faker.helpers.arrayElement([
          99,
          149,
          199,
          249
        ]),

      deliveryFee:
        faker.helpers.arrayElement([
          20,
          30,
          40,
          50
        ]),

      tags: [
        "Popular",
        "Fast Delivery"
      ],

      image:
        `https://picsum.photos/seed/rest${index}/600/400`

    });

  });

  return restaurants;
}

module.exports = generateRestaurants;