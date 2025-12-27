import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, UserPlus, Star, Award, Bell } from 'lucide-react';

const ToastNotification = ({ notification, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'like': return <Heart size={20} className="text-red-500" />;
      case 'comment': return <MessageCircle size={20} className="text-blue-500" />;
      case 'follow': return <UserPlus size={20} className="text-green-500" />;
      case 'feature': return <Star size={20} className="text-yellow-500" />;
      case 'spotlight': return <Award size={20} className="text-purple-500" />;
      default: return <Bell size={20} className="text-orange-500" />;
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'like': return 'New Like';
      case 'comment': return 'New Comment';
      case 'follow': return 'New Follower';
      case 'feature': return 'Shayari Featured';
      case 'spotlight': return 'Writer Spotlight';
      default: return 'Notification';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 max-w-sm w-full backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-white">
                {getTitle()}
              </h4>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {notification.message}
            </p>
            {notification.shayariTitle && (
              <p className="text-xs text-orange-400 mt-1 font-medium">
                "{notification.shayariTitle}"
              </p>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-500 rounded-full animate-shrink"
            style={{ 
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Listen for custom toast events
    const handleToast = (event) => {
      const newToast = {
        id: Date.now() + Math.random(),
        ...event.detail
      };
      setToasts(prev => [...prev, newToast]);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-3">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration || 5000}
        />
      ))}
    </div>
  );
};

// Helper function to show toast
export const showToast = (notification) => {
  const event = new CustomEvent('show-toast', { detail: notification });
  window.dispatchEvent(event);
};

export default ToastNotification;