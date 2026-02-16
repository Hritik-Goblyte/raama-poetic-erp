import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ShayariModal from '@/components/ShayariModal';
import ProfilePicture from '@/components/ProfilePicture';
import ProfilePictureModal from '@/components/ProfilePictureModal';
import { X, Calendar, BookOpen, Heart, User, Pen, Award, Star } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function WriterProfileModal({ writer, isOpen, onClose }) {
  const [writerShayaris, setWriterShayaris] = useState([]);
  const [writerSpotlights, setWriterSpotlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSpotlights, setLoadingSpotlights] = useState(false);
  const [selectedShayari, setSelectedShayari] = useState(null);
  const [showShayariModal, setShowShayariModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [activeTab, setActiveTab] = useState('shayaris');
  const token = localStorage.getItem('raama-token');
  const currentUser = JSON.parse(localStorage.getItem('raama-user') || '{}');

  useEffect(() => {
    if (isOpen && writer) {
      fetchWriterShayaris();
      fetchWriterSpotlights();
    }
  }, [isOpen, writer]);

  const fetchWriterShayaris = async () => {
    if (!writer) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/shayaris/author/${writer.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWriterShayaris(response.data);
    } catch (error) {
      console.error('Error fetching writer shayaris:', error);
      toast.error('Failed to load writer\'s shayaris');
    } finally {
      setLoading(false);
    }
  };

  const fetchWriterSpotlights = async () => {
    if (!writer) return;
    
    setLoadingSpotlights(true);
    try {
      const response = await axios.get(`${API}/spotlights/writer/${writer.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWriterSpotlights(response.data);
    } catch (error) {
      console.error('Error fetching writer spotlights:', error);
    } finally {
      setLoadingSpotlights(false);
    }
  };

  const handleShayariClick = (shayari) => {
    setSelectedShayari(shayari);
    setShowShayariModal(true);
  };

  const handleProfilePictureClick = () => {
    if (writer?.profilePicture) {
      setShowProfilePictureModal(true);
    }
  };

  const isCurrentUser = currentUser.id === writer?.id;

  if (!writer) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="bg-gray-900/95 backdrop-blur-xl border-orange-500/30 max-w-6xl max-h-[95vh] w-[98vw] lg:w-full p-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 m-1 lg:m-auto"
          aria-describedby="writer-profile-modal-description"
        >
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>

            {/* Writer Profile Header */}
            <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 p-4 lg:p-8 border-b border-orange-500/20">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-6">
                <div onClick={handleProfilePictureClick}>
                  <ProfilePicture 
                    user={writer} 
                    size="2xl" 
                  />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl lg:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Macondo, cursive' }}>
                    {writer.firstName} {writer.lastName}
                    {isCurrentUser && <span className="text-orange-400 text-base lg:text-lg ml-3">(you)</span>}
                  </h2>
                  <p className="text-orange-400 text-xl font-semibold mb-1">@{writer.username}</p>
                  <p className="text-gray-300 text-lg mb-2">{writer.email}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 justify-center lg:justify-start">
                    <span className="flex items-center gap-1">
                      <Pen size={16} className="text-orange-500" />
                      <span className="capitalize">{writer.username}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={16} className="text-orange-500" />
                      <span className="capitalize">{writer.role}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} className="text-orange-500" />
                      Joined {format(new Date(writer.createdAt), 'MMMM yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={16} className="text-orange-500" />
                      {writerShayaris.length} Shayaris
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shayaris Section */}
            <div className="p-4 lg:p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('shayaris')}
                  className={`pb-3 px-2 font-semibold transition-all ${
                    activeTab === 'shayaris'
                      ? 'text-orange-500 border-b-2 border-orange-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} />
                    <span>Shayaris ({writerShayaris.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('spotlights')}
                  className={`pb-3 px-2 font-semibold transition-all ${
                    activeTab === 'spotlights'
                      ? 'text-orange-500 border-b-2 border-orange-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Award size={18} />
                    <span>Spotlights ({writerSpotlights.length})</span>
                  </div>
                </button>
              </div>

              {/* Shayaris Tab */}
              {activeTab === 'shayaris' && (
                <>
                  <h3 className="text-2xl font-bold mb-6 text-orange-500" style={{ fontFamily: 'Macondo, cursive' }}>
                    {isCurrentUser ? 'Your Shayaris' : `${writer.firstName}'s Shayaris`}
                  </h3>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                      <p className="text-gray-400">Loading shayaris...</p>
                    </div>
                  ) : writerShayaris.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen size={48} className="mx-auto text-gray-500 mb-4" />
                      <p className="text-xl text-gray-400 mb-2">
                        {isCurrentUser ? "You haven't created any shayaris yet." : `${writer.firstName} hasn't shared any shayaris yet.`}
                      </p>
                      {isCurrentUser && (
                        <p className="text-gray-500">Start creating beautiful poetry to share with the world!</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {writerShayaris.map((shayari) => (
                        <div 
                          key={shayari.id}
                          className="glass-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer transform hover:scale-[1.02]"
                          onClick={() => handleShayariClick(shayari)}
                        >
                          <h4 className="text-xl font-bold mb-3 text-orange-500">{shayari.title}</h4>
                          <p 
                            className="text-gray-300 mb-4 line-clamp-3"
                            style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}
                          >
                            {shayari.content}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
                            <span className="flex items-center gap-1">
                              <Heart size={16} className="text-orange-500" />
                              {shayari.likes} likes
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={16} />
                              {format(new Date(shayari.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Spotlights Tab */}
              {activeTab === 'spotlights' && (
                <>
                  <h3 className="text-2xl font-bold mb-6 text-yellow-500" style={{ fontFamily: 'Macondo, cursive' }}>
                    {isCurrentUser ? 'Your Spotlight History' : `${writer.firstName}'s Spotlight History`}
                  </h3>

                  {loadingSpotlights ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
                      <p className="text-gray-400">Loading spotlights...</p>
                    </div>
                  ) : writerSpotlights.length === 0 ? (
                    <div className="text-center py-12">
                      <Award size={48} className="mx-auto text-gray-500 mb-4" />
                      <p className="text-xl text-gray-400 mb-2">
                        {isCurrentUser ? "You haven't been featured in any spotlights yet." : `${writer.firstName} hasn't been featured in any spotlights yet.`}
                      </p>
                      <p className="text-gray-500">Keep creating amazing content to get featured!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {writerSpotlights.map((spotlight) => (
                        <div 
                          key={spotlight.id}
                          className={`glass-card p-6 border-2 ${
                            spotlight.isActive 
                              ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5' 
                              : 'border-gray-700/30 opacity-75'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${
                              spotlight.isActive ? 'bg-yellow-500/20' : 'bg-gray-700/20'
                            }`}>
                              <Award size={24} className={spotlight.isActive ? 'text-yellow-400' : 'text-gray-500'} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className={`text-xl font-bold ${
                                  spotlight.isActive ? 'text-yellow-400' : 'text-gray-400'
                                }`}>
                                  {spotlight.title}
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  spotlight.isActive 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-gray-700/20 text-gray-400'
                                }`}>
                                  {spotlight.isActive ? 'Active' : 'Ended'}
                                </span>
                              </div>
                              <p className="text-gray-300 mb-4">{spotlight.description}</p>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  Started: {format(new Date(spotlight.startDate), 'MMM dd, yyyy')}
                                </span>
                                {spotlight.endDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {spotlight.isActive ? 'Ends' : 'Ended'}: {format(new Date(spotlight.endDate), 'MMM dd, yyyy')}
                                  </span>
                                )}
                                {spotlight.featuredShayaris && spotlight.featuredShayaris.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Star size={14} className="text-orange-400" />
                                    {spotlight.featuredShayaris.length} Featured Works
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <p id="writer-profile-modal-description" className="sr-only">
            Profile modal showing writer information and their published shayaris
          </p>
        </DialogContent>
      </Dialog>

      {/* Shayari Detail Modal */}
      <ShayariModal 
        shayari={selectedShayari}
        isOpen={showShayariModal}
        onClose={() => setShowShayariModal(false)}
      />

      {/* Profile Picture Modal */}
      <ProfilePictureModal 
        isOpen={showProfilePictureModal}
        onClose={() => setShowProfilePictureModal(false)}
        profilePicture={writer?.profilePicture}
        userName={`${writer?.firstName} ${writer?.lastName}`}
      />
    </>
  );
}