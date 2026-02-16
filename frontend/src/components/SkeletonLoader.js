const SkeletonLoader = ({ className = "", variant = "default" }) => {
  const variants = {
    default: "h-4 bg-gray-700 rounded skeleton",
    card: "h-32 bg-gray-800 rounded-lg skeleton",
    text: "h-4 bg-gray-700 rounded skeleton",
    title: "h-6 bg-gray-700 rounded skeleton",
    avatar: "h-12 w-12 bg-gray-700 rounded-full skeleton",
    stat: "h-16 bg-gray-800 rounded-lg skeleton",
    notification: "h-20 bg-gray-800 rounded-lg skeleton"
  };

  return (
    <div className={`animate-pulse ${variants[variant]} ${className}`}></div>
  );
};

// Skeleton components for different sections
export const StatCardSkeleton = () => (
  <div className="glass-card p-6 animate-fade-in-scale">
    <SkeletonLoader variant="text" className="w-24 mb-2" />
    <SkeletonLoader variant="stat" className="w-16" />
  </div>
);

export const ShayariCardSkeleton = () => (
  <div className="glass-card p-6 animate-fade-in-up">
    <div className="flex items-start justify-between mb-3">
      <SkeletonLoader variant="title" className="flex-1 w-3/4" />
    </div>
    <SkeletonLoader variant="text" className="mb-2" />
    <SkeletonLoader variant="text" className="mb-4 w-2/3" />
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SkeletonLoader variant="avatar" className="h-8 w-8" />
        <div>
          <SkeletonLoader variant="text" className="w-20 mb-1" />
          <SkeletonLoader variant="text" className="w-16 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SkeletonLoader variant="text" className="w-8" />
        <SkeletonLoader variant="text" className="w-12" />
      </div>
    </div>
  </div>
);

export const NotificationSkeleton = () => (
  <div className="glass-card p-4 flex items-start justify-between gap-3 animate-fade-in-up">
    <div className="flex-1">
      <SkeletonLoader variant="text" className="mb-2" />
      <SkeletonLoader variant="text" className="w-2/3 h-3" />
    </div>
    <SkeletonLoader variant="default" className="w-4 h-4" />
  </div>
);

export default SkeletonLoader;