import React, { useState } from 'react';
import { Star, Camera, X, ThumbsUp, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const REVIEW_TAGS = [
  'Fresh food', 'Tasty', 'Good packaging', 'Fast delivery',
  'Polite rider', 'On time', 'Worth the price', 'Large portions',
  'Good presentation', 'Would order again',
];

// ── Star Rating Input ─────────────────────────────────────────────────────────
export function StarRating({ value, onChange, size = 'md', label }) {
  const [hover, setHover] = useState(0);
  const s = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div>
      {label && <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</p>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star className={`${s} transition-colors ${
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-200 dark:text-gray-700'
            }`} />
          </button>
        ))}
        {value > 0 && (
          <span className="text-sm font-bold text-amber-500 ml-1 self-center">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Write Review Form ─────────────────────────────────────────────────────────
export function WriteReviewForm({ orderId, restaurantName, deliveryPartnerName, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    foodRating: 0, deliveryRating: 0, overallRating: 0,
    comment: '', tags: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleTag = (tag) => {
    setForm(p => ({
      ...p,
      tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
    }));
  };

  const handleSubmit = async () => {
    if (!form.overallRating) return toast.error('Please rate your overall experience');
    if (!form.foodRating) return toast.error('Please rate the food');
    setSubmitting(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('foodash_token')}`,
        },
        body: JSON.stringify({ orderId, ...form }),
      }).then(r => r.json());
      setDone(true);
      toast.success('Review submitted! Thank you 🙏');
      onSubmit?.();
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-gray-900 dark:text-gray-100">Review Submitted!</p>
        <p className="text-sm text-gray-400 mt-1">Thank you for your feedback</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Rate your experience</p>
        <p className="text-xs text-gray-400">Order from <span className="font-semibold">{restaurantName}</span></p>
      </div>

      {/* Overall */}
      <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4">
        <StarRating label="Overall Experience *" value={form.overallRating} onChange={v => setForm(p => ({ ...p, overallRating: v }))} size="lg" />
      </div>

      {/* Food + Delivery */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-3">
          <StarRating label="Food Quality *" value={form.foodRating} onChange={v => setForm(p => ({ ...p, foodRating: v }))} />
        </div>
        <div className="card p-3">
          <StarRating label="Delivery" value={form.deliveryRating} onChange={v => setForm(p => ({ ...p, deliveryRating: v }))} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">What did you like?</p>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                form.tags.includes(tag)
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Write a review (optional)
        </label>
        <textarea
          value={form.comment}
          onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
          className="input resize-none text-sm"
          rows={3}
          placeholder="Tell others about your experience..."
          maxLength={500}
        />
        <p className="text-right text-xs text-gray-400 mt-0.5">{form.comment.length}/500</p>
      </div>

      <div className="flex gap-2">
        {onCancel && <button onClick={onCancel} className="btn-secondary flex-1">Skip</button>}
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Submit Review
        </button>
      </div>
    </div>
  );
}

// ── Review Display Card ───────────────────────────────────────────────────────
export function ReviewCard({ review }) {
  return (
    <div className="py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {review.customer?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{review.customer?.name || 'Customer'}</p>
            <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{review.overallRating}</span>
          {review.isVerified && <span className="badge badge-green text-xs ml-1">✓ Verified</span>}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">{review.comment}</p>
      )}

      {review.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {review.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400">
        {review.foodRating && <span>Food: {'⭐'.repeat(review.foodRating)}</span>}
        {review.deliveryRating && <span>Delivery: {'⭐'.repeat(review.deliveryRating)}</span>}
      </div>
    </div>
  );
}

// ── Reviews Summary Bar ───────────────────────────────────────────────────────
export function ReviewsSummary({ rating, ratingCount, breakdown = [] }) {
  const total = breakdown.reduce((s, b) => s + b.count, 0) || 1;

  return (
    <div className="flex gap-6 items-start">
      <div className="text-center shrink-0">
        <p className="font-display text-5xl font-bold text-gray-900 dark:text-gray-100">{rating?.toFixed(1) || '—'}</p>
        <div className="flex justify-center gap-0.5 my-1">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
          ))}
        </div>
        <p className="text-xs text-gray-400">{ratingCount} reviews</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5,4,3,2,1].map(star => {
          const entry = breakdown.find(b => b._id === star);
          const count = entry?.count || 0;
          const pct = (count / total) * 100;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-2">{star}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div className="bg-amber-400 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-4">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}