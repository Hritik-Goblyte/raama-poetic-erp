import axios from 'axios';
import { showToast } from '../components/ToastNotification';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://raama-backend-srrb.onrender.com';

class NotificationService {
  constructor() {
    this.eventSource = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Initialize real-time notifications using Server-Sent Events
  initializeRealTimeNotifications(userId) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const token = localStorage.getItem('raama-token');
    if (!token || !userId) return;

    // Only try to connect in production or if backend is available
    if (API_BASE_URL.includes('localhost')) {
      console.log('Skipping real-time notifications in development mode');
      return;
    }

    try {
      this.eventSource = new EventSource(
        `${API_BASE_URL}/api/notifications/stream?token=${token}`
      );

      this.eventSource.onopen = () => {
        console.log('✅ Notification stream connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'heartbeat') {
            this.handleNewNotification(data);
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.log('Notification stream connection failed, using polling instead');
        this.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.initializeRealTimeNotifications(userId);
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.log('Failed to initialize notification stream, using polling instead');
    }
  }

  // Handle new notification
  handleNewNotification(notification) {
    // Show toast notification
    showToast({
      type: notification.type,
      message: this.formatNotificationMessage(notification),
      shayariTitle: notification.shayariTitle,
      duration: 6000
    });

    // Play notification sound
    this.playNotificationSound();

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);

    // Dispatch custom event for notification center
    window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
  }

  // Format notification message
  formatNotificationMessage(notification) {
    switch (notification.type) {
      case 'like':
        return `${notification.senderName} liked your shayari`;
      case 'comment':
        return `${notification.senderName} commented on your shayari`;
      case 'follow':
        return `${notification.senderName} started following you`;
      case 'feature':
        return `Your shayari has been featured!`;
      case 'spotlight':
        return `You've been featured in Writer Spotlight!`;
      case 'view_milestone':
        return `Your shayari reached ${notification.viewCount} views!`;
      default:
        return notification.message || 'New notification';
    }
  }

  // Play notification sound
  playNotificationSound() {
    try {
      // Create a subtle notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  // Show browser notification
  async showBrowserNotification(notification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification('रामा - New Notification', {
        body: this.formatNotificationMessage(notification),
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  }

  // Send notification to user
  async sendNotification(recipientId, notificationData) {
    try {
      const token = localStorage.getItem('raama-token');
      await axios.post(`${API_BASE_URL}/api/notifications`, {
        recipientId,
        ...notificationData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Fetch notifications
  async fetchNotifications() {
    try {
      const token = localStorage.getItem('raama-token');
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const token = localStorage.getItem('raama-token');
      await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const token = localStorage.getItem('raama-token');
      await axios.put(`${API_BASE_URL}/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const token = localStorage.getItem('raama-token');
      await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // Disconnect notification stream
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  // Get connection status
  isConnectedToStream() {
    return this.isConnected;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;