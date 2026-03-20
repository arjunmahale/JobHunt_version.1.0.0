export function JobCardSkeleton() {
  return (
    <div className="bg-gray-200 rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-full mb-4"></div>
      <div className="h-10 bg-gray-300 rounded w-1/4"></div>
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="h-6 bg-gray-300 rounded w-1/2 mb-6"></div>
      <div className="space-y-3 mb-6">
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
      <div className="h-12 bg-gray-300 rounded w-1/4"></div>
    </div>
  );
}