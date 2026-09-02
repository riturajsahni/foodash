import axios from 'axios';

// Backend URL
const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    'https://foodash-backend-v2.onrender.com/api',
  withCredentials: true,
});

// Attach JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodash_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle unauthorized responses
API.interceptors.response.use(
  (res) => res,

  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('foodash_token');
      localStorage.removeItem('foodash_user');

      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

// ================= AUTH =================

export const authAPI = {
  register: (data) =>
    API.post('/auth/register', data),

  login: (data) =>
    API.post('/auth/login', data),

  getMe: () =>
    API.get('/auth/me'),

  updateProfile: (data) =>
    API.put('/auth/profile', data),

  changePassword: (data) =>
    API.put('/auth/change-password', data),
};

// ================= RESTAURANTS =================

export const restaurantAPI = {
  getAll: (params) =>
    API.get('/restaurants', { params }),

  getOne: (id) =>
    API.get(`/restaurants/${id}`),

  register: (data) =>
    API.post('/restaurants/register', data),

  getMyProfile: () =>
    API.get('/restaurants/my/profile'),

  updateProfile: (data) =>
    API.put('/restaurants/my/profile', data),

  toggleStatus: () =>
    API.put('/restaurants/my/toggle-status'),

  getOrders: (params) =>
    API.get('/restaurants/my/orders', { params }),

  getAnalytics: () =>
    API.get('/restaurants/my/analytics'),
};

// ================= MENU =================

export const menuAPI = {
  getItems: (restaurantId) =>
    API.get(`/menu/${restaurantId}`),

  addItem: (data) =>
    API.post('/menu', data),

  updateItem: (id, data) =>
    API.put(`/menu/${id}`, data),

  deleteItem: (id) =>
    API.delete(`/menu/${id}`),

  toggleAvailability: (id) =>
    API.put(`/menu/${id}/toggle`),
};

// ================= ORDERS =================

export const orderAPI = {
  place: (data) =>
    API.post('/orders', data),

  getMy: (params) =>
    API.get('/orders/my', { params }),

  getOne: (id) =>
    API.get(`/orders/${id}`),

  updateStatus: (id, data) =>
    API.put(`/orders/${id}/status`, data),

  rate: (id, data) =>
    API.put(`/orders/${id}/rate`, data),
};

// ================= DELIVERY =================

export const deliveryAPI = {
  getAvailable: () =>
    API.get('/delivery/available-orders'),

  getMyDeliveries: (params) =>
    API.get('/delivery/my-deliveries', { params }),

  getEarnings: () =>
    API.get('/delivery/earnings'),

  acceptDelivery: (orderId) =>
    API.put(`/delivery/accept/${orderId}`),

  updateStatus: (orderId, data) =>
    API.put(`/delivery/update-status/${orderId}`, data),

  updateLocation: (data) =>
    API.put('/delivery/location', data),

  toggleAvailability: () =>
    API.put('/delivery/toggle-availability'),
};

  // ================= DELIVERY ASSIGNMENT =================

  export const deliveryAssignmentAPI = {
    // Rider actions
    accept: (orderId) =>
      API.post(`/delivery-assignment/${orderId}/accept`),

    reject: (orderId) =>
      API.post(`/delivery-assignment/${orderId}/reject`),

    // Status
    getStatus: (orderId) =>
      API.get(`/delivery-assignment/${orderId}/status`),

    // Admin
    reassign: (orderId, resetAttempts = false) =>
      API.post(`/delivery-assignment/${orderId}/reassign`, {
        resetAttempts,
      }),

    previewNearby: (restaurantId) =>
      API.get('/delivery-assignment/nearby-preview', {
        params: { restaurantId },
      }),
  };

// ================= ADMIN =================

export const adminAPI = {
  getDashboard: () =>
    API.get('/admin/dashboard'),

  getUsers: (params) =>
    API.get('/admin/users', { params }),

  toggleUser: (id) =>
    API.put(`/admin/users/${id}/toggle`),

  getRestaurants: (params) =>
    API.get('/admin/restaurants', { params }),

  getPendingRestaurants: () =>
    API.get('/admin/restaurants/pending'),

  approveRestaurant: (id, data) =>
    API.put(`/admin/restaurants/${id}/approve`, data),

  getOrders: (params) =>
    API.get('/admin/orders', { params }),
};

// ================= PAYMENTS =================

// Existing APIs
export const paymentAPI = {
  createIntent: (data) => API.post('/payments/create-intent', data),
  verify: (data) => API.post('/payments/verify', data),
};

// ================= NEW FEATURE APIs =================

// Coupons
export const couponAPI = {
  validate: (data) => API.post('/coupons/validate', data),
  getAvailable: () => API.get('/coupons/available'),
  adminGet: () => API.get('/coupons/admin'),
  adminCreate: (data) => API.post('/coupons/admin', data),
  adminUpdate: (id, data) => API.put(`/coupons/admin/${id}`, data),
  adminDelete: (id) => API.delete(`/coupons/admin/${id}`),
};

// Wallet
export const walletAPI = {
  get: () => API.get('/wallet'),
  addMoney: (data) => API.post('/wallet/add-money', data),
  refund: (data) => API.post('/wallet/refund', data),
};

// Loyalty
export const loyaltyAPI = {
  get: () => API.get('/loyalty'),
  redeem: (data) => API.post('/loyalty/redeem', data),
};

// Notifications
export const notificationAPI = {
  get: (params) => API.get('/notifications', { params }),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
  clear: () => API.delete('/notifications/clear'),
};

// Recommendations
export const recommendAPI = {
  peopleAlsoOrdered: (restaurantId) =>
    API.get('/recommendations/items', {
      params: { restaurantId },
    }),

  forYou: () => API.get('/recommendations/for-you'),

  trending: () => API.get('/recommendations/trending'),
};

// Analytics
export const analyticsAPI = {
  revenue: (params) =>
    API.get('/admin/analytics/revenue', { params }),

  topItems: (params) =>
    API.get('/admin/analytics/top-items', { params }),

  topRestaurants: (params) =>
    API.get('/admin/analytics/top-restaurants', { params }),

  retention: () =>
    API.get('/admin/analytics/customer-retention'),

  paymentBreakdown: () =>
    API.get('/admin/analytics/payment-breakdown'),
};

// Invoice
export const invoiceAPI = {
  download: (orderId) =>
    API.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
    }),
};

export default API;

