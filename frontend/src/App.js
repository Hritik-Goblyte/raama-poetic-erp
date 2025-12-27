import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import EmailVerification from "@/pages/EmailVerification";
import OTPVerification from "@/pages/OTPVerification";
import Dashboard from "@/pages/Dashboard";
import MyShayari from "@/pages/MyShayari";
import Writers from "@/pages/Writers";
import Profile from "@/pages/Profile";
import Bookmarks from "@/pages/Bookmarks";
import Trending from "@/pages/Trending";
import Analytics from "@/pages/Analytics";
import Spotlights from "@/pages/Spotlights";
import { Toaster } from "@/components/ui/sonner";
import { ToastContainer } from "@/components/ToastNotification";
import notificationService from "@/services/notificationService";

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('raama-theme') || 'dark';
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('raama-theme', theme);
  }, [theme]);

  // Initialize user and notifications
  useEffect(() => {
    const token = localStorage.getItem('raama-token');
    const userData = localStorage.getItem('raama-user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Initialize notifications
        notificationService.initializeRealTimeNotifications(parsedUser.id);
        
        // Request notification permission
        notificationService.requestNotificationPermission();
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      notificationService.disconnect();
    };
  }, []);

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            // Service worker registered successfully
          })
          .catch((registrationError) => {
            // Service worker registration failed
          });
      });
    }
  }, []);

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('raama-token');
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard theme={theme} setTheme={setTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/my-shayari" element={
            <ProtectedRoute>
              <MyShayari theme={theme} setTheme={setTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/writers" element={
            <ProtectedRoute>
              <Writers theme={theme} setTheme={setTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile theme={theme} setTheme={setTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/bookmarks" element={
            <ProtectedRoute>
              <Bookmarks theme={theme} setTheme={setTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/trending" element={
            <ProtectedRoute>
              <Trending theme={theme} setTheme={setTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics theme={theme} setTheme={setTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/spotlights" element={
            <ProtectedRoute>
              <Spotlights theme={theme} setTheme={setTheme} user={user} />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      <Toaster />
      <ToastContainer />
    </div>
  );
}

export default App;