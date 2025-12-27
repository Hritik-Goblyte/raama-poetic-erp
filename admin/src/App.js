import { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { Toaster } from 'sonner';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    const token = localStorage.getItem('raama-admin-token');
    const userData = localStorage.getItem('raama-admin-user');
    
    // Check for valid token and userData (not null, undefined, or "undefined")
    if (token && userData && token !== 'undefined' && userData !== 'undefined') {
      try {
        const parsedUser = JSON.parse(userData);
        
        if (parsedUser && parsedUser.role === 'admin') {
          setUser(parsedUser);
        } else {
          // Clear invalid data
          localStorage.removeItem('raama-admin-token');
          localStorage.removeItem('raama-admin-user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('raama-admin-token');
        localStorage.removeItem('raama-admin-user');
      }
    } else {
      localStorage.removeItem('raama-admin-token');
      localStorage.removeItem('raama-admin-user');
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    // Store in localStorage first
    localStorage.setItem('raama-admin-token', localStorage.getItem('raama-admin-token'));
    localStorage.setItem('raama-admin-user', JSON.stringify(userData));
    
    // Set user state
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('raama-admin-token');
    localStorage.removeItem('raama-admin-user');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{position: 'fixed', top: 0, right: 0, background: 'black', color: 'white', padding: '10px', zIndex: 9999, fontSize: '12px'}}>
          <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
          <div>Role: {user?.role || 'N/A'}</div>
          <div>Email: {user?.email || 'N/A'}</div>
        </div>
      )}
      
      {user ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;