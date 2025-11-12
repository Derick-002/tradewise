import React from 'react';

const TransactionSkeleton = () => {
  return (
    <div className="space-y-6 overflow-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-12 bg-gray-300 rounded w-32"></div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-12"></div>
              </div>
              <div className="h-12 w-12 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 bg-gray-300 rounded-lg"></div>
              <div>
                <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="h-12 bg-gray-300 rounded"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-300 rounded w-40"></div>
        </div>
        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-8 gap-4 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-8 gap-4 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                <div key={j} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Loading Message */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#BE741E]"></div>
          <span className="text-gray-600 text-lg">Searching for transaction...</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionSkeleton;
