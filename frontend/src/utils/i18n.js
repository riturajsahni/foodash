// ── frontend/src/utils/i18n.js ────────────────────────────────────────────────
// Simple i18n without external library

const translations = {
  en: {
    // Nav
    home:         'Home',
    myOrders:     'My Orders',
    wallet:       'Wallet & Rewards',
    profile:      'Profile',
    logout:       'Logout',
    // Home
    searchPlaceholder: 'Search restaurants or cuisines...',
    trending:     'Trending This Week',
    forYou:       'Recommended For You',
    // Cart
    yourCart:     'Your Cart',
    placeOrder:   'Place Order',
    emptyCart:    'Your cart is empty',
    subtotal:     'Subtotal',
    deliveryFee:  'Delivery Fee',
    tax:          'Tax',
    total:        'Total',
    // Orders
    orderPlaced:  'Order Placed',
    confirmed:    'Confirmed',
    preparing:    'Preparing',
    ready:        'Ready',
    outForDelivery: 'Out for Delivery',
    delivered:    'Delivered',
    cancelled:    'Cancelled',
    // Common
    loading:      'Loading...',
    save:         'Save',
    cancel:       'Cancel',
    apply:        'Apply',
    close:        'Close',
    back:         'Back',
    viewAll:      'View All',
    noData:       'No data yet',
    // Payment
    cod:          'Cash on Delivery',
    online:       'Pay Online',
    upi:          'UPI',
  },

  hi: {
    // Nav
    home:         'होम',
    myOrders:     'मेरे ऑर्डर',
    wallet:       'वॉलेट और रिवार्ड',
    profile:      'प्रोफ़ाइल',
    logout:       'लॉग आउट',
    // Home
    searchPlaceholder: 'रेस्टोरेंट या व्यंजन खोजें...',
    trending:     'इस हफ्ते ट्रेंडिंग',
    forYou:       'आपके लिए सुझाव',
    // Cart
    yourCart:     'आपकी कार्ट',
    placeOrder:   'ऑर्डर करें',
    emptyCart:    'कार्ट खाली है',
    subtotal:     'सब-टोटल',
    deliveryFee:  'डिलीवरी शुल्क',
    tax:          'टैक्स',
    total:        'कुल',
    // Orders
    orderPlaced:  'ऑर्डर हुआ',
    confirmed:    'स्वीकृत',
    preparing:    'तैयारी हो रही है',
    ready:        'तैयार',
    outForDelivery: 'रास्ते में',
    delivered:    'पहुँच गया',
    cancelled:    'रद्द',
    // Common
    loading:      'लोड हो रहा है...',
    save:         'सेव करें',
    cancel:       'रद्द करें',
    apply:        'लागू करें',
    close:        'बंद करें',
    back:         'वापस',
    viewAll:      'सभी देखें',
    noData:       'अभी कोई डेटा नहीं',
    // Payment
    cod:          'कैश ऑन डिलीवरी',
    online:       'ऑनलाइन भुगतान',
    upi:          'यूपीआई',
  },
};

// ── Language Context ──────────────────────────────────────────────────────────
import React, { createContext, useContext, useState } from 'react';

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('foodash_lang') || 'en');

  const t = (key) => translations[lang]?.[key] || translations.en?.[key] || key;

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('foodash_lang', newLang);
  };

  return (
    <I18nContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

// ── Language Toggle Component ─────────────────────────────────────────────────
export function LanguageToggle({ className = '' }) {
  const { lang, changeLang } = useI18n();
  return (
    <div className={`flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 ${className}`}>
      {[
        { code: 'en', label: 'EN 🇬🇧' },
        { code: 'hi', label: 'हि 🇮🇳' },
      ].map(l => (
        <button
          key={l.code}
          onClick={() => changeLang(l.code)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            lang === l.code
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export default translations;