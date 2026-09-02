import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FavoriteButton({ restaurantId, size = 'md', className = '' }) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    fetch(`/api/favorites/${restaurantId}/check`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('foodash_token')}` },
    })
      .then(r => r.json())
      .then(d => setIsFav(d.isFavorited))
      .catch(() => {});
  }, [restaurantId]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/favorites/${restaurantId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('foodash_token')}` },
      }).then(r => r.json());
      setIsFav(res.isFavorited);
      toast(res.isFavorited ? '❤️ Added to favourites' : '💔 Removed from favourites', { duration: 1500 });
    } catch {
      toast.error('Failed to update favourites');
    } finally {
      setLoading(false);
    }
  };

  const s = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconS = size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`${s} rounded-full flex items-center justify-center transition-all active:scale-90
        ${isFav
          ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-400 hover:text-red-400'}
        ${className}`}
      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Heart className={`${iconS} transition-all ${isFav ? 'fill-red-500' : ''} ${loading ? 'animate-pulse' : ''}`} />
    </button>
  );
}