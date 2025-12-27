import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Heart, MessageCircle, UserPlus, Star, Award, Eye } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://raama-backend-srrb.onrender.com';

const NotificationCenter = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 10 seconds for better responsiveness
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('raama-token');
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle the correct response structure
      const data = response.data;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      // Silently handle errors in production, show in development
      if (API_BASE_URL.includes('localhost')) {
        console.error('Error fetching notifications:', error);
      }
      // Set empty state instead of showing errors
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    // Optimistic update - update UI immediately
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const token = localStorage.getItem('raama-token');
      await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: false } : notif
        )
      );
      setUnreadCount(prev => prev + 1);
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update - update UI immediately
    const unreadNotifications = notifications.filter(n => !n.isRead);
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    setUnreadCount(0);

    try {
      const token = localStorage.getItem('raama-token');
      await axios.put(`${API_BASE_URL}/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(prev => prev.map(notif => {
        const wasUnread = unreadNotifications.find(n => n.id === notif.id);
        return wasUnread ? { ...notif, isRead: false } : notif;
      }));
      setUnreadCount(unreadNotifications.length);
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    // Optimistic update - remove from UI immediately
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    if (notificationToDelete && !notificationToDelete.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      const token = localStorage.getItem('raama-token');
      await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(prev => [...prev, notificationToDelete].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ));
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => prev + 1);
      }
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500" />;
      case 'comment': return <MessageCircle size={16} className="text-blue-500" />;
      case 'follow': return <UserPlus size={16} className="text-green-500" />;
      case 'feature': return <Star size={16} className="text-yellow-500" />;
      case 'spotlight': return <Award size={16} className="text-purple-500" />;
      case 'view': return <Eye size={16} className="text-gray-500" />;
      default: return <Bell size={16} className="text-orange-500" />;
    }
  };

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.senderName} liked your shayari "${notification.shayariTitle}"`;
      case 'comment':
        return `${notification.senderName} commented on your shayari "${notification.shayariTitle}"`;
      case 'follow':
        return `${notification.senderName} started following you`;
      case 'feature':
        return `Your shayari "${notification.shayariTitle}" has been featured!`;
      case 'spotlight':
        return `You've been featured in Writer Spotlight: "${notification.title}"`;
      case 'view':
        return `Your shayari "${notification.shayariTitle}" reached ${notification.viewCount} views!`;
      default:
        return notification.message || 'New notification';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="notification-bell relative p-2 text-gray-400 hover:text-orange-500 active:text-orange-600 transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown absolute right-0 top-12 w-80 sm:w-80 max-w-[calc(100vw-2rem)] bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden transform -translate-x-2 sm:translate-x-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-orange-500 hover:text-orange-400"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={48} className="mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something happens!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                    !notification.isRead ? 'bg-orange-500/5 border-l-4 border-l-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-orange-500 hover:text-orange-400 px-2 py-1 rounded"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-400 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700 text-center">
              <button className="text-sm text-orange-500 hover:text-orange-400">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;