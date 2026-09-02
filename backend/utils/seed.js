require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const generateRestaurantOwners = require('../data/restaurantOwners');
const generateRestaurants = require('../data/restaurants');
const generateCustomers = require('../data/customers');
const generateDeliveryPartners = require('../data/deliveryPartners');
const generateMenuItems = require('../data/menuItems');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

    await MenuItem.deleteMany();
    await Restaurant.deleteMany();
    await User.deleteMany();

    console.log("Cleared existing data");

      // Create Admin
    const hashedPw = await bcrypt.hash("password123", 12);

    await User.create({
      name: "Admin User",
      email: "admin@foodash.com",
      password: "password123",
      role: "admin",
      isActive: true,
      isVerified: true
    });

    // Generate Users
    const ownerData = generateRestaurantOwners();
    const customerData = generateCustomers();
    const deliveryData = generateDeliveryPartners();

    // Hash passwords
    ownerData.forEach(user => user.password = hashedPw);
    customerData.forEach(user => user.password = hashedPw);
    deliveryData.forEach(user => user.password = hashedPw);

    // Insert users
    const owners = await User.insertMany(ownerData);
    await User.insertMany(customerData);
    await User.insertMany(deliveryData);

    console.log(`${owners.length} Restaurant Owners Created`);
    console.log(`${customerData.length} Customers Created`);
    console.log(`${deliveryData.length} Delivery Partners Created`);

  // Generate Restaurants
  const restaurantData = generateRestaurants(owners);

  const restaurants = await Restaurant.insertMany(restaurantData);

  console.log(`${restaurants.length} Restaurants Created`);



  const menuItems = generateMenuItems(restaurants);

  await MenuItem.insertMany(menuItems);

  console.log(`${menuItems.length} Menu Items Created`);

  

  console.log('✅ Seed completed!\n');
  console.log('=== LOGIN CREDENTIALS ===');
  console.log('Admin:    admin@foodash.com    / password123');
  console.log("Restaurant Owner: restaurant1@foodash.com / password123");
  console.log("Customer: customer1@foodash.com / password123");
  console.log("Delivery: delivery1@foodash.com / password123");

  await mongoose.disconnect();
  process.exit(0);
};

seed()
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
