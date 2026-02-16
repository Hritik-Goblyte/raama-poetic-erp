import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import WriterProfileModal from '@/components/WriterProfileModal';
import ProfilePicture from '@/components/ProfilePicture';
import ProfilePictureModal from '@/components/ProfilePictureModal';
import axios from 'axios';
import { Users, BookOpen, Calendar, Crown, Star, UserPlus, UserCheck, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Writers({ theme, setTheme }) {
  const [writers, setWriters] = useState([]);
  const [writerStats, setWriterStats] = useState({});
  const [followingStatus, setFollowingStatus] = useState({});
  const [spotlights, setSpotlights] = useState([]);
  const [selectedWriter, setSelectedWriter] = useState(null);
  const [showWriterModal, setShowWriterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [activeTab, setActiveTab] = useState('writers');
  const token = localStorage.getItem('raama-token');
  const currentUser = JSON.parse(localStorage.getItem('raama-user') || '{}');

  useEffect(() => {
    fetchWriters();
    fetchSpotlights();
    fetchFollowingStatus();
  }, []);

  const fetchWriters = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/users/writers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sort writers to pin current user to top
      const sortedWriters = response.data.sort((a, b) => {
        if (a.id === currentUser.id) return -1; // Current user first
        if (b.id === currentUser.id) return 1;  // Current user first
        return 0; // Keep original order for others
      });
      
      setWriters(sortedWriters);
      
      // Fetch shayari counts for each writer
      const stats = {};
      await Promise.all(
        sortedWriters.map(async (writer) => {
          try {
            const shayariResponse = await axios.get(`${API}/shayaris/author/${writer.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            stats[writer.id] = shayariResponse.data.length;
          } catch (error) {
            stats[writer.id] = 0;
          }
        })
      );
      setWriterStats(stats);
    } catch (error) {
      console.error('Error fetching writers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpotlights = async () => {
    try {
      const response = await axios.get(`${API}/spotlights/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpotlights(response.data);
    } catch (error) {
      console.error('Error fetching spotlights:', error);
    }
  };

  const fetchFollowingStatus = async () => {
    try {
      const response = await axios.get(`${API}/following`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const followingMap = {};
      response.data.forEach(user => {
        followingMap[user.id] = true;
      });
      setFollowingStatus(followingMap);
    } catch (error) {
      console.error('Error fetching following status:', error);
    }
  };

  const handleFollowToggle = async (writerId, e) => {
    e.stopPropagation(); // Prevent writer card click
    
    try {
      const isFollowing = followingStatus[writerId];
      
      if (isFollowing) {
        await axios.delete(`${API}/unfollow/${writerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFollowingStatus(prev => ({ ...prev, [writerId]: false }));
        toast.success('Unfollowed successfully');
      } else {
        await axios.post(`${API}/follow/${writerId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFollowingStatus(prev => ({ ...prev, [writerId]: true }));
        toast.success('Following successfully');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update follow status');
    }
  };

  const handleWriterClick = (writer) => {
    setSelectedWriter(writer);
    setShowWriterModal(true);
  };

  const handleProfilePictureClick = (e, profilePicture, userName) => {
    e.stopPropagation(); // Prevent writer card click
    setSelectedProfilePicture(profilePicture);
    setSelectedUserName(userName);
    setShowProfilePictureModal(true);
  };

  return (
    <div className="flex" style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}>
      <Sidebar theme={theme} setTheme={setTheme} onNewShayari={() => {}} />
      
      <div className="lg:ml-64 flex-1 p-4 lg:p-8 min-h-screen pt-16 lg:pt-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-5xl font-bold mb-2" style={{ 
              fontFamily: 'Macondo, cursive',
              color: '#ff6b35'
            }}>
              Writers
            </h1>
            <p className="text-gray-400">Explore our talented writers and featured spotlights</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setActiveTab('writers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'writers'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users size={20} />
              All Writers
            </button>
            <button
              onClick={() => setActiveTab('spotlights')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'spotlights'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown size={20} />
              Spotlights
              {spotlights.length > 0 && (
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                  {spotlights.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'writers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6" data-testid="writers-list">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : writers.length === 0 ? (
                <div className="col-span-full glass-card p-8 text-center">
                  <p className="text-xl text-gray-400">No writers found.</p>
                </div>
              ) : (
                writers.map((writer, index) => {
                  const isCurrentUser = currentUser.id === writer.id;
                  return (
                    <div 
                      key={writer.id} 
                      className={`glass-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer transform hover:scale-[1.02] group slide-in-up ${
                        isCurrentUser ? 'border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-orange-600/5' : ''
                      }`}
                      data-testid="writer-card"
                      onClick={() => handleWriterClick(writer)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div onClick={(e) => writer.profilePicture && handleProfilePictureClick(e, writer.profilePicture, `${writer.firstName} ${writer.lastName}`)}>
                          <ProfilePicture 
                            user={writer} 
                            size="xl" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold group-hover:text-orange-400 transition-colors">
                                {writer.firstName} {writer.lastName}
                                {isCurrentUser && <span className="text-orange-400 text-sm ml-2">(you)</span>}
                              </h3>
                              <p className="text-sm text-orange-500 font-medium">@{writer.username}</p>
                              <p className="text-sm text-gray-400 truncate">{writer.email}</p>
                            </div>
                            
                            {/* Follow Button - Always visible for non-current users */}
                            {!isCurrentUser && (
                              <button
                                onClick={(e) => handleFollowToggle(writer.id, e)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shrink-0 ${
                                  followingStatus[writer.id]
                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50'
                                }`}
                                title={followingStatus[writer.id] ? 'Click to unfollow' : 'Click to follow'}
                              >
                                {followingStatus[writer.id] ? (
                                  <>
                                    <UserCheck size={16} />
                                    <span>Following</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus size={16} />
                                    <span>Follow</span>
                                  </>
                                )}
                              </button>
                            )}
                            
                            {/* Current User Indicator */}
                            {isCurrentUser && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm border border-orange-500/30 shrink-0">
                                <User size={16} />
                                <span>You</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Users size={16} className="text-orange-500" />
                          <span className="capitalize">{writer.role}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <BookOpen size={16} className="text-orange-500" />
                          {writerStats[writer.id] || 0} Shayaris
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar size={16} className="text-orange-500" />
                          Joined {format(new Date(writer.createdAt), 'MMM yyyy')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'spotlights' && (
            <div className="space-y-8">
              {spotlights.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Crown size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-xl text-gray-400 mb-2">No active writer spotlights</p>
                  <p className="text-gray-500">Check back later for featured writers and their exceptional works!</p>
                </div>
              ) : (
                spotlights.map((spotlight, index) => (
                  <div 
                    key={spotlight.id} 
                    className="glass-card p-6 lg:p-8 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 slide-in-up"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    {/* Spotlight Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-full">
                          <Crown size={32} className="text-yellow-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-bold text-yellow-400 mb-1" style={{ fontFamily: 'Macondo, cursive' }}>
                            {spotlight.title}
                          </h2>
                          <p className="text-gray-300">{spotlight.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={16} />
                        <span>
                          {format(new Date(spotlight.startDate), 'MMM dd')} - 
                          {spotlight.endDate ? format(new Date(spotlight.endDate), 'MMM dd') : 'Ongoing'}
                        </span>
                      </div>
                    </div>

                    {/* Writer Info */}
                    {spotlight.writer && (
                      <div 
                        className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-orange-500/20 cursor-pointer hover:bg-white/10 transition-all"
                        onClick={() => handleWriterClick(spotlight.writer)}
                      >
                        <ProfilePicture 
                          user={spotlight.writer} 
                          size="xl" 
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{spotlight.writer.firstName} {spotlight.writer.lastName}</h3>
                          <p className="text-orange-400 font-medium">@{spotlight.writer.username}</p>
                          <p className="text-gray-400 text-sm">Featured Writer</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                            <Star size={16} className="text-yellow-400" />
                            <span>Spotlight Writer</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Member since {format(new Date(spotlight.writer.createdAt), 'MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Featured Works Count */}
                    {spotlight.featuredShayaris && spotlight.featuredShayaris.length > 0 && (
                      <div className="text-center py-4 bg-black/20 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-orange-400">
                          <BookOpen size={20} />
                          <span className="font-semibold">{spotlight.featuredShayaris.length} Featured Works</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">Click on the writer to view their profile and works</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <WriterProfileModal 
        writer={selectedWriter}
        isOpen={showWriterModal}
        onClose={() => setShowWriterModal(false)}
      />

      <ProfilePictureModal 
        isOpen={showProfilePictureModal}
        onClose={() => setShowProfilePictureModal(false)}
        profilePicture={selectedProfilePicture}
        userName={selectedUserName}
      />
    </div>
  );
}