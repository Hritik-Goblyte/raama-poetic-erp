import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ProfilePicture from '@/components/ProfilePicture';
import NotificationSettings from '@/components/NotificationSettings';
import axios from 'axios';
import { User, Mail, Calendar, BookOpen, Award, Edit, Lock, Send, Eye, EyeOff, LogOut, BarChart3, TrendingUp, Heart, Share2, Users as UsersIcon, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Profile({ theme, setTheme }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ myCreations: 0 });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('raama-user') || '{}'));
  const token = localStorage.getItem('raama-token');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const endpoint = user.role === 'writer' ? '/analytics/writer' : '/analytics/reader';
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleBecomeWriter = async () => {
    setIsSubmittingRequest(true);
    try {
      await axios.post(`${API}/writer-requests`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Writer request submitted successfully! Admin will review your request.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit writer request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      await axios.put(`${API}/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Password changed successfully!');
      setShowChangePasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleProfilePictureUpdate = (newProfilePicture) => {
    const updatedUser = { ...user, profilePicture: newProfilePicture };
    setUser(updatedUser);
    localStorage.setItem('raama-user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
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
    
    localStorage.removeItem('raama-token');
    localStorage.removeItem('raama-user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex" style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}>
      <Sidebar theme={theme} setTheme={setTheme} onNewShayari={() => {}} />
      
      <div className="lg:ml-64 flex-1 p-4 lg:p-8 min-h-screen pt-16 lg:pt-8 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-5xl font-bold mb-2" style={{ 
              fontFamily: 'Macondo, cursive',
              color: '#ff6b35'
            }}>
              Profile
            </h1>
            <p className="text-gray-400">Your account information</p>
          </div>

          <div data-testid="profile-container" className="space-y-6">
            <div className="glass-card p-8">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6">
                <div className="mx-auto lg:mx-0">
                  <ProfilePicture 
                    user={user} 
                    size="2xl" 
                    editable={true}
                    onUpdate={handleProfilePictureUpdate}
                  />
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-1">{user.firstName} {user.lastName}</h2>
                  <p className="text-orange-500 font-semibold text-lg">@{user.username}</p>
                  <p className="text-gray-400 capitalize">{user.role}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col lg:flex-col gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => setShowNotificationSettings(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-400 hover:text-purple-300 transition-all"
                  >
                    <Bell size={16} />
                    Notifications
                  </button>
                  
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all"
                  >
                    <Lock size={16} />
                    Change Password
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-all"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                  
                  {user.role === 'reader' && (
                    <button
                      onClick={handleBecomeWriter}
                      disabled={isSubmittingRequest}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 hover:border-orange-500/50 rounded-lg text-orange-400 hover:text-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit size={16} />
                      {isSubmittingRequest ? 'Submitting...' : 'Become Writer'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300" data-testid="profile-email">
                  <Mail size={20} className="text-orange-500" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300" data-testid="profile-role">
                  <User size={20} className="text-orange-500" />
                  <span className="capitalize">{user.role}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300" data-testid="profile-joined">
                  <Calendar size={20} className="text-orange-500" />
                  <span>Joined {user.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy') : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-8">
              <h3 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Macondo, cursive' }}>Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center" data-testid="profile-stat-creations">
                  <BookOpen size={32} className="text-orange-500 mx-auto mb-2" />
                  <p className="text-4xl font-bold text-orange-500">{stats.myCreations}</p>
                  <p className="text-gray-400 mt-1">Shayaris Created</p>
                </div>
                <div className="text-center" data-testid="profile-stat-role">
                  <Award size={32} className="text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold capitalize">{user.role}</p>
                  <p className="text-gray-400 mt-1">Role</p>
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Macondo, cursive' }}>
                  <BarChart3 className="text-orange-500" />
                  Analytics
                </h3>
                <button
                  onClick={fetchAnalytics}
                  disabled={loadingAnalytics}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 hover:border-orange-500/50 rounded-lg text-orange-400 hover:text-orange-300 transition-all disabled:opacity-50"
                >
                  <TrendingUp size={16} />
                  {loadingAnalytics ? 'Loading...' : 'Load Analytics'}
                </button>
              </div>

              {loadingAnalytics ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : analyticsData ? (
                <div className="space-y-6">
                  {/* Analytics Overview */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {user.role === 'writer' ? (
                      <>
                        <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <BookOpen size={24} className="text-blue-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-400">{analyticsData.totalShayaris || 0}</p>
                          <p className="text-gray-400 text-sm">Total Shayaris</p>
                        </div>
                        <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                          <Heart size={24} className="text-red-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-red-400">{analyticsData.totalLikes || 0}</p>
                          <p className="text-gray-400 text-sm">Total Likes</p>
                        </div>
                        <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                          <Eye size={24} className="text-green-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-400">{analyticsData.totalViews || 0}</p>
                          <p className="text-gray-400 text-sm">Total Views</p>
                        </div>
                        <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <UsersIcon size={24} className="text-purple-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-purple-400">{analyticsData.followerCount || 0}</p>
                          <p className="text-gray-400 text-sm">Followers</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                          <Eye size={24} className="text-green-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-400">{analyticsData.totalViews || 0}</p>
                          <p className="text-gray-400 text-sm">Shayaris Read</p>
                        </div>
                        <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                          <Heart size={24} className="text-red-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-red-400">{analyticsData.totalLikes || 0}</p>
                          <p className="text-gray-400 text-sm">Likes Given</p>
                        </div>
                        <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <Share2 size={24} className="text-blue-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-400">{analyticsData.totalShares || 0}</p>
                          <p className="text-gray-400 text-sm">Shares Made</p>
                        </div>
                        <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <UsersIcon size={24} className="text-purple-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-purple-400">{analyticsData.followingCount || 0}</p>
                          <p className="text-gray-400 text-sm">Following</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Engagement Metrics */}
                  {user.role === 'writer' && analyticsData.totalShayaris > 0 && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-3 text-orange-400">Engagement Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-400">Avg. Likes per Shayari</p>
                          <p className="text-xl font-bold text-red-400">
                            {Math.round((analyticsData.totalLikes / analyticsData.totalShayaris) * 10) / 10}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400">Avg. Views per Shayari</p>
                          <p className="text-xl font-bold text-green-400">
                            {Math.round((analyticsData.totalViews / analyticsData.totalShayaris) * 10) / 10}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400">Engagement Rate</p>
                          <p className="text-xl font-bold text-orange-400">
                            {analyticsData.totalViews > 0 
                              ? Math.round((analyticsData.totalLikes / analyticsData.totalViews) * 100 * 10) / 10
                              : 0
                            }%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 size={48} className="text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Click "Load Analytics" to view your detailed statistics</p>
                  <p className="text-gray-500 text-sm">
                    {user.role === 'writer' 
                      ? 'See your writing performance, engagement metrics, and follower insights'
                      : 'View your reading activity, likes given, and favorite authors'
                    }
                  </p>
                </div>
              )}
            </div>

            {user.role === 'reader' && (
              <div className="glass-card p-6 bg-orange-500/10 border-orange-500/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-500 mb-2">Upgrade to Writer</h3>
                    <p className="text-gray-300">You are currently a <span className="font-bold text-orange-500">Reader</span>. Become a writer to create and share your own shayaris!</p>
                  </div>
                  <button
                    onClick={handleBecomeWriter}
                    disabled={isSubmittingRequest}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
                  >
                    <Send size={20} />
                    {isSubmittingRequest ? 'Submitting...' : 'Request Writer Access'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="bg-gray-900 border-orange-500/30 max-w-md w-[95vw] lg:w-full m-2 lg:m-auto" aria-describedby="change-password-description">
          <DialogHeader>
            <DialogTitle className="text-orange-500 text-2xl flex items-center gap-2">
              <Lock size={24} />
              Change Password
            </DialogTitle>
          </DialogHeader>
          <p id="change-password-description" className="sr-only">Form to change your account password</p>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-3 pr-12 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 pr-12 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                  placeholder="Enter new password (min 6 chars)"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 pr-12 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-sm">
                <strong>Password Requirements:</strong>
              </p>
              <ul className="text-blue-300 text-xs mt-1 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Must match confirmation</li>
                <li>• Different from current password</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Modal */}
      <NotificationSettings 
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </div>
  );
}