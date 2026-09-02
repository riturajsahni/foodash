import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, StatusBadge, formatCurrency, formatDate, formatTime } from '../../components/common';
import OrderTimeline from '../../components/customer/OrderTimeline';
import { LiveTrackingPanel } from '../../components/customer/LiveTracking';
import { WriteReviewForm } from '../../components/customer/ReviewComponents';
import { ArrowLeft, Download, FileText, Phone, MapPin, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import AssignmentTracker from '../../components/customer/AssignmentTracker';



export default function OrderTracking() {
  const { id } = useParams();
  const socketRef = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    orderAPI.getOne(id)
      .then(res => {
        setOrder(res.data.order);
        setReviewed(!!res.data.order?.rating);
      })
      .catch(() => toast.error('Could not load order'))
      .finally(() => setLoading(false));
  }, [id]);

  // Real-time status updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    socket.emit('track_order', id);
    const handler = ({ orderId, order: updated }) => {
      if (orderId === id || orderId === order?._id) {
        setOrder(updated);
        toast.success(`Order is now: ${updated.status.replace('_', ' ').toUpperCase()}`, { icon: '📦' });
      }
    };
    socket.on('order_status_update', handler);
    return () => { socket.off('order_status_update', handler); socket.emit('stop_tracking', id); };
  }, [id, socketRef, order?._id]);

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/orders/${id}/invoice`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('foodash_token')}` },
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `FooDash-Invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="page-wrapper"><Navbar /><LoadingSpinner size="lg" /></div>;
  if (!order)  return <div className="page-wrapper"><Navbar /><p className="text-center py-16 text-gray-500">Order not found</p></div>;

  const isDelivered = order.status === 'delivered';
  const isActive    = ['picked_up', 'out_for_delivery'].includes(order.status);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Back */}
        <Link to="/customer/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        {/* Header card */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs text-gray-400 font-medium">Order #{order.orderNumber}</p>
              <h1 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100">{order.restaurant?.name}</h1>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)} at {formatTime(order.createdAt)}</p>
        </div>

        {/* Timeline */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-5 text-sm">Order Progress</h2>
          <OrderTimeline order={order} />
        </div>
        
        {/* Assignment tracker */}
        <AssignmentTracker
          orderId={order._id}
          order={order}
        />

        {/* Live tracking (only when active) */}
        {(isActive || order.deliveryPartner) && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm">Live Tracking</h2>
            <LiveTrackingPanel order={order} />
          </div>
        )}

        {/* Order items */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm">Order Items</h2>
          <div className="space-y-2 mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-gray-700 dark:text-gray-300">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.pricing.subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery fee</span><span>{formatCurrency(order.pricing.deliveryFee)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.pricing.tax)}</span></div>
            {order.pricing.discount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.pricing.discount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-sm text-gray-900 dark:text-gray-100 pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span>Total</span><span>{formatCurrency(order.pricing.total)}</span>
            </div>
          </div>

          {/* Delivery address */}
          {order.deliveryAddress && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Delivery Address
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
              </p>
            </div>
          )}
        </div>

        {/* Invoice download */}
        {isDelivered && (
          <button
            onClick={downloadInvoice}
            disabled={downloading}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            {downloading
              ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <FileText className="w-4 h-4" />}
            {downloading ? 'Generating PDF...' : 'Download Invoice (PDF)'}
          </button>
        )}

        {/* Review section */}
        {isDelivered && !reviewed && !showReview && (
          <div className="card p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">How was your order?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your feedback helps other customers</p>
              </div>
            </div>
            <button onClick={() => setShowReview(true)} className="btn-primary w-full">
              Write a Review ⭐
            </button>
          </div>
        )}

        {showReview && !reviewed && (
          <div className="card p-5">
            <WriteReviewForm
              orderId={id}
              restaurantName={order.restaurant?.name}
              deliveryPartnerName={order.deliveryPartner?.name}
              onSubmit={() => { setReviewed(true); setShowReview(false); }}
              onCancel={() => setShowReview(false)}
            />
          </div>
        )}

        {reviewed && (
          <div className="card p-4 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-center">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">✅ Thanks for your review!</p>
          </div>
        )}
      </div>
    </div>
  );
}