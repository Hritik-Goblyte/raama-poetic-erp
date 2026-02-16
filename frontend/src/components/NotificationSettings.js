import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Volume2, VolumeX, Settings, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import notificationService from '../services/notificationService';

const NotificationSettings = ({ isOpen, onClose }) => {
  const [notificationStatus, setNotificationStatus] = useState('default');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, [isOpen]);

  const checkNotificationStatus = () => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
      setBrowserNotifications(Notification.permission === 'granted');
    }

    // Check if push subscription exists
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setPushEnabled(!!subscription);
        });
      });
    }

    // Get sound preference from localStorage
    const soundPref = localStorage.getItem('raama-notification-sound');
    setSoundEnabled(soundPref !== 'false');
  };

  const enableNotifications = async () => {
    try {
      const granted = await notificationService.requestNotificationPermission();
      if (granted) {
        setNotificationStatus('granted');
        setBrowserNotifications(true);
        setPushEnabled(true);
        toast.success('🎉 Notifications enabled successfully!');
      } else {
        toast.error('❌ Notification permission denied');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const disableNotifications = () => {
    // Can't programmatically revoke permission, but can unsubscribe from push
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          if (subscription) {
            subscription.unsubscribe();
            setPushEnabled(false);
            toast.success('Push notifications disabled');
          }
        });
      });
    }
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem('raama-notification-sound', newSoundEnabled.toString());
    toast.success(newSoundEnabled ? '🔊 Notification sounds enabled' : '🔇 Notification sounds disabled');
  };

  const sendTestNotification = async () => {
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification('🧪 Test Notification', {
          body: 'This is how notifications will appear on your device!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test',
          requireInteraction: false,
          vibrate: [200, 100, 200]
        });

        setTimeout(() => notification.close(), 5000);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        toast.success('Test notification sent!');
      } else {
        toast.error('Please enable notifications first');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const getStatusColor = () => {
    switch (notificationStatus) {
      case 'granted': return 'text-green-400';
      case 'denied': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusText = () => {
    switch (notificationStatus) {
      case 'granted': return 'Enabled';
      case 'denied': return 'Blocked';
      default: return 'Not Set';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="text-orange-500" size={24} />
            <h3 className="text-xl font-bold text-white">Notification Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Status:</span>
            <span className={`font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Push Notifications:</span>
            <span className={pushEnabled ? 'text-green-400' : 'text-gray-500'}>
              {pushEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4 mb-6">
          {/* Browser Notifications */}
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="text-blue-400" size={20} />
              <div>
                <p className="text-white font-medium">Browser Notifications</p>
                <p className="text-gray-400 text-sm">Show notifications in system tray</p>
              </div>
            </div>
            <button
              onClick={browserNotifications ? disableNotifications : enableNotifications}
              className={`p-2 rounded-lg transition-all ${
                browserNotifications 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {browserNotifications ? <Check size={16} /> : <BellOff size={16} />}
            </button>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="text-purple-400" size={20} />
              ) : (
                <VolumeX className="text-gray-400" size={20} />
              )}
              <div>
                <p className="text-white font-medium">Notification Sounds</p>
                <p className="text-gray-400 text-sm">Play sound with notifications</p>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg transition-all ${
                soundEnabled 
                  ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {notificationStatus === 'granted' && (
            <button
              onClick={sendTestNotification}
              className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center gap-2"
            >
              <Bell size={16} />
              Send Test Notification
            </button>
          )}

          {notificationStatus !== 'granted' && (
            <button
              onClick={enableNotifications}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Bell size={16} />
              Enable Notifications
            </button>
          )}

          {notificationStatus === 'denied' && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Settings className="text-orange-400 mt-0.5" size={16} />
            <div className="text-sm">
              <p className="text-orange-400 font-medium mb-1">How it works:</p>
              <ul className="text-gray-300 space-y-1 text-xs">
                <li>• Get notified when someone likes your shayaris</li>
                <li>• Receive alerts for new followers</li>
                <li>• Know when your work gets featured</li>
                <li>• Works even when the app is closed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;