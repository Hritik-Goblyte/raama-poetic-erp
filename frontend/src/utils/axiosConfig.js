import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance
const api = axios.create();

// Response interceptor to handle role changes and authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.detail || '';
      
      // Check if it's a role change error
      if (errorMessage.includes('role has been updated') || errorMessage.includes('log out and log back in')) {
        // Clear user data and redirect to login
        localStorage.removeItem('raama-token');
        localStorage.removeItem('raama-user');
        
        toast.success('Your account has been updated! Please log in again to access new features.');
        
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        
        return Promise.reject(error);
      }
      
      // Handle other 401 errors (token expired, etc.)
      if (errorMessage.includes('Token expired') || errorMessage.includes('Invalid token')) {
        localStorage.removeItem('raama-token');
        localStorage.removeItem('raama-user');
        
        toast.error('Your session has expired. Please log in again.');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;