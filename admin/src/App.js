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
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'admin') {
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('raama-admin-token');
        localStorage.removeItem('raama-admin-user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
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