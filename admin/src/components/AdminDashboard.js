import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  UserX, 
  Shield, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  LogOut,
  Edit,
  Ban,
  UserPlus,
  Mail,
  MailCheck,
  Key,
  Star,
  Award,
  Heart,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import axios from 'axios';
import ProfilePicture from './ProfilePicture';
import ProfilePictureModal from './ProfilePictureModal';

// Hardcode backend URL for now since environment variable is not being read in production
const BACKEND_URL = 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

console.log('Using hardcoded backend URL:', BACKEND_URL);
console.log('API endpoint:', API);

export default function AdminDashboard({ user, onLogout }) {
  console.log('AdminDashboard rendering with user:', user);
  
  const [stats, setStats] = useState({});
  const [writers, setWriters] = useState([]);
  const [readers, setReaders] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [shayaris, setShayaris] = useState([]);
  const [writerRequests, setWriterRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState(false);
  const [showChangeSecretModal, setShowChangeSecretModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'reader',
    adminSecret: ''
  });
  const [adminSettings, setAdminSettings] = useState({
    currentSecret: '',
    newSecret: '',
    confirmSecret: ''
  });
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [spotlights, setSpotlights] = useState([]);
  const [showCreateSpotlightModal, setShowCreateSpotlightModal] = useState(false);
  const [spotlightData, setSpotlightData] = useState({
    writerId: '',
    title: '',
    description: ''
  });
  
  const token = localStorage.getItem('raama-admin-token');
  console.log('Token from localStorage:', token ? 'Present' : 'Missing');
  console.log('Token length:', token?.length);
  console.log('Token starts with:', token?.substring(0, 20) + '...');

  useEffect(() => {
    // Test basic connectivity first
    const testConnection = async () => {
      try {
        console.log('Testing basic connection to:', BACKEND_URL);
        const response = await axios.get(BACKEND_URL);
        console.log('Backend connection test:', response.data);
      } catch (error) {
        console.error('Backend connection failed:', error);
      }
    };
    
    testConnection();
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    console.log('Starting fetchAllData...');
    console.log('Token:', token);
    console.log('API URL:', API);
    
    try {
      console.log('Making API calls...');
      const [statsRes, writersRes, readersRes, shayarisRes, requestsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/users/writers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/users/readers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/shayaris`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/writer-requests`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      console.log('API calls successful:', {
        stats: statsRes.data,
        writers: writersRes.data?.length,
        readers: readersRes.data?.length,
        shayaris: shayarisRes.data?.length,
        requests: requestsRes.data?.length
      });
      
      // Also fetch spotlights
      fetchSpotlights();
      
      setStats(statsRes.data);
      setWriters(writersRes.data);
      setReaders(readersRes.data);
      setShayaris(shayarisRes.data);
      setWriterRequests(requestsRes.data);

      // Fetch admins separately with proper error handling
      try {
        console.log('Fetching admins from:', `${API}/admin/users/admins`);
        const adminsRes = await axios.get(`${API}/admin/users/admins`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('Admins response:', adminsRes.data);
        setAdmins(adminsRes.data);
      } catch (adminError) {
        console.error('Error fetching admins:', adminError);
        console.error('Admin error details:', adminError.response?.data);
        setAdmins([]);
        toast.error('Failed to load admin users');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error('Failed to load dashboard data: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await axios.put(`${API}/writer-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Writer request approved!');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.put(`${API}/writer-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Writer request rejected');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handleDeleteShayari = async (shayariId) => {
    if (!window.confirm('Are you sure you want to delete this shayari?')) return;
    
    try {
      await axios.delete(`${API}/shayaris/${shayariId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Shayari deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete shayari');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    const action = isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      await axios.put(`${API}/admin/users/${userId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`User ${action}ed successfully`);
      fetchAllData();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      await axios.put(`${API}/admin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User role updated successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      if (newUser.role === 'admin') {
        // Use admin creation endpoint for admin users
        if (!newUser.adminSecret || newUser.adminSecret.length < 8) {
          toast.error('Admin secret must be at least 8 characters long');
          return;
        }
        await axios.post(`${API}/admin/create-admin`, newUser, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Use regular user creation for non-admin users
        await axios.post(`${API}/admin/users`, newUser, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      toast.success('User created successfully');
      setShowCreateUserModal(false);
      setNewUser({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        role: 'reader',
        adminSecret: ''
      });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/users/${selectedUser.id}`, selectedUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      setShowEditUserModal(false);
      setSelectedUser(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleProfilePictureClick = (profilePicture, userName) => {
    setSelectedProfilePicture(profilePicture);
    setSelectedUserName(userName);
    setShowProfilePictureModal(true);
  };

  const handleChangeAdminSecret = async (e) => {
    e.preventDefault();
    
    if (adminSettings.newSecret !== adminSettings.confirmSecret) {
      toast.error('New secrets do not match');
      return;
    }

    if (adminSettings.newSecret.length < 8) {
      toast.error('New secret must be at least 8 characters long');
      return;
    }

    try {
      await axios.put(`${API}/admin/change-secret`, {
        currentSecret: adminSettings.currentSecret,
        newSecret: adminSettings.newSecret
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Admin secret changed successfully!');
      setShowChangeSecretModal(false);
      setAdminSettings({ currentSecret: '', newSecret: '', confirmSecret: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change admin secret');
    }
  };

  const handleCreateAdmin = async (adminData) => {
    try {
      await axios.post(`${API}/admin/create-admin`, {
        ...adminData,
        role: 'admin'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Admin created successfully!');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create admin');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (adminId === user.id) {
      toast.error('You cannot delete your own admin account');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`${API}/admin/users/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete admin');
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
    }
  };

  const handleFeatureShayari = async (shayariId, shouldFeature) => {
    try {
      const endpoint = shouldFeature ? 'feature' : 'unfeature';
      await axios.put(`${API}/admin/shayaris/${shayariId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Shayari ${shouldFeature ? 'featured' : 'unfeatured'} successfully!`);
      fetchAllData();
    } catch (error) {
      toast.error(`Failed to ${shouldFeature ? 'feature' : 'unfeature'} shayari`);
    }
  };

  const handleCreateSpotlight = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/spotlights`, spotlightData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Writer spotlight created successfully!');
      setShowCreateSpotlightModal(false);
      setSpotlightData({ writerId: '', title: '', description: '' });
      fetchSpotlights();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create spotlight');
    }
  };

  const handleDeactivateSpotlight = async (spotlightId) => {
    if (!window.confirm('Are you sure you want to deactivate this spotlight?')) return;
    
    try {
      await axios.put(`${API}/admin/spotlights/${spotlightId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Spotlight deactivated successfully');
      fetchSpotlights();
    } catch (error) {
      toast.error('Failed to deactivate spotlight');
    }
  };

  const fetchSpotlights = async () => {
    try {
      const response = await axios.get(`${API}/spotlights`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpotlights(response.data);
    } catch (error) {
      console.error('Error fetching spotlights:', error);
    }
  };

  const handleVerifyAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to verify this admin\'s email?')) return;
    
    try {
      await axios.put(`${API}/admin/users/${adminId}/verify-email`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin email verified successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to verify admin email');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="glass-card p-6 hover:border-orange-500/50 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('500', '500/20')}`}>
          <Icon size={24} className={color} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Shield className="text-orange-500" size={24} />
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-orange-500" style={{ fontFamily: 'Macondo, cursive' }}>
                रामा Admin
              </h1>
              <p className="text-gray-400 text-sm">Welcome, {user.firstName}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all w-full lg:w-auto justify-center"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <nav className="flex overflow-x-auto scrollbar-hide px-4">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'profile', label: 'Profile', icon: Users },
              { id: 'admins', label: 'Admins', icon: Shield },
              { id: 'writers', label: 'Writers', icon: UserCheck },
              { id: 'readers', label: 'Readers', icon: Users },
              { id: 'shayaris', label: 'Shayaris', icon: BookOpen },
              { id: 'spotlights', label: 'Spotlights', icon: Award },
              { id: 'requests', label: 'Requests', icon: Clock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-orange-500 text-orange-500' 
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon size={18} />
                <span className="text-sm lg:text-base">{tab.label}</span>
                {tab.id === 'requests' && writerRequests.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    {writerRequests.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Platform Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Total Users"
                value={stats.totalUsers || 0}
                icon={Users}
                color="text-blue-500"
                subtitle="All registered users"
              />
              <StatCard
                title="Admins"
                value={stats.totalAdmins || 0}
                icon={Shield}
                color="text-purple-500"
                subtitle="System administrators"
              />
              <StatCard
                title="Writers"
                value={stats.totalWriters || 0}
                icon={UserCheck}
                color="text-green-500"
                subtitle="Active content creators"
              />
              <StatCard
                title="Readers"
                value={stats.totalReaders || 0}
                icon={Users}
                color="text-cyan-500"
                subtitle="Content consumers"
              />
              <StatCard
                title="Total Shayaris"
                value={stats.totalShayaris || 0}
                icon={BookOpen}
                color="text-orange-500"
                subtitle="Published content"
              />
            </div>

            {/* Pending Requests Alert */}
            {writerRequests.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="text-orange-500" size={24} />
                  <div>
                    <h3 className="font-semibold text-orange-500">Pending Writer Requests</h3>
                    <p className="text-gray-400">
                      {writerRequests.length} user{writerRequests.length > 1 ? 's' : ''} waiting for approval
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="ml-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    Review Requests
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Admin Profile</h2>
            
            {/* Profile Information Card */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-6 mb-6">
                <ProfilePicture 
                  user={user} 
                  size="xl" 
                  onClick={(profilePicture) => handleProfilePictureClick(profilePicture, `${user.firstName} ${user.lastName}`)}
                />
                <div>
                  <h3 className="text-2xl font-bold text-orange-500">{user.firstName} {user.lastName}</h3>
                  <p className="text-gray-400 text-lg">@{user.username}</p>
                  <p className="text-gray-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Shield size={16} className="text-purple-500" />
                    <span className="text-purple-400 font-medium">Administrator</span>
                    {user.emailVerified ? (
                      <MailCheck size={16} className="text-green-500" title="Email Verified" />
                    ) : (
                      <Mail size={16} className="text-gray-400" title="Email Not Verified" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Profile Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <button
                  onClick={async () => {
                    try {
                      const response = await axios.get(`${API}/admin/debug/current-user`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      console.log('Current admin user:', response.data);
                      const userData = response.data.current_user || response.data;
                      toast.success(`Debug Info: ${userData.email} (${userData.role})`);
                    } catch (error) {
                      console.error('Debug error:', error);
                      toast.error('Debug failed: ' + (error.response?.data?.detail || error.message));
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 hover:text-blue-300 transition-all"
                >
                  <Eye size={20} />
                  Debug Profile
                </button>
                
                <button
                  onClick={async () => {
                    if (!window.confirm('Verify your admin email?')) return;
                    try {
                      await axios.put(`${API}/admin/users/${user.id}/verify-email`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      toast.success('Your email has been verified!');
                      fetchAllData();
                    } catch (error) {
                      toast.error('Failed to verify email: ' + (error.response?.data?.detail || error.message));
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 hover:text-green-300 transition-all"
                >
                  <CheckCircle size={20} />
                  Verify Email
                </button>
                
                <button
                  onClick={() => setShowChangeSecretModal(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 hover:text-purple-300 transition-all"
                >
                  <Shield size={20} />
                  Change Secret
                </button>
                
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all"
                >
                  <Key size={20} />
                  Change Password
                </button>
                
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowEditUserModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-400 hover:text-orange-300 transition-all"
                >
                  <Edit size={20} />
                  Edit Profile
                </button>
              </div>
            </div>
            
            {/* Admin Statistics */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Your Admin Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{stats.totalUsers || 0}</p>
                  <p className="text-gray-400 text-sm">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{stats.totalWriters || 0}</p>
                  <p className="text-gray-400 text-sm">Writers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{stats.totalReaders || 0}</p>
                  <p className="text-gray-400 text-sm">Readers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">{stats.totalShayaris || 0}</p>
                  <p className="text-gray-400 text-sm">Shayaris</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Admin Management</h2>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!window.confirm('Verify all admin emails? This will mark all admins as verified.')) return;
                    try {
                      await axios.put(`${API}/admin/verify-all-admins`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      toast.success('All admin emails verified!');
                      fetchAllData();
                    } catch (error) {
                      toast.error('Failed to verify all admins: ' + (error.response?.data?.detail || error.message));
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-yellow-400 hover:text-yellow-300 transition-all"
                >
                  <MailCheck size={20} />
                  Verify All Admins
                </button>
                <button
                  onClick={() => {
                    setNewUser({ ...newUser, role: 'admin' });
                    setShowCreateUserModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
                >
                  <UserPlus size={20} />
                  Add Admin
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {console.log('Rendering admins:', admins, 'Count:', admins.length)}
              {admins.map(admin => (
                <div key={admin.id} className="glass-card p-6 border-2 border-purple-500/30">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <ProfilePicture 
                        user={admin} 
                        size="lg" 
                        onClick={(profilePicture) => handleProfilePictureClick(profilePicture, `${admin.firstName} ${admin.lastName}`)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{admin.firstName} {admin.lastName}</h3>
                          {admin.id === user.id && (
                            <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">You</span>
                          )}
                          {admin.emailVerified ? (
                            <MailCheck size={16} className="text-green-500" title="Email Verified" />
                          ) : (
                            <Mail size={16} className="text-gray-400" title="Email Not Verified" />
                          )}
                        </div>
                        <p className="text-purple-400 text-sm font-medium">@{admin.username}</p>
                        <p className="text-gray-400 text-sm">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!admin.emailVerified && (
                        <button
                          onClick={() => handleVerifyAdmin(admin.id)}
                          className="p-1 text-green-400 hover:text-green-300 transition-colors"
                          title="Verify Email"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {admin.id !== user.id && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUser(admin);
                              setShowEditUserModal(true);
                            }}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit Admin"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Admin"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <p>Joined: {format(new Date(admin.createdAt), 'MMM dd, yyyy')}</p>
                    <p>Role: <span className="text-purple-500 font-medium">Administrator</span></p>
                    <p>Status: <span className={admin.emailVerified ? 'text-green-500' : 'text-yellow-500'}>
                      {admin.emailVerified ? 'Verified' : 'Unverified'}
                    </span></p>
                  </div>
                  {/* <div className="flex gap-2">
                    <select
                      value={admin.role}
                      onChange={(e) => handleChangeUserRole(admin.id, e.target.value)}
                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                      disabled={admin.id === user.id}
                    >
                      <option value="reader">Reader</option>
                      <option value="writer">Writer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div> */}
                </div>
              ))}
            </div>
            
            {admins.length === 0 && (
              <div className="glass-card p-8 text-center">
                <Shield size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-xl text-gray-400 mb-4">No admins found</p>
                <p className="text-gray-500 mb-4">Stats show {stats.totalAdmins || 0} admins but none are loading.</p>
                <div className="space-y-3">
                  <button
                    onClick={fetchAllData}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
                  >
                    Refresh Data
                  </button>
                  <div className="text-left bg-gray-800/50 p-4 rounded-lg text-sm">
                    <p className="text-gray-300 mb-2">Debug Info:</p>
                    <p className="text-gray-400">• Current User: {user?.firstName} {user?.lastName} ({user?.email})</p>
                    <p className="text-gray-400">• User Role: {user?.role}</p>
                    <p className="text-gray-400">• Email Verified: {user?.emailVerified ? 'Yes' : 'No'}</p>
                    <p className="text-gray-400">• Stats Total Admins: {stats.totalAdmins || 0}</p>
                    <p className="text-gray-400">• Admins Array Length: {admins.length}</p>
                    <p className="text-gray-400">• API Endpoint: {`${API}/admin/users/admins`}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'writers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Writers Management</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
              >
                <UserPlus size={20} />
                Create User
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {writers.map(writer => (
                <div key={writer.id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <ProfilePicture 
                        user={writer} 
                        size="lg" 
                        onClick={(profilePicture) => handleProfilePictureClick(profilePicture, `${writer.firstName} ${writer.lastName}`)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{writer.firstName} {writer.lastName}</h3>
                          {writer.emailVerified ? (
                            <MailCheck size={16} className="text-green-500" title="Email Verified" />
                          ) : (
                            <Mail size={16} className="text-gray-400" title="Email Not Verified" />
                          )}
                        </div>
                        <p className="text-orange-400 text-sm font-medium">@{writer.username}</p>
                        <p className="text-gray-400 text-sm">{writer.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setSelectedUser(writer);
                          setShowEditUserModal(true);
                        }}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(writer.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <p>Joined: {format(new Date(writer.createdAt), 'MMM dd, yyyy')}</p>
                    <p>Role: <span className="text-green-500 font-medium">Writer</span></p>
                    <p>Status: <span className={writer.emailVerified ? 'text-green-500' : 'text-yellow-500'}>
                      {writer.emailVerified ? 'Verified' : 'Unverified'}
                    </span></p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={writer.role}
                      onChange={(e) => handleChangeUserRole(writer.id, e.target.value)}
                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                    >
                      <option value="reader">Reader</option>
                      <option value="writer">Writer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'readers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Readers Management</h2>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
              >
                <UserPlus size={20} />
                Create User
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readers.map(reader => (
                <div key={reader.id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <ProfilePicture 
                        user={reader} 
                        size="lg" 
                        onClick={(profilePicture) => handleProfilePictureClick(profilePicture, `${reader.firstName} ${reader.lastName}`)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{reader.firstName} {reader.lastName}</h3>
                          {reader.emailVerified ? (
                            <MailCheck size={16} className="text-green-500" title="Email Verified" />
                          ) : (
                            <Mail size={16} className="text-gray-400" title="Email Not Verified" />
                          )}
                        </div>
                        <p className="text-purple-400 text-sm font-medium">@{reader.username}</p>
                        <p className="text-gray-400 text-sm">{reader.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setSelectedUser(reader);
                          setShowEditUserModal(true);
                        }}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(reader.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <p>Joined: {format(new Date(reader.createdAt), 'MMM dd, yyyy')}</p>
                    <p>Role: <span className="text-purple-500 font-medium">Reader</span></p>
                    <p>Status: <span className={reader.emailVerified ? 'text-green-500' : 'text-yellow-500'}>
                      {reader.emailVerified ? 'Verified' : 'Unverified'}
                    </span></p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={reader.role}
                      onChange={(e) => handleChangeUserRole(reader.id, e.target.value)}
                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                    >
                      <option value="reader">Reader</option>
                      <option value="writer">Writer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shayaris' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Shayaris Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shayaris.map(shayari => (
                <div key={shayari.id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-orange-500">{shayari.title}</h3>
                      {shayari.isFeatured && (
                        <Star size={16} className="text-yellow-500" title="Featured" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeatureShayari(shayari.id, !shayari.isFeatured)}
                        className={`p-1 transition-colors ${
                          shayari.isFeatured 
                            ? 'text-yellow-500 hover:text-yellow-400' 
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                        title={shayari.isFeatured ? 'Unfeature' : 'Feature'}
                      >
                        <Star size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteShayari(shayari.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 line-clamp-3" style={{ fontFamily: 'Style Script, cursive' }}>
                    {shayari.content}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
                    <div>
                      <span className="text-white">By: {shayari.authorName}</span>
                      {shayari.authorUsername && (
                        <span className="text-orange-400 text-xs block">@{shayari.authorUsername}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart size={12} />
                        <span>{shayari.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 size={12} />
                        <span>{shayari.shares || 0}</span>
                      </div>
                      <span>{format(new Date(shayari.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'spotlights' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Writer Spotlights</h2>
              <button
                onClick={() => setShowCreateSpotlightModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all"
              >
                <Award size={20} />
                Create Spotlight
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spotlights.map(spotlight => (
                <div key={spotlight.id} className="glass-card p-6 border-2 border-yellow-500/30">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Award size={24} className="text-yellow-500" />
                      <div>
                        <h3 className="font-bold text-yellow-500">{spotlight.title}</h3>
                        <p className="text-gray-400 text-sm">@{spotlight.writerUsername}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeactivateSpotlight(spotlight.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Deactivate Spotlight"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                  <p className="text-gray-300 mb-4">{spotlight.description}</p>
                  <div className="text-sm text-gray-400">
                    <p>Writer: {spotlight.writerName}</p>
                    <p>Created: {format(new Date(spotlight.createdAt), 'MMM dd, yyyy')}</p>
                    <p className={`font-medium ${spotlight.isActive ? 'text-green-500' : 'text-red-500'}`}>
                      Status: {spotlight.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {spotlights.length === 0 && (
              <div className="glass-card p-8 text-center">
                <Award size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-xl text-gray-400 mb-4">No writer spotlights created</p>
                <p className="text-gray-500">Create spotlights to feature talented writers on the platform.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Writer Requests</h2>
            {writerRequests.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <p className="text-xl text-gray-400">No pending writer requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {writerRequests.map(request => (
                  <div key={request.id} className="glass-card p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                          {request.userName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{request.userName}</h3>
                          <p className="text-gray-400 text-sm">{request.userEmail}</p>
                          <p className="text-gray-500 text-xs">
                            Requested: {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 hover:text-green-300 transition-all"
                        >
                          <CheckCircle size={20} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all"
                        >
                          <XCircle size={20} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-orange-500 mb-6">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="reader">Reader</option>
                  <option value="writer">Writer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {/* Admin Secret Field - Only show for admin role */}
              {newUser.role === 'admin' && (
                <div>
                  <input
                    type="password"
                    placeholder="Admin Secret Key (min 8 characters)"
                    required
                    minLength={8}
                    value={newUser.adminSecret}
                    onChange={(e) => setNewUser({...newUser, adminSecret: e.target.value})}
                    className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-purple-400 text-xs mt-1">
                    This admin will use this secret key to login to the admin panel
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-orange-500 mb-6">Edit User</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={selectedUser.firstName}
                  onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={selectedUser.lastName}
                  onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="reader">Reader</option>
                  <option value="writer">Writer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailVerified"
                  checked={selectedUser.emailVerified || false}
                  onChange={(e) => setSelectedUser({...selectedUser, emailVerified: e.target.checked})}
                  className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="emailVerified" className="text-gray-300">Email Verified</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Admin Secret Modal */}
      {showChangeSecretModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-purple-500 mb-6 flex items-center gap-2">
              <Shield size={24} />
              Change Admin Secret
            </h3>
            <form onSubmit={handleChangeAdminSecret} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Admin Secret
                </label>
                <input
                  type="password"
                  required
                  value={adminSettings.currentSecret}
                  onChange={(e) => setAdminSettings({...adminSettings, currentSecret: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="Enter current admin secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Admin Secret
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={adminSettings.newSecret}
                  onChange={(e) => setAdminSettings({...adminSettings, newSecret: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="Enter new admin secret (min 8 chars)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Secret
                </label>
                <input
                  type="password"
                  required
                  value={adminSettings.confirmSecret}
                  onChange={(e) => setAdminSettings({...adminSettings, confirmSecret: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="Confirm new admin secret"
                />
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-purple-400 text-sm">
                  <strong>Security Notice:</strong>
                </p>
                <ul className="text-purple-300 text-xs mt-1 space-y-1">
                  <li>• This will change YOUR individual admin secret key</li>
                  <li>• You will need to use the new secret for future logins</li>
                  <li>• Other admins will keep their own secret keys</li>
                  <li>• Keep your secret key secure and private</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangeSecretModal(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
                >
                  <Shield size={16} />
                  Change Secret
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-red-500 mb-6 flex items-center gap-2">
              <Key size={24} />
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  placeholder="Enter new password (min 6 chars)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  placeholder="Confirm new password"
                />
              </div>
              
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
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
                >
                  <Key size={16} />
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Spotlight Modal */}
      {showCreateSpotlightModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
              <Award size={24} />
              Create Writer Spotlight
            </h3>
            <form onSubmit={handleCreateSpotlight} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Writer
                </label>
                <select
                  required
                  value={spotlightData.writerId}
                  onChange={(e) => setSpotlightData({...spotlightData, writerId: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                >
                  <option value="">Choose a writer...</option>
                  {writers.map(writer => (
                    <option key={writer.id} value={writer.id}>
                      {writer.firstName} {writer.lastName} (@{writer.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Spotlight Title
                </label>
                <input
                  type="text"
                  required
                  value={spotlightData.title}
                  onChange={(e) => setSpotlightData({...spotlightData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  placeholder="e.g., Writer of the Month"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={spotlightData.description}
                  onChange={(e) => setSpotlightData({...spotlightData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none resize-none"
                  placeholder="Describe why this writer deserves the spotlight..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateSpotlightModal(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-yellow-500/50 flex items-center justify-center gap-2"
                >
                  <Award size={16} />
                  Create Spotlight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Picture Modal */}
      <ProfilePictureModal 
        isOpen={showProfilePictureModal}
        onClose={() => setShowProfilePictureModal(false)}
        profilePicture={selectedProfilePicture}
        userName={selectedUserName}
      />
    </div>
  );
}