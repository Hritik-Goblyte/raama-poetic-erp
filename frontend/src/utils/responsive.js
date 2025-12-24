// Responsive utility functions and constants
import { useState, useEffect } from 'react';

export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const DEVICE_SIZES = {
  mobile: 'max-width: 767px',
  tablet: 'min-width: 768px and max-width: 1023px',
  desktop: 'min-width: 1024px'
};

// Hook to detect screen size
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('mobile');
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
};

// Responsive class generators
export const responsiveClasses = {
  // Container classes
  container: 'w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl',
  
  // Padding classes
  padding: {
    page: 'p-4 sm:p-6 lg:p-8',
    card: 'p-4 sm:p-6 lg:p-8',
    small: 'p-2 sm:p-3 lg:p-4'
  },
  
  // Margin classes
  margin: {
    section: 'mb-4 sm:mb-6 lg:mb-8',
    element: 'mb-2 sm:mb-3 lg:mb-4'
  },
  
  // Text classes
  text: {
    title: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
    subtitle: 'text-lg sm:text-xl lg:text-2xl',
    body: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm'
  },
  
  // Button classes
  button: {
    primary: 'py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base',
    secondary: 'py-1 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm'
  },
  
  // Input classes
  input: {
    standard: 'px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base',
    otp: 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-lg sm:text-xl lg:text-2xl'
  },
  
  // Icon classes
  icon: {
    small: 'w-4 h-4 sm:w-5 sm:h-5',
    medium: 'w-5 h-5 sm:w-6 sm:h-6',
    large: 'w-6 h-6 sm:w-8 sm:h-8'
  },
  
  // Spacing classes
  spacing: {
    gap: {
      small: 'gap-1 sm:gap-2',
      medium: 'gap-2 sm:gap-3',
      large: 'gap-3 sm:gap-4'
    },
    space: {
      small: 'space-y-2 sm:space-y-3',
      medium: 'space-y-3 sm:space-y-4',
      large: 'space-y-4 sm:space-y-6'
    }
  },
  
  // Grid classes
  grid: {
    cols2: 'grid-cols-1 sm:grid-cols-2',
    cols3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }
};

// Utility function to combine responsive classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Mobile detection
export const isMobile = () => {
  return window.innerWidth < 768;
};

export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = () => {
  return window.innerWidth >= 1024;
};

// Touch device detection
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Viewport height utilities for mobile browsers
export const getViewportHeight = () => {
  return window.innerHeight;
};

export const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Initialize viewport height on load and resize
if (typeof window !== 'undefined') {
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
}