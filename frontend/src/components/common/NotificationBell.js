import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Package, Tag, Wallet, Star } from 'lucide-react';
import { notificationAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';

const typeIcons = {
  order_update: Package,
  promo: Tag,
  wallet: Wallet,
  loyalty: Star,
  system: Bell,
  delivery: Package,
};

const typeColors = {
  order_update: 'bg-brand-50 text-brand-600',
  promo: 'bg-purple-50 text-purple-600',
  wallet: 'bg-green-50 text-green-600',
  loyalty: 'bg-amber-50 text-amber-600',
  system: 'bg-gray-50 text-gray-600',
  delivery: 'bg-blue-50 text-blue-600',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useSocket();
  const panelRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.get({ limit: 20 });
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  // Real-time socket listener
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;
    const handler = (notif) => {
      setNotifications(prev => [{ ...notif, isRead: false, createdAt: new Date() }, ...prev]);
      setUnread(prev => prev + 1);
      toast.custom(t => (
        <div className={`card p-3 flex items-start gap-3 max-w-sm shadow-lg ${t.visible ? 'animate-slide-up' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeColors[notif.type] || 'bg-gray-50 text-gray-600'}`}>
            {React.createElement(typeIcons[notif.type] || Bell, { className: 'w-4 h-4' })}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
            <p className="text-xs text-gray-500 truncate">{notif.body}</p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-gray-300 hover:text-gray-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ), { duration: 5000 });
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socketRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const formatTime = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifs(); }}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            <div className="flex gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : notifications.map(n => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-brand-50/40' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${typeColors[n.type] || 'bg-gray-50 text-gray-600'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
