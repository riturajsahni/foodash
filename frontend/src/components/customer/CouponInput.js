import React, { useState } from 'react';
import { Tag, X, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { couponAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CouponInput({ subtotal, restaurantId, onApply }) {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const handleApply = async (inputCode) => {
    const c = (inputCode || code).toUpperCase().trim();
    if (!c) return toast.error('Enter a coupon code');
    setLoading(true);
    try {
      const res = await couponAPI.validate({ code: c, orderTotal: subtotal, restaurantId });
      setApplied({ code: c, discount: res.data.discount, description: res.data.coupon.description });
      onApply(res.data.discount, c);
      setCode('');
      toast.success(`✅ Coupon applied! You save ₹${res.data.discount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally { setLoading(false); }
  };

  const handleRemove = () => {
    setApplied(null);
    onApply(0, null);
  };

  const fetchAvailable = async () => {
    if (availableCoupons.length > 0) { setShowList(!showList); return; }
    setLoadingList(true);
    try {
      const res = await couponAPI.getAvailable();
      setAvailableCoupons(res.data.coupons);
      setShowList(true);
    } catch { toast.error('Could not load coupons'); }
    finally { setLoadingList(false); }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <div>
            <span className="font-bold text-green-700 text-sm">{applied.code}</span>
            <p className="text-xs text-green-600">{applied.description || `Saving ₹${applied.discount}`}</p>
          </div>
        </div>
        <button onClick={handleRemove} className="text-green-600 hover:text-red-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            className="input pl-9 text-sm uppercase tracking-wider font-mono"
            placeholder="Enter coupon code"
          />
        </div>
        <button
          onClick={() => handleApply()}
          disabled={loading || !code}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-1 whitespace-nowrap"
        >
          {loading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Apply'}
        </button>
      </div>

      <button
        onClick={fetchAvailable}
        className="flex items-center gap-1.5 text-xs text-brand-500 font-semibold hover:text-brand-700 transition-colors"
      >
        {loadingList ? <div className="w-3 h-3 border border-brand-500 border-t-transparent rounded-full animate-spin" /> : <Tag className="w-3 h-3" />}
        View available coupons
        {showList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showList && availableCoupons.length > 0 && (
        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
          {availableCoupons.map(c => (
            <div key={c._id} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors">
              <div>
                <span className="font-mono font-bold text-sm text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{c.code}</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {c.type === 'percentage' ? `${c.value}% off` : `₹${c.value} off`}
                  {c.minOrderValue > 0 ? ` · Min ₹${c.minOrderValue}` : ''}
                  {c.maxDiscount > 0 ? ` · Max ₹${c.maxDiscount}` : ''}
                </p>
                <p className="text-xs text-gray-400">Expires {new Date(c.expiresAt).toLocaleDateString('en-IN')}</p>
              </div>
              <button
                onClick={() => { setCode(c.code); handleApply(c.code); setShowList(false); }}
                className="text-xs font-bold text-brand-500 hover:text-brand-700 px-3 py-1 border border-brand-200 hover:border-brand-400 rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      )}
      {showList && availableCoupons.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">No coupons available right now</p>
      )}
    </div>
  );
}
