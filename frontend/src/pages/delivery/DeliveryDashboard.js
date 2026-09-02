// DeliveryDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { deliveryAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, StatCard, EmptyState, formatCurrency } from '../../components/common';
import { Bike, DollarSign, Package, ToggleLeft, ToggleRight, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeliveryOffers } from '../../hooks/useDeliveryOffers';
import { useRiderLocationBroadcast } from '../../hooks/useRiderLocationBroadcast';
import DeliveryOfferModal from '../../components/delivery/DeliveryOfferModal';

export const DeliveryDashboard = () => {
  const { user, updateUser } = useAuth();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [toggling, setToggling] = useState(false);
  const {activeOffer,queueLength,responding,accept: acceptOffer,reject: rejectOffer,} = useDeliveryOffers(user?._id);
  const socketRef = require('../../contexts/SocketContext').useSocket();


  useRiderLocationBroadcast(user?._id, user?.isAvailable);

  useEffect(() => {
    Promise.all([deliveryAPI.getAvailable(), deliveryAPI.getEarnings()])
      .then(([o, e]) => { setAvailableOrders(o.data.orders); setEarnings(e.data.earnings); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);


    const toggleAvailability = async () => {
      setToggling(true);

      try {
        const res = await deliveryAPI.toggleAvailability();

        const nowAvailable = res.data.isAvailable;

        updateUser({
          ...user,
          isAvailable: nowAvailable,
        });

        const socket = socketRef?.current;

        if (socket) {
          socket.emit(
            nowAvailable ? 'rider:go_online' : 'rider:go_offline',
            {
              riderId: user._id,
            }
          );
        }

        toast.success(
          nowAvailable
            ? 'You are now Online 🟢'
            : 'You are now Offline 🔴'
        );
      } catch {
        toast.error('Failed');
      } finally {
        setToggling(false);
      }
    };

  const acceptDelivery = async (orderId) => {
    setAccepting(orderId);
    try {
      await deliveryAPI.acceptDelivery(orderId);
      setAvailableOrders(prev => prev.filter(o => o._id !== orderId));
      toast.success('Delivery accepted!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept'); }
    finally { setAccepting(null); }
  };

  const handleOfferAccept = async (orderId) => {
  const result = await acceptOffer(orderId);

  if (result.success) {
    // Refresh available orders
    const orders = await deliveryAPI.getAvailable();
    setAvailableOrders(orders.data.orders);
  }
  };

  const handleOfferReject = (orderId) => {
    rejectOffer(orderId);
  };  

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
            <p className="text-sm text-gray-400">{user?.vehicleType} · {user?.vehicleNumber}</p>
          </div>
          <button onClick={toggleAvailability} disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
              user?.isAvailable ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}>
            {user?.isAvailable ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {user?.isAvailable ? 'Online' : 'Go Online'}
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Today's Earnings" value={formatCurrency(earnings?.today || 0)} icon={DollarSign} color="green" />
              <StatCard label="Today's Deliveries" value={earnings?.todayDeliveries || 0} icon={Package} color="brand" />
              <StatCard label="Weekly Earnings" value={formatCurrency(earnings?.thisWeek || 0)} icon={DollarSign} color="blue" />
              <StatCard label="Total Deliveries" value={earnings?.totalDeliveries || 0} icon={Bike} color="purple" />
            </div>

            <h2 className="font-bold text-gray-900 mb-3">Available Orders {availableOrders.length > 0 && <span className="badge badge-green ml-2">{availableOrders.length} new</span>}</h2>
            {availableOrders.length === 0 ? (
              <EmptyState icon={Package} title="No available orders" subtitle={user?.isAvailable ? "We'll notify you when new orders are ready" : "Go online to see available orders"} />
            ) : (
              <div className="space-y-3">
                {availableOrders.map(order => (
                  <div key={order._id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                        <p className="text-sm text-gray-600 mt-0.5">{order.items.length} items · {formatCurrency(order.pricing.total)}</p>
                      </div>
                      <span className="badge badge-green">Delivery: {formatCurrency(order.pricing.deliveryFee * 0.8)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div className="bg-orange-50 rounded-xl p-2.5">
                        <div className="flex items-center gap-1 text-orange-600 font-semibold mb-1"><MapPin className="w-3 h-3" /> Pickup</div>
                        <p className="text-gray-700">{order.restaurant?.name}</p>
                        <p className="text-gray-400">{order.restaurant?.address?.street}, {order.restaurant?.address?.city}</p>
                        <a href={`tel:${order.restaurant?.phone}`} className="flex items-center gap-1 text-gray-500 mt-1"><Phone className="w-3 h-3" />{order.restaurant?.phone}</a>
                      </div>
                      <div className="bg-green-50 rounded-xl p-2.5">
                        <div className="flex items-center gap-1 text-green-600 font-semibold mb-1"><MapPin className="w-3 h-3" /> Deliver To</div>
                        <p className="text-gray-700">{order.customer?.name}</p>
                        <p className="text-gray-400">{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</p>
                        <a href={`tel:${order.customer?.phone}`} className="flex items-center gap-1 text-gray-500 mt-1"><Phone className="w-3 h-3" />{order.customer?.phone}</a>
                      </div>
                    </div>
                    <button onClick={() => acceptDelivery(order._id)} disabled={accepting === order._id}
                      className="btn-primary w-full flex items-center justify-center gap-2">
                      {accepting === order._id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Bike className="w-4 h-4" />}
                      Accept Delivery
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

            

      <DeliveryOfferModal
        offer={activeOffer}
        queueLength={queueLength}
        responding={responding}
        onAccept={handleOfferAccept}
        onReject={handleOfferReject}
      />
    
    </div>
  );
};

export default DeliveryDashboard;
