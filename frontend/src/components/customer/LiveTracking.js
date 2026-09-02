import React from 'react';

export function LiveTrackingPanel() {
  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold">
        Live Tracking
      </h2>

      <p className="text-sm text-gray-500 mt-2">
        Delivery tracking will appear here.
      </p>
    </div>
  );
}

export default function LiveTracking() {
  return <LiveTrackingPanel />;
}