import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('foodash_token');
    if (token) {
      authAPI.getMe()
        .then(res => {
          setUser(res.data.user);
          setRestaurant(res.data.restaurant);
        })
        .catch(() => {
          localStorage.removeItem('foodash_token');
          localStorage.removeItem('foodash_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user, restaurant } = res.data;
    localStorage.setItem('foodash_token', token);
    localStorage.setItem('foodash_user', JSON.stringify(user));
    setUser(user);
    setRestaurant(restaurant);
    return user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token, user } = res.data;
    localStorage.setItem('foodash_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('foodash_token');
    localStorage.removeItem('foodash_user');
    setUser(null);
    setRestaurant(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);
  const updateRestaurant = (updatedRestaurant) => setRestaurant(updatedRestaurant);

  return (
    <AuthContext.Provider value={{ user, restaurant, loading, login, register, logout, updateUser, updateRestaurant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
