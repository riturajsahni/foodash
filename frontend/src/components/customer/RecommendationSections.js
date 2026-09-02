import React from 'react';

export function TrendingSection() {
  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold">
        Trending This Week
      </h2>

      <p className="text-sm text-gray-500 mt-2">
        Trending restaurants will appear here.
      </p>
    </div>
  );
}

export function ForYouSection() {
  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold">
        Recommended For You
      </h2>

      <p className="text-sm text-gray-500 mt-2">
        Personalized recommendations will appear here.
      </p>
    </div>
  );
}

export default function RecommendationSections() {
  return (
    <div className="space-y-4">
      <TrendingSection />

      <ForYouSection />
    </div>
  );
}