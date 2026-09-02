import React from 'react';
import { ShoppingBag, Package, UtensilsCrossed, Search, Heart, Bell, Star } from 'lucide-react';

const PRESETS = {
  orders: {
    icon: Package,
    emoji: '📦',
    title: 'No orders yet',
    subtitle: "You haven't placed any orders yet. Hungry? Browse restaurants and order now!",
  },
  cart: {
    icon: ShoppingBag,
    emoji: '🛒',
    title: 'Your cart is empty',
    subtitle: 'Add items from a restaurant to get started.',
  },
  restaurants: {
    icon: UtensilsCrossed,
    emoji: '🍽️',
    title: 'No restaurants found',
    subtitle: 'Try adjusting your search or filters.',
  },
  search: {
    icon: Search,
    emoji: '🔍',
    title: 'No results found',
    subtitle: 'Try different keywords or browse all restaurants.',
  },
  favorites: {
    icon: Heart,
    emoji: '❤️',
    title: 'No favourites yet',
    subtitle: "Tap the heart on any restaurant to save it here.",
  },
  notifications: {
    icon: Bell,
    emoji: '🔔',
    title: 'No notifications',
    subtitle: "You're all caught up! Notifications will appear here.",
  },
  reviews: {
    icon: Star,
    emoji: '⭐',
    title: 'No reviews yet',
    subtitle: 'Be the first to review this restaurant!',
  },
};

export default function EmptyState({ type, icon: CustomIcon, emoji, title, subtitle, action, className = '' }) {
  const preset = type ? PRESETS[type] : null;
  const Icon = CustomIcon || preset?.icon;
  const displayEmoji = emoji || preset?.emoji;
  const displayTitle = title || preset?.title || 'Nothing here';
  const displaySubtitle = subtitle || preset?.subtitle;

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center px-6 ${className}`}>
      {/* Animated illustration */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-bounce-in">
          {displayEmoji
            ? <span className="text-4xl">{displayEmoji}</span>
            : Icon ? <Icon className="w-10 h-10 text-gray-300 dark:text-gray-600" /> : null
          }
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-100 dark:bg-brand-900/40 rounded-full" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-100 dark:bg-orange-900/40 rounded-full" />
      </div>

      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">{displayTitle}</h3>

      {displaySubtitle && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed mb-5">
          {displaySubtitle}
        </p>
      )}

      {action && <div className="animate-fade-in">{action}</div>}
    </div>
  );
}