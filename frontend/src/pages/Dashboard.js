import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import ShayariModal from '@/components/ShayariModal';
import api from '@/utils/axiosConfig';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Heart, Calendar, TrendingUp, Crown, Eye, Share2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { getUserFromStorage, getTokenFromStorage } from '@/utils/storage';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ theme, setTheme }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ myCreations: 0, totalShayaris: 0, totalWriters: 0, unreadNotifications: 0 });
  const [notifications, setNotifications] = useState([]);
  const [recentShayaris, setRecentShayaris] = useState([]);
  const [allShayaris, setAllShayaris] = useState([]);
  const [trendingShayaris, setTrendingShayaris] = useState([]);
  const [featuredShayaris, setFeaturedShayaris] = useState([]);
  const [showNewShayariModal, setShowNewShayariModal] = useState(false);
  const [newShayari, setNewShayari] = useState({ title: '', content: '' });
  const [selectedShayari, setSelectedShayari] = useState(null);
  const [showShayariModal, setShowShayariModal] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');
  const [loading, setLoading] = useState(false);
  
  // Safe user and token retrieval
  const user = getUserFromStorage();
  const token = getTokenFromStorage();

  // Redirect to login if no user or token
  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
  }, [user, token, navigate]);

  // Don't render if no user (will redirect)
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, notifsRes, shayarisRes, trendingRes, featuredRes] = await Promise.all([
        api.get(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`${API}/shayaris`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`${API}/shayaris/trending`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        api.get(`${API}/shayaris/featured`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setNotifications(notifsRes.data.slice(0, 5));
      setRecentShayaris(shayarisRes.data.slice(0, 2)); // Only 2 latest shayaris for recent section
      setAllShayaris(shayarisRes.data); // All shayaris without limit
      setTrendingShayaris(trendingRes.data.slice(0, 6));
      setFeaturedShayaris(featuredRes.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAllShayaris = async () => {
    if (allShayaris.length > 0) return; // Already loaded
    
    setLoading(true);
    try {
      const response = await api.get(`${API}/shayaris`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllShayaris(response.data);
    } catch (error) {
      console.error('Error fetching all shayaris:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShayari = async (e) => {
    e.preventDefault();
    try {
      // Show AI processing toast
      const processingToast = toast.loading('Creating shayari and processing with AI...', {
        duration: 10000
      });
      
      const response = await api.post(`${API}/shayaris`, newShayari, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Dismiss processing toast
      toast.dismiss(processingToast);
      
      // Show success message with AI results
      const shayari = response.data;
      if (shayari.aiProcessed) {
        toast.success('Shayari created successfully with AI analysis! 🤖✨', {
          description: 'Your shayari has been analyzed and enhanced by AI'
        });
      } else {
        toast.success('Shayari created successfully!', {
          description: 'AI analysis was not available'
        });
      }
      
      setShowNewShayariModal(false);
      setNewShayari({ title: '', content: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create shayari');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`${API}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notification dismissed');
    } catch (error) {
      toast.error('Failed to dismiss notification');
    }
  };

  const handleFloatingButton = () => {
    if (user?.role === 'writer') {
      setShowNewShayariModal(true);
    } else {
      toast.error('Only writers can create shayaris');
    }
  };

  // Test notification function (for demo purposes)
  const sendTestNotification = async () => {
    try {
      const testNotifications = [
        {
          type: 'like',
          message: 'राज ने आपकी शायरी को पसंद किया',
          shayariTitle: 'दिल की बात'
        },
        {
          type: 'follow',
          message: 'प्रिया शर्मा ने आपको फॉलो किया!',
          senderName: 'प्रिया शर्मा'
        },
        {
          type: 'feature',
          message: 'आपकी शायरी को फीचर किया गया!',
          shayariTitle: 'प्रेम की गाथा'
        },
        {
          type: 'comment',
          message: 'अमित ने आपकी शायरी पर टिप्पणी की',
          shayariTitle: 'खुशी के पल',
          senderName: 'अमित कुमार'
        },
        {
          type: 'spotlight',
          message: 'आपको Writer Spotlight में फीचर किया गया!',
          title: 'इस महीने के बेहतरीन शायर'
        }
      ];

      const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
      
      // Import and use the showToast function
      const { showToast } = await import('@/components/ToastNotification');
      showToast({
        ...randomNotification,
        duration: 6000
      });
      
      toast.success('Test notification sent! 🔔');
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Failed to send test notification');
    }
  };

  const handleShayariClick = async (shayari) => {
    // Record view
    try {
      await api.post(`${API}/shayaris/${shayari.id}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
    
    setSelectedShayari(shayari);
    setShowShayariModal(true);
  };

  const getDisplayShayaris = () => {
    switch (activeTab) {
      case 'all':
        return allShayaris;
      case 'trending':
        return trendingShayaris;
      case 'featured':
        return featuredShayaris;
      default:
        return recentShayaris;
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      fetchAllShayaris();
    }
  };

  return (
    <div className="flex" style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}>
      <Sidebar theme={theme} setTheme={setTheme} onNewShayari={() => setShowNewShayariModal(true)} />
      
      <div className="lg:ml-64 flex-1 p-4 lg:p-8 min-h-screen pt-16 lg:pt-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8" data-testid="dashboard-header">
            <h1 className="text-5xl font-bold mb-2" style={{ 
              fontFamily: 'Tillana, cursive',
              color: '#ff6b35'
            }}>
              रामा….
            </h1>
            <p className="text-2xl text-gray-400">Welcome you, <span className="text-white font-semibold">{user?.firstName?.split(' ')[0] || 'Guest'}</span></p>
            <p className="text-orange-500 font-semibold mt-1" data-testid="user-role">
              {user?.role === 'writer' ? 'Writer' : 'Reader'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="glass-card p-6" data-testid="stat-my-creations">
              <h3 className="text-gray-400 mb-2">My Creations</h3>
              <p className="text-4xl font-bold text-orange-500">{stats.myCreations}</p>
            </div>
            <div className="glass-card p-6" data-testid="stat-username">
              <h3 className="text-gray-400 mb-2">Username</h3>
              <p className="text-2xl font-bold">@{user?.username || 'N/A'}</p>
            </div>
            {/* <div className="glass-card p-6" data-testid="stat-total-shayaris">
              <h3 className="text-gray-400 mb-2">Total Shayaris</h3>
              <p className="text-4xl font-bold text-orange-500">{stats.totalShayaris}</p>
            </div> */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => handleTabChange('recent')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'recent'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Calendar size={18} />
                  Recent
                </button>
                <button
                  onClick={() => handleTabChange('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BookOpen size={18} />
                  All Shayaris
                </button>
                <button
                  onClick={() => handleTabChange('trending')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'trending'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TrendingUp size={18} />
                  Trending
                </button>
                <button
                  onClick={() => handleTabChange('featured')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'featured'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Crown size={18} />
                  Featured
                </button>
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ fontFamily: 'Macondo, cursive' }}>
                {activeTab === 'all' ? 'All Shayaris' : activeTab === 'trending' ? 'Trending Shayaris' : activeTab === 'featured' ? 'Featured Shayaris' : 'Recent Shayaris'}
              </h2>
              
              {loading && activeTab === 'all' ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : activeTab === 'recent' ? (
                // Recent Shayaris - 2 cards side by side
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="recent-shayaris-grid">
                  {getDisplayShayaris().map((shayari, index) => (
                    <div 
                      key={shayari.id} 
                      className="glass-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer transform hover:scale-[1.02]" 
                      data-testid="shayari-card"
                      onClick={() => handleShayariClick(shayari)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-orange-500 flex-1">{shayari.title}</h3>
                      </div>
                      <p className="text-gray-300 mb-4 line-clamp-2" style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}>
                        {shayari.content}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div>
                          <span className="text-white">{shayari.authorName}</span>
                          {shayari.authorUsername && (
                            <span className="text-orange-400 text-xs block">@{shayari.authorUsername}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart size={16} className="text-orange-500" />
                            {shayari.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            {format(new Date(shayari.createdAt), 'MMM dd')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'all' ? (
                // All Shayaris - Infinite Carousel
                <div className="relative overflow-hidden">
                  <div 
                    className="flex gap-4 animate-scroll-infinite"
                    style={{
                      animation: 'scroll 30s linear infinite',
                      width: `${allShayaris.length * 320}px`
                    }}
                  >
                    {/* Duplicate shayaris for seamless infinite scroll */}
                    {[...allShayaris, ...allShayaris].map((shayari, index) => (
                      <div 
                        key={`${shayari.id}-${index}`}
                        className="glass-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer transform hover:scale-[1.02] flex-shrink-0"
                        style={{ width: '300px' }}
                        data-testid="shayari-card"
                        onClick={() => handleShayariClick(shayari)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-orange-500 flex-1 line-clamp-2">{shayari.title}</h3>
                        </div>
                        <p className="text-gray-300 mb-4 line-clamp-2" style={{ fontFamily: 'Style Script, cursive', fontSize: '1rem' }}>
                          {shayari.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div>
                            <span className="text-white text-sm">{shayari.authorName}</span>
                            {shayari.authorUsername && (
                              <span className="text-orange-400 text-xs block">@{shayari.authorUsername}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Heart size={14} className="text-orange-500" />
                              {shayari.likes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {format(new Date(shayari.createdAt), 'MMM dd')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Other tabs (trending, featured) - Regular grid
                <div className="grid grid-cols-1 gap-4" data-testid="shayaris-list">
                  {getDisplayShayaris().map((shayari, index) => (
                  <div 
                    key={shayari.id} 
                    className="glass-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer transform hover:scale-[1.02]" 
                    data-testid="shayari-card"
                    onClick={() => handleShayariClick(shayari)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-orange-500 flex-1">{shayari.title}</h3>
                      {activeTab === 'trending' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs ml-2">
                          <TrendingUp size={12} />
                          #{index + 1}
                        </div>
                      )}
                      {activeTab === 'featured' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs ml-2">
                          <Crown size={12} />
                          Featured
                        </div>
                      )}
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-2" style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}>
                      {shayari.content}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div>
                        <span className="text-white">{shayari.authorName}</span>
                        {shayari.authorUsername && (
                          <span className="text-orange-400 text-xs block">@{shayari.authorUsername}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart size={16} className="text-orange-500" />
                          {shayari.likes || 0}
                        </span>
                        {(activeTab === 'trending' || activeTab === 'featured') && (
                          <>
                            <span className="flex items-center gap-1">
                              <Eye size={16} />
                              {shayari.views || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 size={16} />
                              {shayari.shares || 0}
                            </span>
                          </>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {format(new Date(shayari.createdAt), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:mt-0 mt-6">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ fontFamily: 'Macondo, cursive' }}>Notifications</h2>
              <div className="space-y-3" data-testid="notifications-panel">
                {notifications.length === 0 ? (
                  <div className="glass-card p-4 text-center text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`glass-card p-4 flex items-start justify-between gap-3 ${
                      !notif.read ? 'border-orange-500/50' : ''
                    }`} data-testid="notification-item">
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{format(new Date(notif.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                      <button
                        data-testid={`dismiss-notification-${notif.id}`}
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          data-testid="floating-new-shayari-button"
          onClick={handleFloatingButton}
          className="lg:flex hidden fixed bottom-12 right-8 w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl hover:shadow-orange-500/50 transition-all items-center justify-center z-40"
        >
          <Plus size={28} />
        </button>

        {/* Test Notification Button (for demo) */}
        <button
          onClick={sendTestNotification}
          className="lg:flex hidden fixed bottom-32 right-8 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all items-center justify-center z-40"
          title="Test Notification"
        >
          🔔
        </button>
      </div>

      <Dialog open={showNewShayariModal} onOpenChange={setShowNewShayariModal}>
        <DialogContent data-testid="new-shayari-modal" className="bg-gray-900 border-orange-500/30 max-w-2xl w-[95vw] lg:w-full m-2 lg:m-auto" aria-describedby="shayari-modal-description">
          <DialogHeader>
            <DialogTitle className="text-orange-500 text-3xl" style={{ fontFamily: 'Macondo, cursive' }}>Create New Shayari</DialogTitle>
          </DialogHeader>
          <p id="shayari-modal-description" className="sr-only">Form to create a new shayari with title and content fields</p>
          <form onSubmit={handleCreateShayari} className="space-y-4">
            <div>
              <input
                data-testid="shayari-title-input"
                type="text"
                placeholder="Shayari Title"
                required
                value={newShayari.title}
                onChange={(e) => setNewShayari({...newShayari, title: e.target.value})}
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <textarea
                data-testid="shayari-content-input"
                placeholder="Write your shayari here..."
                required
                rows={8}
                value={newShayari.content}
                onChange={(e) => setNewShayari({...newShayari, content: e.target.value})}
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}
              />
            </div>
            <button
              data-testid="create-shayari-submit"
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50"
            >
              Create Shayari
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <ShayariModal 
        shayari={selectedShayari}
        isOpen={showShayariModal}
        onClose={() => setShowShayariModal(false)}
      />
    </div>
  );
}