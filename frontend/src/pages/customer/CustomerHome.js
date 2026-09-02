import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../utils/i18n';
import { restaurantAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import EmptyState from '../../components/common/EmptyState';
import FavoriteButton from '../../components/customer/FavoriteButton';
import { TrendingSection, ForYouSection } from '../../components/customer/RecommendationSections';
import { RestaurantGridSkeleton } from '../../components/common/Skeletons';
import { useDebounce } from '../../hooks/usePerformance';
import {
  Search, Star, Clock, ChevronRight, Flame, Leaf,
  SlidersHorizontal, X, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const CUISINES = ['All', 'South Indian', 'North Indian', 'Biryani', 'Burgers', 'Pizza', 'Chinese', 'Fast Food', 'Desserts'];

const SORT_OPTIONS = [
  { value: '',           label: 'Relevance' },
  { value: 'rating',     label: '⭐ Top Rated' },
  { value: 'deliveryTime', label: '⚡ Fastest' },
];

const RATING_FILTERS = [
  { value: '',    label: 'Any Rating' },
  { value: '4.5', label: '4.5+' },
  { value: '4',   label: '4.0+' },
  { value: '3.5', label: '3.5+' },
];

export default function CustomerHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [sort, setSort] = useState('');
  const [minRating, setMinRating] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const search = useDebounce(searchInput, 400);

  const fetchRestaurants = useCallback(async (reset = true) => {
    try {
      reset ? setLoading(true) : setLoadingMore(true);
      const currentPage = reset ? 1 : page;
      const params = { page: currentPage, limit: 9 };
      if (search) params.search = search;
      if (cuisine !== 'All') params.cuisine = cuisine;
      if (sort) params.sort = sort;
      if (minRating) params.minRating = minRating;

      const res = await restaurantAPI.getAll(params);
      const data = res.data.restaurants || [];
      setRestaurants(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === 9);
      if (reset) setPage(1);
    } catch {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, cuisine, sort, minRating, page]);

  useEffect(() => { fetchRestaurants(true); }, [search, cuisine, sort, minRating]);

  const loadMore = () => {
    setPage(p => p + 1);
    fetchRestaurants(false);
  };

  const clearFilters = () => {
    setCuisine('All');
    setSort('');
    setMinRating('');
    setSearchInput('');
  };

  const hasActiveFilters = cuisine !== 'All' || sort !== '' || minRating !== '';

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-500 to-orange-400 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-1">
            Hey {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-brand-100 mb-5 text-sm">What are you craving today?</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              placeholder={t('searchPlaceholder')}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
              hasActiveFilters
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && `(${[cuisine !== 'All', sort, minRating].filter(Boolean).length})`}
          </button>

          {/* Cuisine chips */}
          {CUISINES.map(c => (
            <button
              key={c}
              onClick={() => setCuisine(c)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                cuisine === c
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="card p-4 mb-5 flex flex-wrap gap-4 items-end animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sort by</label>
              <select value={sort} onChange={e => setSort(e.target.value)} className="input text-sm w-36">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Min Rating</label>
              <select value={minRating} onChange={e => setMinRating(e.target.value)} className="input text-sm w-32">
                {RATING_FILTERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium">
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
        )}

        {/* Recommendation sections */}
        <TrendingSection />
        <ForYouSection />

        {/* All restaurants heading */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100">
            {search ? `Results for "${search}"` : cuisine !== 'All' ? cuisine : 'All Restaurants'}
          </h2>
          {!loading && <span className="text-sm text-gray-400">{restaurants.length} found</span>}
        </div>

        {/* Grid */}
        {loading ? (
          <RestaurantGridSkeleton count={6} />
        ) : restaurants.length === 0 ? (
          <EmptyState
            type={search ? 'search' : 'restaurants'}
            action={hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
            )}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restaurants.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn-secondary flex items-center gap-2 mx-auto"
                >
                  {loadingMore
                    ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    : <TrendingUp className="w-4 h-4" />}
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant: r }) {
  return (
    <div className="card group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative">
      {/* Favourite button */}
      <div className="absolute top-3 right-3 z-10">
        <FavoriteButton restaurantId={r._id} size="sm" />
      </div>

      <Link to={`/customer/restaurant/${r._id}`}>
        <div className="relative h-44 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {r.image
            ? <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
          }
          {!r.isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-700 text-sm font-bold px-4 py-1.5 rounded-full">Closed</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {r.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="badge bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 backdrop-blur-sm text-xs">
                {tag === 'Popular' && <Flame className="w-3 h-3 text-orange-500" />}
                {tag === 'Veg'     && <Leaf  className="w-3 h-3 text-green-500" />}
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{r.name}</h3>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="text-xs text-gray-400 mb-3">{r.cuisine?.join(' · ')}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {r.rating > 0 ? r.rating.toFixed(1) : 'New'}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.deliveryTime}</span>
            <span>Min ₹{r.minimumOrder}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}