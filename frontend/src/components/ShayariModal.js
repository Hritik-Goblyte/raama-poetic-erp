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
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('raama-user') || '{}');
  const token = localStorage.getItem('raama-token');

  // Check if shayari is bookmarked and fetch author info when modal opens
  useEffect(() => {
    if (shayari?.id) {
      checkBookmarkStatus();
      fetchAuthorInfo();
      fetchAiAnalysis();
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

  const fetchAiAnalysis = async () => {
    try {
      if (shayari?.id) {
        const response = await axios.get(`${API}/shayaris/${shayari.id}/ai-analysis`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.ai_processed && response.data.analysis) {
          setAiAnalysis(response.data.analysis);
        }
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    }
  };

  const handleAnalyzeWithAi = async () => {
    if (aiAnalysis) {
      setShowAiAnalysis(!showAiAnalysis);
      return;
    }

    setLoadingAiAnalysis(true);
    try {
      const response = await axios.post(`${API}/shayaris/${shayari.id}/analyze`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.analysis) {
        setAiAnalysis(response.data.analysis);
        setShowAiAnalysis(true);
        toast.success('AI analysis completed! 🤖✨');
      } else {
        toast.error(response.data.message || 'AI analysis failed');
      }
    } catch (error) {
      toast.error('Failed to analyze with AI');
    } finally {
      setLoadingAiAnalysis(false);
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

    // Translate for the first time using Gemini AI
    setIsTranslating(true);
    try {
      const response = await axios.post(`${API}/shayaris/${shayari.id}/translate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        params: { target_language: 'english' }
      });
      
      if (response.data.success && response.data.translated_content) {
        setTranslatedContent(response.data.translated_content);
        setShowTranslation(true);
        toast.success('Translation completed with AI! 🤖✨');
      } else {
        toast.error(response.data.message || 'Translation failed', {
          description: response.data.fallback_message || 'AI translation service is currently unavailable'
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate shayari', {
        description: 'Please try again later or contact support'
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-gray-900/95 backdrop-blur-xl border-orange-500/30 max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl max-h-[95vh] w-[95vw] sm:w-[90vw] lg:w-full p-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 m-2 sm:m-4 lg:m-auto"
        aria-describedby="shayari-modal-description"
      >
        <div className="relative flex flex-col lg:flex-row h-full max-h-[95vh]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white transition-all"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header with Title */}
            <div className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/90 backdrop-blur-sm border-b border-orange-500/20 p-3 sm:p-4 lg:p-6 pb-3 sm:pb-4">
              <h2 
                className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-orange-500 pr-8 sm:pr-12 leading-tight"
                style={{ fontFamily: 'Macondo, cursive' }}
              >
                {shayari.title}
              </h2>
              <div className="flex items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {format(new Date(shayari.createdAt), 'MMMM dd, yyyy')}
                  </span>
                  <span className="sm:hidden">
                    {format(new Date(shayari.createdAt), 'MMM dd, yyyy')}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={14} className="sm:w-4 sm:h-4 text-orange-500" />
                  {shayari.likes} likes
                </span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto custom-scrollbar">
              {/* Original Content */}
              <div 
                className={`text-gray-200 text-base sm:text-lg lg:text-xl leading-relaxed whitespace-pre-line transition-opacity duration-300 ${showTranslation ? 'opacity-50' : 'opacity-100'}`}
                style={{ 
                  fontFamily: 'Style Script, cursive', 
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                  lineHeight: '1.8'
                }}
              >
                {shayari.content}
              </div>

              {/* Translation Content */}
              {showTranslation && translatedContent && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-purple-500/20 animate-in fade-in-0 slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4 bg-purple-500/10 p-2 sm:p-3 rounded-lg border border-purple-500/20">
                    <Languages size={16} className="sm:w-5 sm:h-5 text-purple-400" />
                    <span className="text-purple-400 font-semibold text-sm sm:text-base">English Translation</span>
                    <span className="text-xs bg-purple-500/20 px-2 py-1 rounded text-purple-300">🤖 AI Powered</span>
                  </div>
                  <div 
                    className="text-gray-200 text-base sm:text-lg lg:text-xl leading-relaxed whitespace-pre-line bg-purple-500/5 p-3 sm:p-4 rounded-lg"
                    style={{ 
                      fontFamily: 'Style Script, cursive', 
                      fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                      lineHeight: '1.8'
                    }}
                  >
                    {translatedContent}
                  </div>
                </div>
              )}

              {/* AI Analysis Section */}
              {(aiAnalysis || (isCurrentUser && currentUser.role === 'writer')) && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-blue-500/20">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 bg-blue-500/10 p-2 sm:p-3 rounded-lg border border-blue-500/20">
                      <span className="text-2xl">🤖</span>
                      <span className="text-blue-400 font-semibold text-sm sm:text-base">AI Analysis</span>
                    </div>
                    {isCurrentUser && (
                      <button
                        onClick={handleAnalyzeWithAi}
                        disabled={loadingAiAnalysis}
                        className="px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all disabled:opacity-50"
                      >
                        {loadingAiAnalysis ? (
                          <div className="flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" />
                            Analyzing...
                          </div>
                        ) : aiAnalysis ? (
                          showAiAnalysis ? 'Hide' : 'Show'
                        ) : (
                          'Analyze'
                        )}
                      </button>
                    )}
                  </div>
                  
                  {showAiAnalysis && aiAnalysis && (
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-4 duration-500">
                      {/* Quality Score */}
                      {aiAnalysis.quality_score && (
                        <div className="bg-blue-500/5 p-3 sm:p-4 rounded-lg border border-blue-500/20">
                          <h4 className="text-blue-400 font-semibold mb-2 text-sm sm:text-base">Quality Assessment</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Overall:</span>
                              <span className="text-blue-400 font-medium">{aiAnalysis.quality_score.overall}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Creativity:</span>
                              <span className="text-blue-400 font-medium">{aiAnalysis.quality_score.creativity}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Language:</span>
                              <span className="text-blue-400 font-medium">{aiAnalysis.quality_score.language_beauty}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Impact:</span>
                              <span className="text-blue-400 font-medium">{aiAnalysis.quality_score.emotional_impact}/10</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sentiment Analysis */}
                      {aiAnalysis.sentiment_analysis && (
                        <div className="bg-purple-500/5 p-3 sm:p-4 rounded-lg border border-purple-500/20">
                          <h4 className="text-purple-400 font-semibold mb-2 text-sm sm:text-base">Sentiment Analysis</h4>
                          <div className="space-y-1 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Emotion:</span>
                              <span className="text-purple-400">{aiAnalysis.sentiment_analysis.emotion}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Intensity:</span>
                              <span className="text-purple-400">{aiAnalysis.sentiment_analysis.intensity}/10</span>
                            </div>
                            <p className="text-gray-300 mt-2">{aiAnalysis.sentiment_analysis.mood}</p>
                          </div>
                        </div>
                      )}

                      {/* Literary Analysis */}
                      {aiAnalysis.literary_analysis && (
                        <div className="bg-green-500/5 p-3 sm:p-4 rounded-lg border border-green-500/20">
                          <h4 className="text-green-400 font-semibold mb-2 text-sm sm:text-base">Literary Analysis</h4>
                          <div className="space-y-1 text-xs sm:text-sm">
                            {aiAnalysis.literary_analysis.meter && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Meter:</span>
                                <span className="text-green-400">{aiAnalysis.literary_analysis.meter}</span>
                              </div>
                            )}
                            {aiAnalysis.literary_analysis.theme && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Theme:</span>
                                <span className="text-green-400">{aiAnalysis.literary_analysis.theme}</span>
                              </div>
                            )}
                            {aiAnalysis.literary_analysis.literary_devices && aiAnalysis.literary_analysis.literary_devices.length > 0 && (
                              <div className="mt-2">
                                <span className="text-gray-400 text-xs">Literary Devices:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {aiAnalysis.literary_analysis.literary_devices.map((device, index) => (
                                    <span key={index} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                      {device}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* AI Appreciation */}
                      {aiAnalysis.appreciation && (
                        <div className="bg-orange-500/5 p-3 sm:p-4 rounded-lg border border-orange-500/20">
                          <h4 className="text-orange-400 font-semibold mb-2 text-sm sm:text-base">AI Appreciation</h4>
                          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{aiAnalysis.appreciation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Author Section */}
              <div className="lg:hidden mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-orange-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div onClick={handleAuthorProfilePictureClick}>
                    <ProfilePicture 
                      user={authorUser || { 
                        firstName: shayari.authorName?.split(' ')[0] || 'Unknown',
                        lastName: shayari.authorName?.split(' ')[1] || '',
                        username: shayari.authorUsername 
                      }} 
                      size="md" 
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {shayari.authorName}
                    </h3>
                    <p className="text-orange-400 text-xs sm:text-sm font-medium">@{shayari.authorUsername || 'Unknown'}</p>
                  </div>
                </div>
                
                {/* Pen Name Signature */}
                <div className="mt-3 p-2 sm:p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p 
                    className="text-orange-400 text-right italic text-sm sm:text-base"
                    style={{ fontFamily: 'Style Script, cursive' }}
                  >
                    ~ {getPenName()}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Action Bar */}
            <div className="lg:hidden border-t border-gray-700/50 p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm">
              <div className="flex justify-around items-center">
                <button
                  onClick={handleLike}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    shayari.likedBy?.includes(currentUser.id)
                      ? 'text-red-400'
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart 
                    size={20} 
                    className={`sm:w-6 sm:h-6 ${shayari.likedBy?.includes(currentUser.id) ? 'fill-current' : ''}`} 
                  />
                  <span className="text-xs">{shayari.likes || 0}</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareOptions(!showShareOptions)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-blue-400 transition-all"
                  >
                    <Share2 size={20} className="sm:w-6 sm:h-6" />
                    <span className="text-xs">Share</span>
                  </button>

                  {/* Mobile Share Dropdown */}
                  {showShareOptions && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[140px]">
                      <button
                        onClick={handleWhatsAppShare}
                        className="w-full flex items-center gap-2 px-3 py-2 text-green-400 hover:bg-gray-700 transition-all text-sm"
                      >
                        <MessageCircle size={16} />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:bg-gray-700 transition-all border-t border-gray-600 text-sm"
                      >
                        <Share2 size={16} />
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={checkingBookmark}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    isBookmarked
                      ? 'text-orange-400'
                      : 'text-gray-400 hover:text-green-400'
                  } ${checkingBookmark ? 'opacity-50' : ''}`}
                >
                  <Bookmark 
                    size={20} 
                    className={`sm:w-6 sm:h-6 ${isBookmarked ? 'fill-current' : ''}`} 
                  />
                  <span className="text-xs">
                    {checkingBookmark ? '...' : isBookmarked ? 'Saved' : 'Save'}
                  </span>
                </button>

                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-purple-400 transition-all disabled:opacity-50"
                >
                  {isTranslating ? (
                    <Loader2 size={20} className="sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    <Languages size={20} className="sm:w-6 sm:h-6" />
                  )}
                  <span className="text-xs">
                    {isTranslating ? '...' : showTranslation ? 'Original' : 'Translate'}
                  </span>
                </button>

                {/* AI Analysis Button - Only for author */}
                {isCurrentUser && currentUser.role === 'writer' && (
                  <button
                    onClick={handleAnalyzeWithAi}
                    disabled={loadingAiAnalysis}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-blue-400 transition-all disabled:opacity-50"
                  >
                    {loadingAiAnalysis ? (
                      <Loader2 size={20} className="sm:w-6 sm:h-6 animate-spin" />
                    ) : (
                      <span className="text-lg">🤖</span>
                    )}
                    <span className="text-xs">
                      {loadingAiAnalysis ? '...' : aiAnalysis ? (showAiAnalysis ? 'Hide AI' : 'Show AI') : 'AI'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:flex lg:flex-col lg:w-80 xl:w-96 border-l border-orange-500/20 bg-black/20 min-h-0">
            {/* Author Section */}
            <div className="p-6 border-b border-orange-500/20">
              <div className="flex items-start gap-4 mb-4">
                <div onClick={handleAuthorProfilePictureClick} className="cursor-pointer">
                  <ProfilePicture 
                    user={authorUser || { 
                      firstName: shayari.authorName?.split(' ')[0] || 'Unknown',
                      lastName: shayari.authorName?.split(' ')[1] || '',
                      username: shayari.authorUsername 
                    }} 
                    size="xl" 
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg xl:text-xl mb-1">
                    {shayari.authorName}
                  </h3>
                  <p className="text-orange-400 text-sm xl:text-base font-medium mb-1">
                    @{shayari.authorUsername || 'Unknown'}
                  </p>
                  <p className="text-gray-400 text-sm">Poet & Writer</p>
                </div>
              </div>
              
              {/* Pen Name Signature */}
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-500/20">
                <p 
                  className="text-orange-400 text-right italic text-lg xl:text-xl"
                  style={{ fontFamily: 'Style Script, cursive' }}
                >
                  ~ {getPenName()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <button
                onClick={handleLike}
                className={`w-full flex items-center justify-between py-4 px-5 border-2 rounded-xl transition-all group font-medium ${
                  shayari.likedBy?.includes(currentUser.id)
                    ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                    : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40 text-red-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart 
                    size={22} 
                    className={`group-hover:scale-110 transition-transform ${
                      shayari.likedBy?.includes(currentUser.id) ? 'fill-current' : ''
                    }`} 
                  />
                  <span className="text-base xl:text-lg">
                    {shayari.likedBy?.includes(currentUser.id) ? 'Liked' : 'Like'}
                  </span>
                </div>
                <span className="text-sm xl:text-base opacity-75 bg-black/20 px-2 py-1 rounded-full">
                  {shayari.likes || 0}
                </span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="w-full flex items-center justify-center gap-3 py-4 px-5 bg-blue-500/10 hover:bg-blue-500/20 border-2 border-blue-500/20 hover:border-blue-500/40 rounded-xl text-blue-400 transition-all group font-medium"
                >
                  <Share2 size={22} className="group-hover:scale-110 transition-transform" />
                  <span className="text-base xl:text-lg">Share Shayari</span>
                </button>

                {/* Desktop Share Dropdown */}
                {showShareOptions && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-xl shadow-2xl z-10 overflow-hidden">
                    <button
                      onClick={handleWhatsAppShare}
                      className="w-full flex items-center gap-3 px-5 py-4 text-green-400 hover:bg-gray-700/50 transition-all"
                    >
                      <MessageCircle size={20} />
                      <span className="font-medium">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleSocialShare('twitter')}
                      className="w-full flex items-center gap-3 px-5 py-4 text-blue-400 hover:bg-gray-700/50 transition-all border-t border-gray-700"
                    >
                      <Twitter size={20} />
                      <span className="font-medium">Twitter</span>
                    </button>
                    <button
                      onClick={() => handleSocialShare('facebook')}
                      className="w-full flex items-center gap-3 px-5 py-4 text-blue-600 hover:bg-gray-700/50 transition-all border-t border-gray-700"
                    >
                      <Facebook size={20} />
                      <span className="font-medium">Facebook</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center gap-3 px-5 py-4 text-gray-400 hover:bg-gray-700/50 transition-all border-t border-gray-700"
                    >
                      <Share2 size={20} />
                      <span className="font-medium">Copy Text</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={checkingBookmark}
                className={`w-full flex items-center justify-center gap-3 py-4 px-5 border-2 rounded-xl transition-all group font-medium ${
                  isBookmarked
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 hover:bg-orange-500/30'
                    : 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/40 text-green-400'
                } ${checkingBookmark ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Bookmark 
                  size={22} 
                  className={`group-hover:scale-110 transition-transform ${
                    isBookmarked ? 'fill-current' : ''
                  }`} 
                />
                <span className="text-base xl:text-lg">
                  {checkingBookmark ? 'Loading...' : isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </span>
              </button>

              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 bg-purple-500/10 hover:bg-purple-500/20 border-2 border-purple-500/20 hover:border-purple-500/40 rounded-xl text-purple-400 transition-all group disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                title={showTranslation ? 'Switch back to original text' : 'Translate Hinglish to Hindi'}
              >
                {isTranslating ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <Languages size={22} className="group-hover:scale-110 transition-transform" />
                )}
                <span className="text-base xl:text-lg">
                  {isTranslating ? 'Translating...' : showTranslation ? 'Show Original' : 'Translate'}
                </span>
              </button>

              {/* Translation Info */}
              {!translatedContent && !isTranslating && (
                <div className="text-xs xl:text-sm text-gray-500 text-center px-2 py-2 bg-gray-800/30 rounded-lg">
                  AI-powered Hinglish to Hindi translation
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="p-6 pt-0">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-5 space-y-3 border border-gray-700/30">
                <h4 className="text-gray-300 font-semibold text-sm xl:text-base mb-3">Statistics</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm xl:text-base">Created</span>
                  <span className="text-gray-300 text-sm xl:text-base font-medium">
                    {format(new Date(shayari.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm xl:text-base">Likes</span>
                  <span className="text-orange-400 font-bold text-base xl:text-lg">
                    {shayari.likes || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm xl:text-base">Shares</span>
                  <span className="text-blue-400 font-medium text-sm xl:text-base">
                    {shayari.shares || 0}
                  </span>
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