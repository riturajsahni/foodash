import React, { useState, useEffect } from 'react';
import { walletAPI, loyaltyAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, formatCurrency } from '../../components/common';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
  Award,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import RazorpayCheckout from '../../components/customer/RazorpayCheckout';
import { useAuth } from '../../contexts/AuthContext';

const TIER_CONFIG = {
  bronze:   { color: 'from-amber-700 to-amber-500',   label: '🥉 Bronze',   next: 500 },
  silver:   { color: 'from-gray-400 to-gray-300',      label: '🥈 Silver',   next: 2000 },
  gold:     { color: 'from-yellow-500 to-amber-400',   label: '🥇 Gold',     next: 5000 },
  platinum: { color: 'from-indigo-500 to-purple-500',  label: '💎 Platinum', next: null },
};

export default function WalletPage() {
  const [wallet, setWallet] = useState({
  balance: 0,
  transactions: [],
  loyaltyPoints: 0,
  });
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [tab, setTab] = useState('wallet'); // wallet | loyalty
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const { user } = useAuth();
  

  useEffect(() => {
    Promise.all([walletAPI.get(), loyaltyAPI.get()])
      .then(([w, l]) => {
        setWallet({
          balance: w.data.balance || 0,
          transactions: w.data.transactions || []
        });

        setLoyalty(l.data);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  

  const handleRedeem = async () => {
    const pts = parseInt(redeemPoints);
    if (!pts || pts < 10) return toast.error('Minimum 10 points');
    setRedeeming(true);
    try {
      const res = await loyaltyAPI.redeem({ points: pts });
      setLoyalty(prev => ({ ...prev, loyalty: res.data.loyalty, rupeesValue: res.data.loyalty.points * 0.5 }));
      setRedeemPoints('');
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRedeeming(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner size="lg" /></div>;

  const tier = TIER_CONFIG[loyalty?.loyalty?.tier || 'bronze'];
  const totalEarned = loyalty?.loyalty?.totalEarned || 0;
  const nextTierPoints = tier.next;
  const progress = nextTierPoints ? Math.min((totalEarned / nextTierPoints) * 100, 100) : 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="font-display text-2xl font-bold text-gray-900">Wallet & Rewards</h1>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {[{ value: 'wallet', label: '💳 Wallet' }, { value: 'loyalty', label: '⭐ Loyalty Points' }].map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'wallet' && wallet && (
          <>
            {/* Balance card */}
            <div className="card p-6 bg-gradient-to-br from-brand-500 to-orange-400 text-white">
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <WalletIcon className="w-4 h-4" /> <span className="text-sm">Wallet Balance</span>
              </div>
              <p className="font-display text-4xl font-bold">{formatCurrency(wallet.balance)}</p>
              <p className="text-sm opacity-70 mt-1">{wallet.transactions.length} transactions</p>
            </div>

            {/* Add Money */}
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Add Money to Wallet</h3>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAddAmount(String(amt))}
                      className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                        addAmount === String(amt)
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <input
                  type="number"
                  value={addAmount}
                  onChange={e => setAddAmount(e.target.value)}
                  className="input text-sm mb-4"
                  placeholder="Or enter custom amount (min ₹10)"
                  min={10}
                />

                {/* Razorpay button — only show if valid amount */}
                {parseFloat(addAmount) >= 10 ? (

                  <RazorpayCheckout

                    amount={parseFloat(addAmount)}

                    customerName={user?.name}

                    customerEmail={user?.email}

                    customerPhone={user?.phone}

                    onSuccess={async (paymentId) => {

                      try {

                        const res =
                          await walletAPI.addMoney({

                            amount:
                              parseFloat(addAmount),

                            paymentId,
                          });

                        setWallet({
                          balance: res.data.balance || 0,
                          transactions: res.data.transactions || []
                        });

                        setAddAmount('');

                        toast.success(
                          `₹${addAmount} added to your wallet! 🎉`
                        );

                      } catch {

                        toast.error(
                          'Payment done but wallet update failed.'
                        );
                      }
                    }}

                    onFailure={() => {

                      toast.error(
                        'Payment failed or cancelled'
                      );
                    }}

                  />

                ) : (
                  <button
                    disabled
                    className="btn-primary w-full opacity-50 cursor-not-allowed"
                  >
                    Enter amount to continue
                  </button>
                )}

                <p className="text-xs text-center text-gray-400 mt-3">
                  Money added instantly · Secure payment via Razorpay
                </p>
              </div>

            {/* Transaction history */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-3">Transaction History</h3>
              {wallet.transactions.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {[...wallet.transactions].reverse().slice(0, 20).map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                          {t.type === 'credit'
                            ? <ArrowDownLeft className="w-4 h-4 text-green-500" />
                            : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.description}</p>
                          <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                          {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <p className="text-xs text-gray-400">Bal: {formatCurrency(t.balanceAfter)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'loyalty' && loyalty && (
          <>
            {/* Tier card */}
            <div className={`card p-6 bg-gradient-to-br ${tier.color} text-white`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm opacity-80">Your Tier</p>
                  <p className="font-display text-2xl font-bold">{tier.label}</p>
                </div>
                <Award className="w-10 h-10 opacity-80" />
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-3xl font-bold">{loyalty.loyalty?.points || 0}</p>
                  <p className="text-sm opacity-70">points available</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(loyalty.rupeesValue || 0)}</p>
                  <p className="text-sm opacity-70">redeemable value</p>
                </div>
              </div>
              {nextTierPoints && (
                <>
                  <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                    <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs opacity-70">{totalEarned} / {nextTierPoints} points to next tier</p>
                </>
              )}
            </div>

            {/* How it works */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />How Points Work</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {[
                  ['Earn', 'Every ₹50 spent = 1 point'],
                  ['Redeem', '10 points = ₹5 discount'],
                  ['Silver', '500+ points total earned'],
                  ['Gold', '2000+ points total earned'],
                  ['Platinum', '5000+ points total earned'],
                ].map(([label, desc]) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700 w-20 shrink-0">{label}</span>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Redeem */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-3">Redeem Points</h3>
              <p className="text-xs text-gray-400 mb-3">Min 10 points · Applied at checkout as discount</p>
              <div className="flex gap-2">
                <input type="number" value={redeemPoints} onChange={e => setRedeemPoints(e.target.value)}
                  className="input text-sm flex-1" placeholder="Points to redeem (min 10)" min={10} max={loyalty.loyalty?.points} />
                <button onClick={handleRedeem} disabled={redeeming || !redeemPoints || parseInt(redeemPoints) < 10}
                  className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                  {redeeming ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Star className="w-4 h-4" />}
                  Redeem
                </button>
              </div>
              {redeemPoints >= 10 && (
                <p className="text-xs text-green-600 mt-1.5 font-medium">
                  = {formatCurrency(parseInt(redeemPoints) * 0.5)} discount at checkout
                </p>
              )}
            </div>

            {/* Points history */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-3">Points History</h3>
              {!loyalty.loyalty?.history?.length ? (
                <p className="text-center text-gray-400 py-6 text-sm">No history yet. Place an order to earn points!</p>
              ) : (
                <div className="space-y-2">
                  {[...loyalty.loyalty.history].reverse().slice(0, 15).map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{h.description}</p>
                        <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                      <span className={`font-bold text-sm ${h.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                        {h.type === 'earn' ? '+' : '-'}{h.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
