import { useState } from 'react';
import { Eye, EyeOff, Shield, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

// Hardcode backend URL for now since environment variable is not being read in production
const BACKEND_URL = 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;
const ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET;

export default function AdminLogin({ onLogin }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    adminSecret: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      // Try admin login first (with secret)
      let response;
      if (credentials.adminSecret) {
        try {
          response = await axios.post(`${API}/auth/admin-login`, {
            email: credentials.email,
            password: credentials.password,
            adminSecret: credentials.adminSecret
          });
        } catch (adminError) {
          // If admin login fails, try regular login for admin users
          if (adminError.response?.status === 401 && adminError.response?.data?.detail?.includes('Admin secret')) {
            response = await axios.post(`${API}/auth/login`, {
              email: credentials.email,
              password: credentials.password
            });
            
            // Check if user is admin
            if (response.data.user.role !== 'admin') {
              throw new Error('Admin access required');
            }
          } else {
            throw adminError;
          }
        }
      } else {
        // Use regular login if no admin secret provided
        response = await axios.post(`${API}/auth/login`, {
          email: credentials.email,
          password: credentials.password
        });
        
        // Check if user is admin
        if (response.data.user.role !== 'admin') {
          throw new Error('Admin access required');
        }
      }

      console.log('Login successful');

      if (!response.data.token) {
        throw new Error('No token received from server');
      }
      if (!response.data.user) {
        throw new Error('No user data received from server');
      }

      // Clear any existing values first
      localStorage.removeItem('raama-admin-token');
      localStorage.removeItem('raama-admin-user');
      
      // Set new values
      localStorage.setItem('raama-admin-token', response.data.token);
      localStorage.setItem('raama-admin-user', JSON.stringify(response.data.user));
      
      toast.success('Welcome to Admin Dashboard!');
      onLogin(response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-orange-500 mb-2" style={{ fontFamily: 'Macondo, cursive' }}>
            रामा Admin
          </h1>
          <p className="text-gray-400">Secure Administrative Access</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="admin@raama.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Admin Secret Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Secret Key <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={credentials.adminSecret}
                  onChange={(e) => setCredentials({...credentials, adminSecret: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Leave empty if not configured"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Access Admin Dashboard
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">
              🔒 This is a secure administrative area. All access attempts are logged.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>रामा Poetry Platform - Administrative Dashboard</p>
          <p>Unauthorized access is prohibited</p>
        </div>
      </div>
    </div>
  );
}