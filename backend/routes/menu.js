// routes/menu.js

const express = require('express');

const menuRouter = express.Router();

const {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require('../controllers/menuController');

const {
  protect,
  authorize,
} = require('../middleware/auth');

menuRouter.get('/:restaurantId', getMenuItems);

menuRouter.post(
  '/',
  protect,
  authorize('restaurant'),
  addMenuItem
);

menuRouter.put(
  '/:id',
  protect,
  authorize('restaurant'),
  updateMenuItem
);

menuRouter.delete(
  '/:id',
  protect,
  authorize('restaurant'),
  deleteMenuItem
);

menuRouter.put(
  '/:id/toggle',
  protect,
  authorize('restaurant'),
  toggleAvailability
);

module.exports = menuRouter;