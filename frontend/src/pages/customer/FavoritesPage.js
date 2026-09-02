import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import EmptyState from '../../components/common/EmptyState';
import FavoriteButton from '../../components/customer/FavoriteButton';
import { RestaurantGridSkeleton } from '../../components/common/Skeletons';
import { Star, Clock, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../components/common';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${localStorage.getItem('foodash_token')}` },
    })
      .then(r => r.json())
      .then(d => setRestaurants(d.favorites || []))
      .catch(() => toast.error('Failed to load favourites'))
      .finally(() => setLoading(false));
  }, []);

  const handleUnfavorite = (restaurantId) => {
    setRestaurants(prev => prev.filter(r => r._id !== restaurantId));
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">❤️ My Favourites</h1>
          <p className="text-sm text-gray-400 mt-1">{restaurants.length} saved restaurant{restaurants.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <RestaurantGridSkeleton count={6} />
        ) : restaurants.length === 0 ? (
          <EmptyState
            type="favorites"
            action={<Link to="/customer" className="btn-primary">Browse Restaurants</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurants.map(r => (
              <div key={r._id} className="card group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative">
                {/* Favourite button — top right */}
                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton
                    restaurantId={r._id}
                    size="sm"
                    onToggle={(isFav) => { if (!isFav) handleUnfavorite(r._id); }}
                  />
                </div>

                <Link to={`/customer/restaurant/${r._id}`}>
                  <div className="h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                    {r.image
                      ? <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                    }
                    {!r.isOpen && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-gray-700 text-sm font-bold px-4 py-1.5 rounded-full">Closed</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{r.name}</h3>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{r.cuisine?.join(' · ')}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {r.rating > 0 ? r.rating.toFixed(1) : 'New'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{r.deliveryTime}
                      </span>
                      <span>Min ₹{r.minimumOrder}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}