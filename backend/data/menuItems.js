const { faker } = require('@faker-js/faker');
const foodImages = require("./foodImages");

const menu = {
  "North Indian": [
    "Butter Chicken",
    "Paneer Butter Masala",
    "Dal Makhani",
    "Kadhai Paneer",
    "Shahi Paneer",
    "Tandoori Roti",
    "Butter Naan",
    "Jeera Rice",
    "Rajma Chawal",
    "Chole Bhature"
  ],

  "South Indian": [
    "Masala Dosa",
    "Plain Dosa",
    "Idli Sambar",
    "Vada",
    "Uttapam",
    "Curd Rice",
    "Lemon Rice",
    "Filter Coffee",
    "Medu Vada",
    "Rava Dosa"
  ],

  "Chinese": [
    "Veg Noodles",
    "Hakka Noodles",
    "Fried Rice",
    "Manchurian",
    "Spring Roll",
    "Chilli Chicken",
    "Schezwan Rice",
    "Momos",
    "Soup",
    "Paneer Chilli"
  ],

  "Italian": [
    "Margherita Pizza",
    "Farmhouse Pizza",
    "Pepperoni Pizza",
    "White Sauce Pasta",
    "Red Sauce Pasta",
    "Garlic Bread",
    "Lasagna",
    "Cheese Pizza",
    "Veg Pizza",
    "Mushroom Pizza"
  ],

  "Fast Food": [
    "Veg Burger",
    "Chicken Burger",
    "French Fries",
    "Cheese Fries",
    "Chicken Wings",
    "Wrap",
    "Hot Dog",
    "Sandwich",
    "Club Sandwich",
    "Loaded Fries"
  ],

  "Biryani": [
    "Chicken Biryani",
    "Veg Biryani",
    "Mutton Biryani",
    "Egg Biryani",
    "Hyderabadi Biryani",
    "Lucknowi Biryani",
    "Paneer Biryani",
    "Fish Biryani",
    "Prawn Biryani",
    "Dum Biryani"
  ],

  "Desserts": [
    "Gulab Jamun",
    "Rasmalai",
    "Ice Cream",
    "Brownie",
    "Cheesecake",
    "Chocolate Cake",
    "Cupcake",
    "Donut",
    "Pastry",
    "Falooda"
  ],

  "Cafe": [
    "Cold Coffee",
    "Cappuccino",
    "Latte",
    "Espresso",
    "Mocha",
    "Green Tea",
    "Hot Chocolate",
    "Milkshake",
    "Smoothie",
    "Iced Tea"
  ]
};

function generateMenuItems(restaurants) {

  const menuItems = [];

  restaurants.forEach((restaurant) => {

    restaurant.cuisine.forEach((category) => {

      if (!menu[category]) return;

      menu[category].forEach((dish) => {

        menuItems.push({

          restaurant: restaurant._id,

          name: dish,

          description: faker.commerce.productDescription(),

          price: faker.number.int({
            min: 80,
            max: 600
          }),

          discountedPrice: faker.number.int({
            min: 0,
            max: 50
          }),

          category,

          image: foodImages[dish] || "https://via.placeholder.com/600x400?text=Food",

          isVeg:
            faker.datatype.boolean(),

          isAvailable: true,

          isFeatured:
            faker.datatype.boolean(),

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
              min: 5,
              max: 500
            }),

          preparationTime:
            faker.number.int({
              min: 10,
              max: 45
            }),

          calories:
            faker.number.int({
              min: 150,
              max: 900
            }),

          allergens: [],

          customizations: [],

          tags: [
            "Popular"
          ]

        });

      });

    });

  });

  return menuItems;

}

module.exports = generateMenuItems;