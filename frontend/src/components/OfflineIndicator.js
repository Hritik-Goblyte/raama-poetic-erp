import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide online message after 3 seconds
  useEffect(() => {
    if (isOnline && !showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-50 transition-all duration-300 ${
      showOfflineMessage ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className={`glass-card p-3 border ${
        isOnline 
          ? 'border-green-500/30 bg-gradient-to-r from-green-500/10 to-green-600/10' 
          : 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isOnline ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isOnline ? (
              <Wifi size={18} className="text-green-400" />
            ) : (
              <WifiOff size={18} className="text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-medium text-sm ${
                isOnline ? 'text-green-400' : 'text-red-400'
              }`}>
                {isOnline ? 'Back Online' : 'You\'re Offline'}
              </h3>
              {!isOnline && <AlertCircle size={14} className="text-red-400" />}
            </div>
            <p className="text-xs text-gray-300 mt-1">
              {isOnline 
                ? 'Connection restored. All features available.'
                : 'Limited functionality. Some features may not work.'
              }
            </p>
          </div>
          <button
            onClick={() => setShowOfflineMessage(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;