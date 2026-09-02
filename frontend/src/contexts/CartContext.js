import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');

  const addItem = useCallback((item, restaurant) => {
    if (restaurantId && restaurantId !== restaurant._id) {
      const clear = window.confirm('Your cart has items from another restaurant. Clear cart?');
      if (!clear) return false;
      setItems([]);
    }
    setRestaurantId(restaurant._id);
    setRestaurantName(restaurant.name);
    setItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    return true;
  }, [restaurantId]);

  const removeItem = useCallback((itemId) => {
    setItems(prev => {
      const updated = prev.map(i => i._id === itemId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
      if (updated.length === 0) { setRestaurantId(null); setRestaurantName(''); }
      return updated;
    });
  }, []);

  const deleteItem = useCallback((itemId) => {
    setItems(prev => {
      const updated = prev.filter(i => i._id !== itemId);
      if (updated.length === 0) { setRestaurantId(null); setRestaurantName(''); }
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]); setRestaurantId(null); setRestaurantName('');
  }, []);

  const subtotal = items.reduce((s, i) => s + (i.discountedPrice || i.price) * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, restaurantId, restaurantName, addItem, removeItem, deleteItem, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
