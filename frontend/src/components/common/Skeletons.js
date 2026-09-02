import React from 'react';

// Base skeleton block
export const Skeleton = ({ className = '', rounded = 'rounded-lg' }) => (
  <div className={`skeleton ${rounded} ${className}`} />
);

// Restaurant card skeleton
export const RestaurantCardSkeleton = () => (
  <div className="card animate-pulse">
    <Skeleton className="h-44 w-full" rounded="rounded-none" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-3 mt-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  </div>
);

// Order card skeleton
export const OrderCardSkeleton = () => (
  <div className="card p-4 flex items-center gap-4 animate-pulse">
    <Skeleton className="w-12 h-12 shrink-0" rounded="rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
    <Skeleton className="h-6 w-20" rounded="rounded-full" />
  </div>
);

// Menu item skeleton
export const MenuItemSkeleton = () => (
  <div className="card p-4 flex gap-4 animate-pulse">
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-16" rounded="rounded-full" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-5 w-20 mt-2" />
    </div>
    <div className="shrink-0 space-y-2 flex flex-col items-center">
      <Skeleton className="w-20 h-20" rounded="rounded-xl" />
      <Skeleton className="h-8 w-16" rounded="rounded-xl" />
    </div>
  </div>
);

// Stat card skeleton
export const StatCardSkeleton = () => (
  <div className="card p-5 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="w-10 h-10" rounded="rounded-xl" />
    </div>
    <Skeleton className="h-8 w-1/2 mb-2" />
    <Skeleton className="h-3 w-3/4" />
  </div>
);

// Notification skeleton
export const NotificationSkeleton = () => (
  <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
    <Skeleton className="w-8 h-8 shrink-0" rounded="rounded-full" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="card p-5 flex items-center gap-4 animate-pulse">
    <Skeleton className="w-16 h-16 shrink-0" rounded="rounded-2xl" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// Grid of restaurant card skeletons
export const RestaurantGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <RestaurantCardSkeleton key={i} />
    ))}
  </div>
);

// Full page loading skeleton for analytics
export const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className="card p-5">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-64 w-full" rounded="rounded-xl" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="card p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      </div>
      <div className="card p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-40 w-full" rounded="rounded-xl" />
      </div>
    </div>
  </div>
);