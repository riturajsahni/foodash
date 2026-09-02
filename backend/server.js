require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://foodash-1.vercel.app'
];

const server = http.createServer(app);


const cookieParser = require('cookie-parser');
app.use(cookieParser());

const passport = require('./config/passport');
app.use(passport.initialize());

// ================= SOCKET.IO =================

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// ================= MIDDLEWARE =================

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Attach socket io to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ================= ROUTES =================

 // Existing routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/googleAuth'));

app.use('/api/restaurants', require('./routes/restaurants'));

app.use('/api/menu', require('./routes/menu'));

app.use('/api/orders', require('./routes/orders'));

// Add these 3 new route registrations
app.use('/api/profile',  require('./routes/profile'));
app.use('/api/reports',  require('./routes/reports'));



app.use('/api/delivery', require('./routes/delivery'));

app.use('/api/admin', require('./routes/admin'));

app.use('/api/payments', require('./routes/payments'));

app.use('/api/users', require('./routes/users'));

// ================= NEW FEATURE ROUTES =================

app.use('/api/coupons', require('./routes/coupons'));

app.use('/api/wallet', require('./routes/wallet'));

app.use('/api/loyalty', require('./routes/loyalty'));

app.use('/api/notifications', require('./routes/notifications'));

app.use('/api/recommendations', require('./routes/recommendations'));

app.use('/api/admin/analytics', require('./routes/analytics'));

app.use('/api/orders/:id/invoice', require('./routes/invoice'));

// ================= FAVORITES + REVIEWS =================

app.use('/api/favorites', require('./routes/favorites'));

app.use('/api/reviews', require('./routes/reviews'));

// ================= SOCKET EVENTS =================

require('./socket/socketHandlers')(io);

// ================= HEALTH CHECK =================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
  });
});

// // ================= ERROR HANDLER =================

 app.use((err, req, res, next) => {
   console.error(err.stack);

   res.status(err.status || 500).json({
     success: false,
     message: err.message || 'Internal Server Error',
   });
 });

// ================= DATABASE + SERVER =================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB connection error:', err);

    process.exit(1);
  });

module.exports = { app, io };




