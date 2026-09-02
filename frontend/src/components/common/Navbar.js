import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n, LanguageToggle } from '../../utils/i18n';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import {
  ShoppingCart, User, LogOut, Menu, X,
  ChefHat, Truck, LayoutDashboard, Heart, BarChart2
} from 'lucide-react';

const roleNavItems = {
  customer: [
    { label: 'Home',            path: '/customer' },
    { label: 'My Orders',       path: '/customer/orders' },
    { label: 'Favourites',      path: '/customer/favorites' },
    { label: 'Wallet & Rewards',path: '/customer/wallet' },
    { label: 'Profile',         path: '/customer/profile' },
  ],
  restaurant: [
    { label: 'Dashboard',  path: '/restaurant' },
    { label: 'Orders',     path: '/restaurant/orders' },
    { label: 'Menu',       path: '/restaurant/menu' },
    { label: 'Analytics',  path: '/restaurant/analytics' },
    { label: 'Profile',    path: '/restaurant/profile' },
  ],
  delivery: [
    { label: 'Dashboard',  path: '/delivery' },
    { label: 'Deliveries', path: '/delivery/orders' },
    { label: 'Earnings',   path: '/delivery/earnings' },
  ],
  admin: [
    { label: 'Dashboard',  path: '/admin' },
    { label: 'Users',      path: '/admin/users' },
    { label: 'Restaurants',path: '/admin/restaurants' },
    { label: 'Orders',     path: '/admin/orders' },
    { label: 'Analytics',  path: '/admin/analytics' },
    { label: 'Coupons',    path: '/admin/coupons' },
  ],
};

const roleAccent = {
  customer:   { dot: 'bg-brand-500',   badge: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400' },
  restaurant: { dot: 'bg-purple-600',  badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
  delivery:   { dot: 'bg-green-600',   badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  admin:      { dot: 'bg-slate-700',   badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

const RoleIcon = ({ role, className = 'w-4 h-4' }) => {
  if (role === 'restaurant') return <ChefHat className={className} />;
  if (role === 'delivery')   return <Truck className={className} />;
  if (role === 'admin')      return <LayoutDashboard className={className} />;
  return <User className={className} />;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = roleNavItems[user.role] || [];
  const accent   = roleAccent[user.role] || roleAccent.customer;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={`/${user.role}`} className="flex items-center gap-2 shrink-0">
            <div className={`${accent.dot} text-white w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm`}>
              F
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-gray-100">FooDash</span>
            <span className={`hidden sm:block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${accent.badge}`}>
              {user.role}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Cart (customer only) */}
            {user.role === 'customer' && (
              <Link to="/customer/cart" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-xs w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center font-bold text-[10px]">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications */}
            <NotificationBell />

            {/* Dark mode toggle */}
            <ThemeToggle />

            {/* Language toggle — desktop only */}
            <div className="hidden lg:block">
              <LanguageToggle />
            </div>

            {/* User info */}
            <div className="flex items-center gap-2 pl-1.5 border-l border-gray-100 dark:border-gray-800 ml-1">
              <div className={`w-8 h-8 ${accent.dot} rounded-full flex items-center justify-center text-white`}>
                <RoleIcon role={user.role} className="w-4 h-4" />
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-300 max-w-[90px] truncate">
                {user.name}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-2 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg mx-1 mb-1 ${
                  location.pathname === item.path
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* Mobile language toggle */}
            <div className="px-4 py-2">
              <LanguageToggle />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}