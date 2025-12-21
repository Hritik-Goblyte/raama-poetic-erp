import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Heart, Share2, Bookmark, X, Calendar, User, Languages, Loader2, MessageCircle, Facebook, Twitter, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';
import ProfilePicture from '@/components/ProfilePicture';
import ProfilePictureModal from '@/components/ProfilePictureModal';
// import { translateWithFallback } from '../lib/geminiTranslation';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function ShayariModal({ shayari, isOpen, onClose }) {
  const [translatedContent, setTranslatedContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [checkingBookmark, setCheckingBookmark] = useState(true);
  const [authorUser, setAuthorUser] = useState(null);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('raama-user') || '{}');
  const token = localStorage.getItem('raama-token');

  // Check if shayari is bookmarked and fetch author info when modal opens
  useEffect(() => {
    if (shayari?.id) {
      checkBookmarkStatus();
      fetchAuthorInfo();
    }
  }, [shayari?.id]);
  
  if (!shayari) return null;

  const isCurrentUser = currentUser.id === shayari?.authorId;

  const checkBookmarkStatus = async () => {
    try {
      setCheckingBookmark(true);
      const response = await axios.get(`${API}/bookmarks/check/${shayari.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsBookmarked(response.data.isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    } finally {
      setCheckingBookmark(false);
    }
  };

  const fetchAuthorInfo = async () => {
    try {
      if (shayari?.authorId) {
        const response = await axios.get(`${API}/users/${shayari.authorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAuthorUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching author info:', error);
    }
  };

  const handleAuthorProfilePictureClick = () => {
    if (authorUser?.profilePicture) {
      setShowProfilePictureModal(true);
    }
  };
  
  // Get pen name - use username for others, "you" for current user
  const getPenName = () => {
    if (isCurrentUser) {
      return "you";
    }
    // Use the author's username (pen name) if available, otherwise fallback to lastName
    return shayari.authorUsername || shayari.authorName.split(' ').pop();
  };

  const handleLike = async () => {
    try {
      const isLiked = shayari.likedBy?.includes(currentUser.id);
      
      if (isLiked) {
        await axios.delete(`${API}/shayaris/${shayari.id}/unlike`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Unliked!');
      } else {
        await axios.post(`${API}/shayaris/${shayari.id}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Liked!');
      }
      
      // Update local state
      if (isLiked) {
        shayari.likes = Math.max(0, shayari.likes - 1);
        shayari.likedBy = shayari.likedBy.filter(id => id !== currentUser.id);
      } else {
        shayari.likes = (shayari.likes || 0) + 1;
        shayari.likedBy = [...(shayari.likedBy || []), currentUser.id];
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleShare = async () => {
    const authorCredit = isCurrentUser ? 'you' : (shayari.authorUsername || shayari.authorName);
    try {
      // Record share
      await axios.post(`${API}/shayaris/${shayari.id}/share`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (navigator.share) {
        await navigator.share({
          title: shayari.title,
          text: `${shayari.content}\n\n~ ${authorCredit}`,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${shayari.title}\n\n${shayari.content}\n\n~ ${authorCredit}\n\nShared from रामा`
        );
        toast.success('Shayari copied to clipboard!');
      }
      
      // Update share count
      shayari.shares = (shayari.shares || 0) + 1;
    } catch (error) {
      toast.error('Failed to share shayari');
    }
  };

  const handleSave = async () => {
    try {
      if (isBookmarked) {
        // Remove bookmark
        await axios.delete(`${API}/bookmarks/${shayari.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsBookmarked(false);
        toast.success('Bookmark removed');
      } else {
        // Add bookmark
        await axios.post(`${API}/bookmarks`, {
          shayariId: shayari.id,
          tags: shayari.tags || []
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsBookmarked(true);
        toast.success('Bookmarked successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update bookmark');
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      const response = await axios.post(`${API}/share/whatsapp/${shayari.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      window.open(response.data.shareUrl, '_blank');
      setShowShareOptions(false);
    } catch (error) {
      toast.error('Failed to generate WhatsApp share link');
    }
  };

  const handleSocialShare = async (platform) => {
    try {
      const response = await axios.post(`${API}/share/social/${shayari.id}?platform=${platform}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Copy to clipboard for now (can be enhanced with actual platform APIs)
      await navigator.clipboard.writeText(response.data.message);
      toast.success(`${platform} share content copied to clipboard!`);
      setShowShareOptions(false);
    } catch (error) {
      toast.error(`Failed to generate ${platform} share content`);
    }
  };

  const handleTranslate = async () => {
    if (showTranslation && translatedContent) {
      // Toggle back to original
      setShowTranslation(false);
      return;
    }

    if (translatedContent) {
      // Show existing translation
      setShowTranslation(true);
      return;
    }

    // Translate for the first time
    setIsTranslating(true);
    try {
      const response = await axios.post(`${API}/translate`, {
        text: shayari.content,
        fromLang: 'hinglish',
        toLang: 'hindi'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTranslatedContent(response.data.translatedText);
      setShowTranslation(true);
      toast.success('Translation completed!');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate shayari');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gray-900/95 backdrop-blur-xl border-orange-500/30 max-w-4xl max-h-[95vh] w-[98vw] lg:w-full p-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 m-1 lg:m-auto"
        aria-describedby="shayari-modal-description"
      >
        <div className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>

          {/* Fixed Header with Title */}
          <div className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/90 backdrop-blur-sm border-b border-orange-500/20 p-4 lg:p-6 pb-4">
            <h2 
              className="text-xl lg:text-3xl font-bold text-orange-500 pr-12"
              style={{ fontFamily: 'Macondo, cursive' }}
            >
              {shayari.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                {format(new Date(shayari.createdAt), 'MMMM dd, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={16} className="text-orange-500" />
                {shayari.likes} likes
              </span>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex flex-col lg:flex-row min-h-[300px] lg:min-h-[400px] max-h-[70vh] lg:max-h-[60vh]">
            {/* Main Content - Scrollable */}
            <div className="flex-1 p-4 lg:p-6 overflow-y-auto custom-scrollbar">
              {/* Original Content */}
              <div 
                className={`text-gray-200 text-lg leading-relaxed whitespace-pre-line transition-opacity duration-300 ${showTranslation ? 'opacity-50' : 'opacity-100'}`}
                style={{ 
                  fontFamily: 'Style Script, cursive', 
                  fontSize: '1.3rem',
                  lineHeight: '1.8'
                }}
              >
                {shayari.content}
              </div>

              {/* Translation Content */}
              {showTranslation && translatedContent && (
                <div className="mt-6 pt-6 border-t border-purple-500/20 animate-in fade-in-0 slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 mb-4 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                    <Languages size={20} className="text-purple-400" />
                    <span className="text-purple-400 font-semibold">हिंदी अनुवाद (Hindi Translation)</span>
                  </div>
                  <div 
                    className="text-gray-200 text-lg leading-relaxed whitespace-pre-line bg-purple-500/5 p-4 rounded-lg"
                    style={{ 
                      fontFamily: 'Style Script, cursive', 
                      fontSize: '1.3rem',
                      lineHeight: '1.8'
                    }}
                  >
                    {translatedContent}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar with Author and Actions */}
            <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-orange-500/20 bg-black/20">
              {/* Author Signature */}
              <div className="p-4 lg:p-6 border-b border-orange-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div onClick={handleAuthorProfilePictureClick}>
                    <ProfilePicture 
                      user={authorUser || { 
                        firstName: shayari.authorName?.split(' ')[0] || 'Unknown',
                        lastName: shayari.authorName?.split(' ')[1] || '',
                        username: shayari.authorUsername 
                      }} 
                      size="lg" 
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">
                      {shayari.authorName}
                    </h3>
                    <p className="text-orange-400 text-sm font-medium">@{shayari.authorUsername || 'Unknown'}</p>
                    <p className="text-gray-400 text-sm">Poet</p>
                  </div>
                </div>
                
                {/* Pen Name Signature */}
                <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p 
                    className="text-orange-400 text-right italic"
                    style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}
                  >
                    ~ {getPenName()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 lg:p-6 space-y-3">
                <button
                  onClick={handleLike}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-lg transition-all group ${
                    shayari.likedBy?.includes(currentUser.id)
                      ? 'bg-red-500/30 border-red-500/50 text-red-300'
                      : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300'
                  }`}
                >
                  <Heart 
                    size={20} 
                    className={`group-hover:scale-110 transition-transform ${
                      shayari.likedBy?.includes(currentUser.id) ? 'fill-current' : ''
                    }`} 
                  />
                  <span className="font-medium">
                    {shayari.likedBy?.includes(currentUser.id) ? 'Liked' : 'Like'}
                  </span>
                  <span className="text-sm opacity-75">({shayari.likes || 0})</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareOptions(!showShareOptions)}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all group"
                  >
                    <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Share</span>
                  </button>

                  {/* Share Options Dropdown */}
                  {showShareOptions && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      <button
                        onClick={handleWhatsAppShare}
                        className="w-full flex items-center gap-3 px-4 py-3 text-green-400 hover:bg-gray-700 transition-all"
                      >
                        <MessageCircle size={18} />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleSocialShare('twitter')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-blue-400 hover:bg-gray-700 transition-all"
                      >
                        <Twitter size={18} />
                        <span>Twitter</span>
                      </button>
                      <button
                        onClick={() => handleSocialShare('facebook')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 hover:bg-gray-700 transition-all"
                      >
                        <Facebook size={18} />
                        <span>Facebook</span>
                      </button>
                      <button
                        onClick={() => handleSocialShare('instagram')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-pink-400 hover:bg-gray-700 transition-all"
                      >
                        <Instagram size={18} />
                        <span>Instagram</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-700 transition-all border-t border-gray-600"
                      >
                        <Share2 size={18} />
                        <span>Copy Text</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={checkingBookmark}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-lg transition-all group ${
                    isBookmarked
                      ? 'bg-orange-500/30 border-orange-500/50 text-orange-300'
                      : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 hover:border-green-500/50 text-green-400 hover:text-green-300'
                  } ${checkingBookmark ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Bookmark 
                    size={20} 
                    className={`group-hover:scale-110 transition-transform ${
                      isBookmarked ? 'fill-current' : ''
                    }`} 
                  />
                  <span className="font-medium">
                    {checkingBookmark ? 'Loading...' : isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </span>
                </button>

                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-400 hover:text-purple-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  title={showTranslation ? 'Switch back to original text' : 'Translate Hinglish to Hindi'}
                >
                  {isTranslating ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Languages size={20} className="group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-medium">
                    {isTranslating ? 'Translating...' : showTranslation ? 'Show Original' : 'Translate'}
                  </span>
                </button>

                {/* Translation Info */}
                {!translatedContent && !isTranslating && (
                  <div className="text-xs text-gray-500 text-center px-2">
                    AI-powered Hinglish to Hindi translation
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="p-4 lg:p-6 pt-0">
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-300">
                      {format(new Date(shayari.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Likes</span>
                    <span className="text-orange-400 font-medium">{shayari.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p id="shayari-modal-description" className="sr-only">
          Detailed view of shayari with title, content, author information, and action buttons for like, share, and save
        </p>
      </DialogContent>

      <ProfilePictureModal 
        isOpen={showProfilePictureModal}
        onClose={() => setShowProfilePictureModal(false)}
        profilePicture={authorUser?.profilePicture}
        userName={shayari.authorName}
      />
    </Dialog>
  );
}