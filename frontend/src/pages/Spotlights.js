import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ShayariModal from '@/components/ShayariModal';
import axios from 'axios';
import { Crown, Star, Calendar, User, BookOpen, Eye, Heart, Share2 } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Spotlights({ theme, setTheme }) {
  const [spotlights, setSpotlights] = useState([]);
  const [selectedShayari, setSelectedShayari] = useState(null);
  const [showShayariModal, setShowShayariModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('raama-token');

  useEffect(() => {
    fetchSpotlights();
  }, []);

  const fetchSpotlights = async () => {
    try {
      const response = await axios.get(`${API}/spotlights/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSpotlights(response.data);
    } catch (error) {
      console.error('Error fetching spotlights:', error);
    } finally {
      setLoading(false);
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
              Writer Spotlights
            </h1>
            <p className="text-gray-400">Featured poets and their exceptional works</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {spotlights.map((spotlight) => (
                <div 
                  key={spotlight.id} 
                  className="glass-card p-6 lg:p-8 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"
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
                    <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-orange-500/20">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <User size={32} className="text-white" />
                      </div>
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

                  {/* Featured Shayaris */}
                  {spotlight.featuredShayaris && spotlight.featuredShayaris.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-orange-500 mb-4 flex items-center gap-2">
                        <BookOpen size={20} />
                        Featured Works
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {spotlight.featuredShayaris.map((shayari) => (
                          <div 
                            key={shayari.id}
                            className="p-4 bg-black/20 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-all cursor-pointer transform hover:scale-[1.02]"
                            onClick={() => handleShayariClick(shayari)}
                          >
                            <h5 className="font-bold text-orange-400 mb-2">{shayari.title}</h5>
                            <p className="text-gray-300 mb-3 line-clamp-3" style={{ fontFamily: 'Style Script, cursive', fontSize: '1rem' }}>
                              {shayari.content}
                            </p>
                            
                            {/* Tags */}
                            {shayari.tags && shayari.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {shayari.tags.slice(0, 3).map((tag, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Heart size={12} className="text-red-400" />
                                {shayari.likes || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={12} className="text-green-400" />
                                {shayari.views || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 size={12} className="text-blue-400" />
                                {shayari.shares || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {format(new Date(shayari.createdAt), 'MMM dd')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Featured Works */}
                  {(!spotlight.featuredShayaris || spotlight.featuredShayaris.length === 0) && (
                    <div className="text-center py-8 text-gray-400">
                      <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No featured works selected for this spotlight</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {spotlights.length === 0 && !loading && (
            <div className="glass-card p-8 text-center">
              <Crown size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-xl text-gray-400 mb-2">No active writer spotlights</p>
              <p className="text-gray-500">Check back later for featured writers and their exceptional works!</p>
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