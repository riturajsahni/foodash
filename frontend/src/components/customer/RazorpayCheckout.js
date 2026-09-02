import React, { useState } from 'react';

import {
  CreditCard,
  Smartphone,
  Wallet,
} from 'lucide-react';

import toast from 'react-hot-toast';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://foodash-backend-v2.onrender.com/api';

// Load Razorpay script dynamically
const loadRazorpay = () =>
  new Promise((resolve) => {

    // Already loaded
    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement('script');

    script.src =
      'https://checkout.razorpay.com/v1/checkout.js';

    script.onload = () => resolve(true);

    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

export default function RazorpayCheckout({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
}) {

  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {

    setLoading(true);

    // Load Razorpay SDK
    const loaded = await loadRazorpay();

    if (!loaded) {

      toast.error(
        'Payment gateway failed to load. Check your internet connection.'
      );

      setLoading(false);

      return;
    }

    try {
      // Create Razorpay order
      const res = await fetch(
        `${API_BASE_URL}/payments/razorpay/create-order`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            Authorization: `Bearer ${
              localStorage.getItem('token') ||
              localStorage.getItem('foodash_token')
            }`,
          },

          body: JSON.stringify({
            amount,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(
          data.message || 'Failed to create payment order'
        );
      }

      // Razorpay options
      const options = {
        key: data.keyId,

        amount: data.amount,

        currency: data.currency,

        name: 'FooDash',

        description: 'Food Order Payment',

        image: '/logo192.png',

        order_id: data.orderId,

        handler: async (response) => {

          try {

            // Verify payment
            const verifyRes = await fetch(
              `${API_BASE_URL}/payments/razorpay/verify`,
              {
                method: 'POST',

                headers: {
                  'Content-Type': 'application/json',

                  Authorization: `Bearer ${
                    localStorage.getItem('token') ||
                    localStorage.getItem('foodash_token')
                  }`,
                },

                body: JSON.stringify({
                  ...response,
                  foodOrderId: orderId,
                }),
              }
            );

            const verifyData = await verifyRes.json();

            if (verifyData.success) {

              toast.success(
                'Payment successful! 🎉'
              );

              setLoading(false);

              onSuccess?.(
                verifyData.paymentId
              );

            } else {

              throw new Error(
                'Payment verification failed'
              );
            }

          } catch (err) {

            console.error(err);

            toast.error(
              'Payment verification failed'
            );

            setLoading(false);

            onFailure?.(err);
          }
        },

        prefill: {
          name: customerName || '',

          email: customerEmail || '',

          contact: customerPhone || '',
        },

        theme: {
          color: '#f97316',
        },

        modal: {
          ondismiss: () => {

            setLoading(false);

            toast('Payment cancelled', {
              icon: '⚠️',
            });

            onFailure?.('dismissed');
          },
        },
      };

      // Open Razorpay popup
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (resp) => {

        console.error(resp);

        toast.error(
          `Payment failed: ${resp.error.description}`
        );

        setLoading(false);

        onFailure?.(resp.error);
      });

      rzp.open();

    } catch (err) {

      console.error(err);

      toast.error(
        err.message || 'Payment failed'
      );

      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">

      {/* Payment methods */}
      <div className="grid grid-cols-3 gap-2 text-center">

        {[
          {
            icon: Smartphone,
            label: 'UPI',
            color: 'text-green-600',
          },

          {
            icon: CreditCard,
            label: 'Cards',
            color: 'text-blue-600',
          },

          {
            icon: Wallet,
            label: 'Wallet',
            color: 'text-purple-600',
          },
        ].map(
          ({
            icon: Icon,
            label,
            color,
          }) => (
            <div
              key={label}
              className="
                bg-gray-50
                dark:bg-gray-800
                rounded-xl
                p-2.5
              "
            >
              <Icon
                className={`
                  w-5 h-5 mx-auto mb-1 ${color}
                `}
              />

              <p
                className="
                  text-xs
                  font-medium
                  text-gray-600
                  dark:text-gray-400
                "
              >
                {label}
              </p>
            </div>
          )
        )}
      </div>

      {/* Payment button */}
      <button
        onClick={handlePayment}

        disabled={loading}

        className="
          btn-primary
          w-full
          flex
          items-center
          justify-center
          gap-2
        "
      >

        {loading ? (
          <>
            <div
              className="
                w-4 h-4
                border-2
                border-white
                border-t-transparent
                rounded-full
                animate-spin
              "
            />

            Opening Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />

            Pay ₹{amount} via Razorpay
          </>
        )}
      </button>

      {/* Secure text */}
      <p
        className="
          text-xs
          text-center
          text-gray-400
        "
      >
        🔒 100% secure · Powered by Razorpay
      </p>
    </div>
  );
}