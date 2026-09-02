import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, formatCurrency } from '../../components/common';
import { Star, Clock, Minus, Plus, ShoppingCart, Leaf, Flame, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, removeItem, items, itemCount, subtotal } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    restaurantAPI.getOne(id)
      .then(res => {
        setRestaurant(res.data.restaurant);
        setMenu(res.data.menu);
        const cats = Object.keys(res.data.menu);
        if (cats.length) setActiveCategory(cats[0]);
      })
      .catch(() => toast.error('Failed to load restaurant'))
      .finally(() => setLoading(false));
  }, [id]);

  const getItemQty = (itemId) => items.find(i => i._id === itemId)?.qty || 0;

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner size="lg" /></div>;
  if (!restaurant) return <div className="min-h-screen bg-gray-50"><Navbar /><p className="text-center py-16 text-gray-500">Restaurant not found</p></div>;

  const categories = Object.keys(menu);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gray-200 overflow-hidden">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button onClick={() => navigate('/customer')} className="absolute top-4 left-4 bg-white/20 backdrop-blur text-white rounded-full p-2 hover:bg-white/30 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">{restaurant.name}</h1>
          <p className="text-white/80 text-sm">{restaurant.cuisine?.join(' · ')}</p>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4 text-sm text-gray-600 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-amber-600">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            {restaurant.rating > 0 ? `${restaurant.rating.toFixed(1)} (${restaurant.ratingCount})` : 'New'}
          </span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-gray-400" />{restaurant.deliveryTime}</span>
          <span>Min order: ₹{restaurant.minimumOrder}</span>
          <span>Delivery: ₹{restaurant.deliveryFee}</span>
          <span className={`badge ${restaurant.isOpen ? 'badge-green' : 'badge-red'}`}>{restaurant.isOpen ? 'Open' : 'Closed'}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Category sidebar */}
        <aside className="hidden md:block w-44 shrink-0">
          <div className="sticky top-24 space-y-1">
            {categories.map(cat => (
              <button key={cat} onClick={() => {
                setActiveCategory(cat);
                document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeCategory === cat ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {cat} <span className="text-gray-400 text-xs">({menu[cat]?.length})</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Menu items */}
        <div className="flex-1 space-y-8 min-w-0">
          {categories.map(cat => (
            <section key={cat} id={`cat-${cat}`}>
              <h2 className="font-display text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{cat}</h2>
              <div className="space-y-3">
                {menu[cat]?.map(item => {
                  const qty = getItemQty(item._id);
                  return (
                    <div key={item._id} className="card p-4 flex gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.isVeg
                            ? <span className="flex items-center gap-0.5 text-green-600 text-xs"><Leaf className="w-3 h-3" /> Veg</span>
                            : <span className="flex items-center gap-0.5 text-red-500 text-xs"><Flame className="w-3 h-3" /> Non-Veg</span>
                          }
                          {item.isFeatured && <span className="badge badge-orange">⭐ Popular</span>}
                        </div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {item.discountedPrice > 0 ? (
                            <>
                              <span className="font-bold text-gray-900">{formatCurrency(item.discountedPrice)}</span>
                              <span className="text-xs text-gray-400 line-through">{formatCurrency(item.price)}</span>
                              <span className="badge badge-green text-xs">{Math.round((1 - item.discountedPrice / item.price) * 100)}% off</span>
                            </>
                          ) : (
                            <span className="font-bold text-gray-900">{formatCurrency(item.price)}</span>
                          )}
                        </div>
                      </div>
                      {/* Image + add button */}
                      <div className="shrink-0 flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">🍛</div>
                          )}
                        </div>
                        {qty === 0 ? (
                          <button onClick={() => { addItem(item, restaurant); toast.success(`${item.name} added!`, { icon: '🛒', duration: 1500 }); }}
                            disabled={!restaurant.isOpen}
                            className="btn-primary text-xs py-1.5 px-4 w-full">
                            ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-xl px-2 py-1">
                            <button onClick={() => removeItem(item._id)} className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-brand-700 font-bold text-sm w-4 text-center">{qty}</span>
                            <button onClick={() => addItem(item, restaurant)} className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Floating cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <button onClick={() => navigate('/customer/cart')}
            className="bg-brand-500 hover:bg-brand-600 text-white rounded-2xl px-6 py-4 flex items-center gap-4 shadow-xl shadow-brand-500/30 transition-all active:scale-95">
            <div className="bg-white/20 rounded-xl w-8 h-8 flex items-center justify-center font-bold text-sm">{itemCount}</div>
            <span className="font-semibold">View Cart</span>
            <div className="ml-4 font-bold">{formatCurrency(subtotal)}</div>
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
