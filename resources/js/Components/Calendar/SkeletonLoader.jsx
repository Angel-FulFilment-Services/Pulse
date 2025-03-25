const SkeletonLoader = ({ className }) => (
  <div className={`animate-pulse rounded ${className}`}>
    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
  </div>
);

export default SkeletonLoader;