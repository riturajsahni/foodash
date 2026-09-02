# 🍕 FooDash — Full-Stack Food Delivery Platform

A production-ready, full-stack food delivery application with **four separate role-based interfaces**, real-time order tracking via WebSockets, JWT authentication, and a complete RESTful API.

---

## 📁 Project Structure

```
foodash/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile
│   │   ├── restaurantController.js
│   │   ├── menuController.js
│   │   ├── orderController.js
│   │   ├── deliveryController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js             # JWT protect + authorize + generateToken
│   ├── models/
│   │   ├── User.js             # Customer, Restaurant owner, Delivery, Admin
│   │   ├── Restaurant.js
│   │   ├── MenuItem.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── restaurants.js
│   │   ├── menu.js
│   │   ├── orders.js
│   │   ├── delivery.js
│   │   ├── admin.js
│   │   ├── payments.js
│   │   └── users.js
│   ├── socket/
│   │   └── socketHandlers.js   # Real-time Socket.io events
│   ├── utils/
│   │   └── seed.js             # Sample data seeder
│   ├── server.js               # Express app + Socket.io entry
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # React.js + Tailwind CSS
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Navbar.js   # Role-aware top navigation
│   │   │       └── index.js    # StatusBadge, StatCard, LoadingSpinner, EmptyState, helpers
│   │   ├── contexts/
│   │   │   ├── AuthContext.js  # User auth state, login/logout
│   │   │   ├── CartContext.js  # Shopping cart state
│   │   │   └── SocketContext.js # Socket.io connection
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.js
│   │   │   │   └── RegisterPage.js
│   │   │   ├── customer/
│   │   │   │   ├── CustomerHome.js      # Restaurant browse + search
│   │   │   │   ├── RestaurantDetail.js  # Menu, add to cart
│   │   │   │   ├── CartPage.js          # Cart + checkout
│   │   │   │   ├── OrdersPage.js        # Order history
│   │   │   │   ├── OrderTracking.js     # Live tracking + rating
│   │   │   │   └── CustomerProfile.js
│   │   │   ├── restaurant/
│   │   │   │   ├── RestaurantDashboard.js  # Analytics + live orders
│   │   │   │   ├── RestaurantOrders.js     # Accept/reject/prepare orders
│   │   │   │   ├── MenuManagement.js       # CRUD menu items
│   │   │   │   ├── RestaurantSetup.js      # First-time onboarding
│   │   │   │   └── RestaurantProfile.js
│   │   │   ├── delivery/
│   │   │   │   ├── DeliveryDashboard.js  # Available orders + toggle online
│   │   │   │   ├── DeliveryOrders.js     # My active deliveries
│   │   │   │   └── EarningsDashboard.js  # Earnings summary
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.js     # Platform analytics + weekly trend
│   │   │       ├── AdminUsers.js         # Manage all users
│   │   │       ├── AdminRestaurants.js   # Approve/reject restaurants
│   │   │       └── AdminOrders.js        # Monitor all orders
│   │   ├── services/
│   │   │   └── api.js          # Axios instance + all API calls
│   │   ├── App.js              # Router + Protected routes
│   │   ├── index.js
│   │   └── index.css           # Tailwind + custom component classes
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json                # Root scripts (run both apps)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+ ([nodejs.org](https://nodejs.org))
- **MongoDB** running locally OR a MongoDB Atlas URI ([mongodb.com/atlas](https://www.mongodb.com/atlas))
- **npm** v8+

---

### Step 1 — Clone & Install

```bash
# Clone the repo (or extract the zip)
cd foodash

# Install root-level concurrently
npm install

# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

---

### Step 2 — Configure Environment

```bash
# Copy the example env file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/foodash
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Optional — for Stripe payment integration
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
```

> **MongoDB Atlas:** Replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://username:password@cluster.mongodb.net/foodash?retryWrites=true&w=majority`

---

### Step 3 — Seed the Database

```bash
npm run seed
```

This creates sample users, restaurants, and menu items:

| Role       | Email                     | Password      |
|------------|---------------------------|---------------|
| Admin      | admin@foodash.com         | password123   |
| Customer   | customer@foodash.com      | password123   |
| Restaurant | restaurant@foodash.com    | password123   |
| Delivery   | delivery@foodash.com      | password123   |

---

### Step 4 — Run the App

```bash
# Run both backend and frontend simultaneously
npm run dev
```

Or run separately:

```bash
# Terminal 1 — Backend (port 5000)
npm run dev:backend

# Terminal 2 — Frontend (port 3000)
npm run dev:frontend
```

Open **http://localhost:3000** in your browser.

---

## 🔑 Role-Based Access

After logging in, users are automatically redirected to their role's interface:

| Role       | Entry Route         | Key Features |
|------------|---------------------|--------------|
| Customer   | `/customer`         | Browse, order, track, review |
| Restaurant | `/restaurant`       | Dashboard, menu CRUD, order management |
| Delivery   | `/delivery`         | Accept orders, update status, earnings |
| Admin      | `/admin`            | Platform analytics, approvals, user management |

---

## 🌐 API Reference

### Authentication
| Method | Endpoint               | Access  | Description |
|--------|------------------------|---------|-------------|
| POST   | `/api/auth/register`   | Public  | Register any role |
| POST   | `/api/auth/login`      | Public  | Login, returns JWT |
| GET    | `/api/auth/me`         | Private | Current user info |
| PUT    | `/api/auth/profile`    | Private | Update profile |
| PUT    | `/api/auth/change-password` | Private | Change password |

### Restaurants
| Method | Endpoint                        | Access       |
|--------|---------------------------------|--------------|
| GET    | `/api/restaurants`              | Public       |
| GET    | `/api/restaurants/:id`          | Public       |
| POST   | `/api/restaurants/register`     | Restaurant   |
| GET    | `/api/restaurants/my/profile`   | Restaurant   |
| PUT    | `/api/restaurants/my/profile`   | Restaurant   |
| PUT    | `/api/restaurants/my/toggle-status` | Restaurant |
| GET    | `/api/restaurants/my/orders`    | Restaurant   |
| GET    | `/api/restaurants/my/analytics` | Restaurant   |

### Menu
| Method | Endpoint              | Access     |
|--------|-----------------------|------------|
| GET    | `/api/menu/:restaurantId` | Public |
| POST   | `/api/menu`           | Restaurant |
| PUT    | `/api/menu/:id`       | Restaurant |
| DELETE | `/api/menu/:id`       | Restaurant |
| PUT    | `/api/menu/:id/toggle` | Restaurant |

### Orders
| Method | Endpoint                  | Access              |
|--------|---------------------------|---------------------|
| POST   | `/api/orders`             | Customer            |
| GET    | `/api/orders/my`          | Customer            |
| GET    | `/api/orders/:id`         | Auth (own order)    |
| PUT    | `/api/orders/:id/status`  | Restaurant/Delivery/Admin |
| PUT    | `/api/orders/:id/rate`    | Customer            |

### Delivery
| Method | Endpoint                            | Access   |
|--------|-------------------------------------|----------|
| GET    | `/api/delivery/available-orders`    | Delivery |
| GET    | `/api/delivery/my-deliveries`       | Delivery |
| GET    | `/api/delivery/earnings`            | Delivery |
| PUT    | `/api/delivery/accept/:orderId`     | Delivery |
| PUT    | `/api/delivery/update-status/:orderId` | Delivery |
| PUT    | `/api/delivery/location`            | Delivery |
| PUT    | `/api/delivery/toggle-availability` | Delivery |

### Admin
| Method | Endpoint                             | Access |
|--------|--------------------------------------|--------|
| GET    | `/api/admin/dashboard`               | Admin  |
| GET    | `/api/admin/users`                   | Admin  |
| PUT    | `/api/admin/users/:id/toggle`        | Admin  |
| GET    | `/api/admin/restaurants`             | Admin  |
| GET    | `/api/admin/restaurants/pending`     | Admin  |
| PUT    | `/api/admin/restaurants/:id/approve` | Admin  |
| GET    | `/api/admin/orders`                  | Admin  |

---

## 🔌 Socket.io Events

### Client → Server
| Event            | Payload                          | Description |
|------------------|----------------------------------|-------------|
| `join`           | `{userId, role, restaurantId}`   | Join personal rooms |
| `track_order`    | `orderId`                        | Subscribe to order updates |
| `stop_tracking`  | `orderId`                        | Unsubscribe from tracking |
| `update_location`| `{userId, lat, lng, orderId}`    | Delivery partner location |

### Server → Client
| Event                    | Triggered When |
|--------------------------|----------------|
| `new_order`              | Customer places order → restaurant receives |
| `order_status_update`    | Any status change → customer + restaurant receive |
| `delivery_location_update` | Delivery partner moves → customer receives |

---

## 🗄️ Database Schema

### User
```
name, email, password (hashed), phone, role, avatar
address { street, city, state, pincode, coordinates }
isActive, isVerified
// Delivery only:
vehicleType, vehicleNumber, isAvailable, currentLocation
totalEarnings, completedDeliveries, rating
```

### Restaurant
```
owner (ref: User), name, description, cuisine[], image
address { street, city, state, pincode, coordinates }
phone, email, openingHours, isOpen, isApproved, isActive
rating, ratingCount, totalOrders, totalRevenue
deliveryTime, minimumOrder, deliveryFee, tags[]
```

### MenuItem
```
restaurant (ref), name, description, price, discountedPrice
category, image, isVeg, isAvailable, isFeatured
rating, preparationTime, calories, allergens[], tags[]
customizations [{ name, options [{ name, price }] }]
```

### Order
```
orderNumber (auto), customer (ref), restaurant (ref), deliveryPartner (ref)
items [{ menuItem, name, price, quantity, customizations, image }]
status (enum: 9 states), statusHistory []
deliveryAddress, paymentMethod, paymentStatus, paymentId
pricing { subtotal, deliveryFee, tax, discount, total }
specialInstructions, estimatedDeliveryTime, actualDeliveryTime
cancellationReason, rating, review
```

---

## 💳 Payment Integration (Stripe)

1. Add your Stripe secret key to `backend/.env`
2. Add your Stripe publishable key to `frontend/src`:

```javascript
// In CartPage.js or a new PaymentPage.js
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe('pk_test_your_publishable_key');
```

3. Call `/api/payments/create-intent` with `{ amount }` to get a client secret
4. Use Stripe's `CardElement` to complete payment
5. Verify with `/api/payments/verify`

---

## 📱 Key Features Walkthrough

### Customer Flow
1. Register/login → browse restaurants on home page
2. Search by name/cuisine, filter by rating/speed
3. Click restaurant → view menu by category
4. Add items to cart (multi-restaurant guard prevents mixing)
5. Checkout: set address, pick COD or online payment
6. Track order live with animated step progress bar
7. Rate restaurant after delivery

### Restaurant Flow
1. Register → admin approves → dashboard unlocked
2. Toggle open/closed status instantly
3. Real-time new order notifications (toast + sound-ready)
4. Accept → Confirm → Preparing → Ready workflow
5. Full menu CRUD with image URL, veg/non-veg, pricing

### Delivery Flow
1. Toggle online/offline availability
2. See pool of ready orders with pickup + dropoff details
3. Accept → Picked Up → Out for Delivery → Delivered
4. Earnings tracked automatically (80% of delivery fee)

### Admin Flow
1. Dashboard with weekly bar chart trend
2. Approve/reject pending restaurant registrations
3. Deactivate/reactivate any user
4. Monitor all orders with full status + payment info

---

## 🔧 Extending the App

### Add Push Notifications
```javascript
// In socketHandlers.js, emit to specific user
io.to(`user_${userId}`).emit('notification', { title, body });

// On frontend, use react-hot-toast or a notification library
```

### Add Image Uploads (Multer + Cloudinary)
```bash
npm install cloudinary multer-storage-cloudinary --prefix backend
```

```javascript
// Create middleware/upload.js
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// Configure and export upload middleware
```

### Add Google Maps Integration
```bash
npm install @react-google-maps/api --prefix frontend
```

Replace the static address display in `OrderTracking.js` with a live `GoogleMap` component.

### Add Razorpay (Indian Payments)
```bash
npm install razorpay --prefix backend
```

```javascript
// In routes/payments.js
const Razorpay = require('razorpay');
const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_SECRET });
```

---

## 🛡️ Security Checklist

- ✅ Passwords hashed with bcryptjs (salt rounds: 12)
- ✅ JWT tokens with expiry (7d default)
- ✅ Role-based authorization middleware on every route
- ✅ Automatic token removal on 401 response
- ✅ CORS configured for specific client origin
- ✅ User deactivation without data deletion
- ⬜ Rate limiting (add `express-rate-limit`)
- ⬜ Input validation (add `express-validator` rules)
- ⬜ Helmet.js for HTTP headers
- ⬜ MongoDB injection protection (mongoose sanitizes by default)

---

## 🚢 Production Deployment

### Backend (Railway / Render / Heroku)
```bash
# Set environment variables in your hosting dashboard
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=production_secret_min_32_chars
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### Frontend (Vercel / Netlify)
```bash
# Build the React app
npm run build --prefix frontend

# Set environment variable
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

In `frontend/package.json`, remove the `"proxy"` field and update `api.js`:
```javascript
const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });
```

---

## 📦 Tech Stack Summary

| Layer        | Technology               |
|--------------|--------------------------|
| Frontend     | React 18, React Router 6 |
| Styling      | Tailwind CSS, Plus Jakarta Sans |
| State        | React Context API        |
| HTTP Client  | Axios                    |
| Real-time    | Socket.io (client + server) |
| Backend      | Node.js, Express 4       |
| Database     | MongoDB, Mongoose 7      |
| Auth         | JWT (jsonwebtoken + bcryptjs) |
| Payments     | Stripe                   |
| Dev Tools    | Nodemon, Concurrently    |

---

## 🐛 Troubleshooting

**"Cannot connect to MongoDB"**
- Ensure MongoDB is running: `mongod --dbpath /data/db`
- Or use Atlas and check your IP whitelist

**"Port 5000 already in use"**
- Change `PORT` in `.env` or kill the process: `lsof -ti:5000 | xargs kill`

**"Token invalid" after seed**
- Clear browser localStorage and log in again

**Frontend shows blank page**
- Ensure `npm install --prefix frontend` completed without errors
- Check browser console for specific errors

**Socket.io not connecting**
- Ensure backend is running on port 5000
- Check CORS `CLIENT_URL` matches your frontend URL exactly

---

*Built with ❤️ — FooDash v1.0.0*
