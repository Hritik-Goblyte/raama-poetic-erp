import { useEffect, useState } from 'react';

const CountingAnimation = ({ 
  targetValue, 
  duration = 1000, 
  className = "", 
  prefix = "", 
  suffix = "",
  isLoading = false 
}) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isLoading || targetValue === 0) {
      setCurrentValue(0);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    let startTime = null;
    const startValue = 0;
    const endValue = targetValue;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const value = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
      
      setCurrentValue(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    // Small delay before starting animation for better UX
    setTimeout(() => {
      requestAnimationFrame(animate);
    }, 100);
  }, [targetValue, duration, isLoading]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-700 rounded w-16 skeleton"></div>
      </div>
    );
  }

  return (
    <span className={`counting-number ${isAnimating ? 'animate-count-up' : ''} ${className}`}>
      {prefix}{currentValue}{suffix}
    </span>
  );
};

export default CountingAnimation;