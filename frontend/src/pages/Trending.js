import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ShayariModal from '@/components/ShayariModal';
import axios from 'axios';
import { TrendingUp, Star, Shuffle, Heart, Eye, Share2, Calendar, Crown } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Trending({ theme, setTheme }) {
  const [trendingShayaris, setTrendingShayaris] = useState([]);
  const [featuredShayaris, setFeaturedShayaris] = useState([]);
  const [randomShayari, setRandomShayari] = useState(null);
  const [selectedShayari, setSelectedShayari] = useState(null);
  const [showShayariModal, setShowShayariModal] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('raama-token');

  useEffect(() => {
    fetchTrendingShayaris();
    fetchFeaturedShayaris();
  }, []);

  const fetchTrendingShayaris = async () => {
    try {
      const response = await axios.get(`${API}/shayaris/trending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrendingShayaris(response.data);
    } catch (error) {
      console.error('Error fetching trending shayaris:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedShayaris = async () => {
    try {
      const response = await axios.get(`${API}/shayaris/featured`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeaturedShayaris(response.data);
    } catch (error) {
      console.error('Error fetching featured shayaris:', error);
    }
  };

  const fetchRandomShayari = async () => {
    try {
      const response = await axios.get(`${API}/shayaris/random`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRandomShayari(response.data);
    } catch (error) {
      console.error('Error fetching random shayari:', error);
    }
  };

  const handleShayariClick = async (shayari) => {
    // Record view
    try {
      await axios.post(`${API}/shayaris/${shayari.id}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
    
    setSelectedShayari(shayari);
    setShowShayariModal(true);
  };

  const getEngagementScore = (shayari) => {
    return (shayari.likes || 0) + (shayari.shares || 0) + Math.floor((shayari.views || 0) * 0.1);
  };

  const displayShayaris = activeTab === 'featured' ? featuredShayaris : trendingShayaris;

  return (
    <div className="flex" style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}>
      <Sidebar theme={theme} setTheme={setTheme} onNewShayari={() => {}} />
      
      <div className="lg:ml-64 flex-1 p-4 lg:p-8 min-h-screen pt-24 lg:pt-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-5xl font-bold mb-2" style={{ 
              fontFamily: 'Macondo, cursive',
              color: '#ff6b35'
            }}>
              Discover
            </h1>
            <p className="text-gray-400">Trending and featured poetry</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'trending'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp size={20} />
              Trending
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'featured'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown size={20} />
              Featured
            </button>
            <button
              onClick={fetchRandomShayari}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
            >
              <Shuffle size={20} />
              Surprise Me
            </button>
          </div>

          {/* Random Shayari Banner */}
          {randomShayari && (
            <div className="glass-card p-6 mb-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Shuffle className="text-purple-400" size={24} />
                <h2 className="text-2xl font-bold text-purple-400" style={{ fontFamily: 'Macondo, cursive' }}>
                  Random Discovery
                </h2>
              </div>
              <div 
                className="cursor-pointer"
                onClick={() => handleShayariClick(randomShayari)}
              >
                <h3 className="text-xl font-bold text-orange-500 mb-3">{randomShayari.title}</h3>
                <p className="text-gray-300 mb-4 line-clamp-3" style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}>
                  {randomShayari.content}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div>
                    <span className="text-white">{randomShayari.authorName}</span>
                    <span className="text-orange-400 text-xs block">@{randomShayari.authorUsername}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart size={16} className="text-orange-500" />
                      {randomShayari.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={16} />
                      {randomShayari.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 size={16} />
                      {randomShayari.shares}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {displayShayaris.map((shayari, index) => (
                <div 
                  key={shayari.id} 
                  className="glass-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer transform hover:scale-[1.01]"
                  onClick={() => handleShayariClick(shayari)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {activeTab === 'trending' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                            <TrendingUp size={12} />
                            #{index + 1}
                          </div>
                        )}
                        {activeTab === 'featured' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                            <Crown size={12} />
                            Featured
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-orange-500">{shayari.title}</h3>
                      </div>
                      <p className="text-gray-300 mb-4 line-clamp-3" style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}>
                        {shayari.content}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {shayari.tags && shayari.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {shayari.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats and Author */}
                  <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
                    <div>
                      <span className="text-white">{shayari.authorName}</span>
                      <span className="text-orange-400 text-xs block">@{shayari.authorUsername}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart size={16} className="text-orange-500" />
                        {shayari.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={16} />
                        {shayari.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 size={16} />
                        {shayari.shares || 0}
                      </span>
                      {activeTab === 'trending' && (
                        <span className="flex items-center gap-1 text-orange-400">
                          <TrendingUp size={16} />
                          {getEngagementScore(shayari)}
                        </span>
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

          {displayShayaris.length === 0 && !loading && (
            <div className="glass-card p-8 text-center">
              {activeTab === 'trending' ? (
                <>
                  <TrendingUp size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-xl text-gray-400">No trending shayaris found.</p>
                  <p className="text-gray-500 mt-2">Check back later for trending content!</p>
                </>
              ) : (
                <>
                  <Crown size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-xl text-gray-400">No featured shayaris available.</p>
                  <p className="text-gray-500 mt-2">Admins will feature exceptional poetry here!</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <ShayariModal 
        shayari={selectedShayari}
        isOpen={showShayariModal}
        onClose={() => setShowShayariModal(false)}
      />
    </div>
  );
}