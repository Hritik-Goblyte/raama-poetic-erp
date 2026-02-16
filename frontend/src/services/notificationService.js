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
    this.pollingInterval = null;
  }

  // Initialize real-time notifications using Server-Sent Events
  initializeRealTimeNotifications(userId) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const token = localStorage.getItem('raama-token');
    if (!token || !userId) return;

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
        } else {
          console.log('Max reconnection attempts reached, falling back to polling');
          // Fall back to polling every 30 seconds
          this.startPolling();
        }
      };
    } catch (error) {
      console.log('Failed to initialize notification stream, using polling instead');
      this.startPolling();
    }
  }

  // Fallback polling method
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = setInterval(async () => {
      try {
        const data = await this.fetchNotifications();
        // Check for new notifications and show toasts
        if (data.notifications && data.notifications.length > 0) {
          const latestNotification = data.notifications[0];
          const lastNotificationTime = localStorage.getItem('lastNotificationTime');
          const currentTime = new Date(latestNotification.createdAt).getTime();
          
          if (!lastNotificationTime || currentTime > parseInt(lastNotificationTime)) {
            this.handleNewNotification(latestNotification);
            localStorage.setItem('lastNotificationTime', currentTime.toString());
          }
        }
      } catch (error) {
        console.log('Polling failed:', error);
      }
    }, 30000); // Poll every 30 seconds
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

  // Request notification permission and setup push notifications
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('❌ This browser does not support service workers');
      return false;
    }

    try {
      // Request notification permission
      let permission = Notification.permission;
      if (permission === 'default') {
        // Show a friendly prompt first
        const userWantsNotifications = await this.showNotificationPrompt();
        if (!userWantsNotifications) {
          return false;
        }
        
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        // Setup push subscription
        await this.setupPushSubscription();
        
        // Show a test notification to confirm it's working
        this.showWelcomeNotification();
        
        return true;
      } else {
        console.log('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  // Show a friendly notification prompt
  async showNotificationPrompt() {
    return new Promise((resolve) => {
      // Create a custom modal-like prompt
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
      modal.innerHTML = `
        <div class="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div class="text-center mb-6">
            <div class="text-4xl mb-4">🔔</div>
            <h3 class="text-xl font-bold text-orange-500 mb-2" style="font-family: 'Tillana', cursive;">
              Stay Connected with रामा
            </h3>
            <p class="text-gray-300 text-sm leading-relaxed">
              Get instant notifications when someone likes your shayaris, follows you, or when your work gets featured!
            </p>
          </div>
          
          <div class="space-y-3">
            <button id="allow-notifications" class="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all">
              ✨ Enable Notifications
            </button>
            <button id="maybe-later" class="w-full py-2 text-gray-400 hover:text-white transition-all">
              Maybe Later
            </button>
          </div>
          
          <div class="mt-4 text-xs text-gray-500 text-center">
            <p>📱 Works like Instagram, YouTube notifications</p>
            <p>🔒 You can change this anytime in settings</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Handle button clicks
      modal.querySelector('#allow-notifications').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };
      
      modal.querySelector('#maybe-later').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };
      
      // Close on backdrop click
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(false);
        }
      };
    });
  }

  // Show welcome notification after permission is granted
  showWelcomeNotification() {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        const notification = new Notification('🎉 रामा Notifications Enabled!', {
          body: 'You\'ll now receive notifications for likes, follows, and featured content.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'welcome',
          requireInteraction: false,
          silent: false
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }, 1000);
  }

  // Setup push subscription
  async setupPushSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f4LiKqc7WDWN6_MHSd1el_RuQAE2hxbgamdBYrXPVdpXYA5NxQ8'; // You'll need to generate this
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      console.log('✅ Push subscription setup complete');
      return subscription;
    } catch (error) {
      console.error('❌ Error setting up push subscription:', error);
      return null;
    }
  }

  // Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      const token = localStorage.getItem('raama-token');
      if (!token) return;

      await axios.post(`${API_BASE_URL}/api/push-subscription`, {
        subscription: subscription.toJSON()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
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

  // Send test notification
  async sendTestNotification() {
    try {
      const token = localStorage.getItem('raama-token');
      const response = await axios.post(`${API_BASE_URL}/api/notifications/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Check notification system health
  async checkHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking notification health:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Disconnect notification stream
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
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