require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Restaurant.deleteMany(), MenuItem.deleteMany()]);
  console.log('Cleared existing data');

  // Create users
  const hashedPw = await bcrypt.hash('password123', 12);

  const admin = await User.create({
    name: 'Admin User', email: 'admin@foodash.com',
    password: hashedPw, role: 'admin', isActive: true, isVerified: true
  });

  const customer = await User.create({
    name: 'Rahul Sharma', email: 'customer@foodash.com',
    password: hashedPw, role: 'customer', phone: '9876543210',
    address: { street: '12 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' }
  });

  const restaurantOwner = await User.create({
    name: 'Priya Patel', email: 'restaurant@foodash.com',
    password: hashedPw, role: 'restaurant', phone: '9876543211'
  });

  const restaurantOwner2 = await User.create({
    name: 'Amit Kumar', email: 'restaurant2@foodash.com',
    password: hashedPw, role: 'restaurant', phone: '9876543212'
  });

  const deliveryPartner = await User.create({
    name: 'Ravi Delivery', email: 'delivery@foodash.com',
    password: hashedPw, role: 'delivery', phone: '9876543213',
    vehicleType: 'bike', vehicleNumber: 'KA01AB1234', isAvailable: true
  });

  // Create restaurants
  const restaurant1 = await Restaurant.create({
    owner: restaurantOwner._id,
    name: 'Spice Garden', description: 'Authentic South Indian cuisine',
    cuisine: ['South Indian', 'North Indian', 'Biryani'],
    address: {
      street: 'Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      coordinates: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // [longitude, latitude]
      }
    },
    phone: '080-12345678', email: 'spicegarden@example.com',
    isApproved: true, isOpen: true, rating: 4.3, ratingCount: 120,
    deliveryTime: '30-40 min', minimumOrder: 150, deliveryFee: 25,
    tags: ['Popular', 'Veg', 'Family'],
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'
  });

  const restaurant2 = await Restaurant.create({
    owner: restaurantOwner2._id,
    name: 'Burger Barn', description: 'Juicy burgers and crispy fries',
    cuisine: ['Burgers', 'Fast Food', 'American'],
    address: {
        street: '78 Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        coordinates: {
          type: 'Point',
          coordinates: [77.6408, 12.9784] // [longitude, latitude]
        }
      },
    phone: '080-87654321', email: 'burgerbarn@example.com',
    isApproved: true, isOpen: true, rating: 4.1, ratingCount: 89,
    deliveryTime: '25-35 min', minimumOrder: 200, deliveryFee: 30,
    tags: ['Trending', 'Non-Veg', 'Fast Food'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
  });

  const restaurant3 = await Restaurant.create({
    owner: restaurantOwner._id,
    name: 'Pizza Paradise', description: 'Wood-fired artisan pizzas',
    cuisine: ['Pizza', 'Italian', 'Pasta'],
    address: {
      street: '78 Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      coordinates: {
        type: 'Point',
        coordinates: [77.6408, 12.9784] // [longitude, latitude]
      }
    },
    phone: '080-55557777', email: 'pizzaparadise@example.com',
    isApproved: false, isOpen: false, rating: 0,
    deliveryTime: '35-45 min', minimumOrder: 250, deliveryFee: 35,
    tags: ['New', 'Italian'],
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'
  });

  // Menu items for Spice Garden
  await MenuItem.insertMany([
    { restaurant: restaurant1._id, name: 'Masala Dosa', description: 'Crispy dosa with spiced potato filling', price: 80, category: 'Breakfast', isVeg: true, isFeatured: true, rating: 4.5, image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=300' },
    { restaurant: restaurant1._id, name: 'Idli Sambar (4 pcs)', description: 'Fluffy steamed idlis with sambar and chutney', price: 60, category: 'Breakfast', isVeg: true, rating: 4.2 },
    { restaurant: restaurant1._id, name: 'Chicken Biryani', description: 'Aromatic basmati rice with tender chicken pieces', price: 220, category: 'Biryani', isVeg: false, isFeatured: true, rating: 4.6, image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=300' },
    { restaurant: restaurant1._id, name: 'Veg Biryani', description: 'Fragrant rice with mixed vegetables', price: 160, category: 'Biryani', isVeg: true, rating: 4.0 },
    { restaurant: restaurant1._id, name: 'Paneer Butter Masala', description: 'Rich creamy paneer curry', price: 180, category: 'Main Course', isVeg: true, rating: 4.4 },
    { restaurant: restaurant1._id, name: 'Dal Tadka', description: 'Yellow lentils tempered with spices', price: 120, category: 'Main Course', isVeg: true },
    { restaurant: restaurant1._id, name: 'Gulab Jamun (2 pcs)', description: 'Soft milk-solid dessert in sugar syrup', price: 60, category: 'Desserts', isVeg: true },
    { restaurant: restaurant1._id, name: 'Mango Lassi', description: 'Creamy mango yogurt drink', price: 70, category: 'Beverages', isVeg: true },
  ]);

  // Menu items for Burger Barn
  await MenuItem.insertMany([
    { restaurant: restaurant2._id, name: 'Classic Beef Burger', description: 'Juicy beef patty with lettuce, tomato, cheese', price: 220, category: 'Burgers', isVeg: false, isFeatured: true, rating: 4.5, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
    { restaurant: restaurant2._id, name: 'Veg Burger', description: 'Crispy veggie patty with fresh veggies', price: 160, category: 'Burgers', isVeg: true, rating: 4.0 },
    { restaurant: restaurant2._id, name: 'Chicken Zinger', description: 'Spicy crispy chicken burger', price: 200, category: 'Burgers', isVeg: false, isFeatured: true, rating: 4.3 },
    { restaurant: restaurant2._id, name: 'Loaded Fries', description: 'Crispy fries with cheese sauce and jalapeños', price: 140, category: 'Sides', isVeg: true, rating: 4.2 },
    { restaurant: restaurant2._id, name: 'Onion Rings', description: 'Golden crispy onion rings', price: 100, category: 'Sides', isVeg: true },
    { restaurant: restaurant2._id, name: 'Chocolate Shake', description: 'Thick creamy chocolate milkshake', price: 130, category: 'Beverages', isVeg: true },
    { restaurant: restaurant2._id, name: 'Strawberry Shake', description: 'Fresh strawberry milkshake', price: 130, category: 'Beverages', isVeg: true },
  ]);

  console.log('✅ Seed completed!\n');
  console.log('=== LOGIN CREDENTIALS ===');
  console.log('Admin:    admin@foodash.com    / password123');
  console.log('Customer: customer@foodash.com / password123');
  console.log('Restaurant: restaurant@foodash.com / password123');
  console.log('Delivery: delivery@foodash.com / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
