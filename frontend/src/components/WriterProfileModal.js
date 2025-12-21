import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ShayariModal from '@/components/ShayariModal';
import ProfilePicture from '@/components/ProfilePicture';
import ProfilePictureModal from '@/components/ProfilePictureModal';
import { X, Calendar, BookOpen, Heart, User, Pen } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WriterProfileModal({ writer, isOpen, onClose }) {
  const [writerShayaris, setWriterShayaris] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShayari, setSelectedShayari] = useState(null);
  const [showShayariModal, setShowShayariModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const token = localStorage.getItem('raama-token');
  const currentUser = JSON.parse(localStorage.getItem('raama-user') || '{}');

  useEffect(() => {
    if (isOpen && writer) {
      fetchWriterShayaris();
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