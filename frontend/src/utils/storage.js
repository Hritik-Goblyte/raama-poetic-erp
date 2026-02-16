// Utility functions for safe localStorage operations

export const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('raama-user');
    return userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

export const setUserInStorage = (user) => {
  try {
    localStorage.setItem('raama-user', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user data to localStorage:', error);
  }
};

export const getTokenFromStorage = () => {
  return localStorage.getItem('raama-token');
};

export const setTokenInStorage = (token) => {
  localStorage.setItem('raama-token', token);
};

export const clearStorage = () => {
  // Clear dashboard cache for all users
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('dashboard-cache-')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing dashboard cache:', error);
  }
  
  localStorage.removeItem('raama-user');
  localStorage.removeItem('raama-token');
};

export const getThemeFromStorage = () => {
  return localStorage.getItem('raama-theme') || 'dark';
};

export const setThemeInStorage = (theme) => {
  localStorage.setItem('raama-theme', theme);
};