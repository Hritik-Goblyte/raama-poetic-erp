import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ShayariModal from '@/components/ShayariModal';
import axios from 'axios';
import { toast } from 'sonner';
import { Bookmark, Trash2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Bookmarks({ theme, setTheme }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedShayari, setSelectedShayari] = useState(null);
  const [showShayariModal, setShowShayariModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('raama-token');

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarks(response.data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (shayariId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/bookmarks/${shayariId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarks(prev => prev.filter(b => b.shayariId !== shayariId));
      toast.success('Bookmark removed successfully');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const handleShayariClick = async (bookmark) => {
    // Create shayari object from bookmark data
    const shayari = {
      id: bookmark.shayariId,
      title: bookmark.shayariTitle,
      content: bookmark.shayariContent,
      authorName: bookmark.shayariAuthor,
      authorUsername: bookmark.shayariAuthorUsername,
      createdAt: bookmark.createdAt,
      likes: 0,
      views: 0,
      shares: 0,
      tags: bookmark.tags || []
    };
    
    // Record view
    try {
      await axios.post(`${API}/shayaris/${bookmark.shayariId}/view`, {}, {
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
      
      <div className="lg:ml-64 flex-1 p-4 lg:p-8 min-h-screen pt-20 lg:pt-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div>
              <h1 className="text-3xl lg:text-5xl font-bold mb-2" style={{ 
                fontFamily: 'Macondo, cursive',
                color: '#ff6b35'
              }}>
                <Bookmark className="inline-block mr-3" size={40} />
                My Bookmarks
              </h1>
              <p className="text-gray-400">Your saved favorite shayaris ({bookmarks.length})</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {bookmarks.map((bookmark) => (
                <div 
                  key={bookmark.id} 
                  className="glass-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer transform hover:scale-[1.01]"
                  onClick={() => handleShayariClick(bookmark)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Bookmark size={20} className="text-orange-500 fill-current" />
                        <h3 className="text-xl font-bold text-orange-500">{bookmark.shayariTitle}</h3>
                      </div>
                      <p className="text-gray-300 mb-4 line-clamp-3" style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}>
                        {bookmark.shayariContent}
                      </p>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => removeBookmark(bookmark.shayariId, e)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Remove bookmark"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Tags */}
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {bookmark.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Author and Date */}
                  <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span className="text-white">{bookmark.shayariAuthor}</span>
                      <span className="text-orange-400">@{bookmark.shayariAuthorUsername}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      Saved {format(new Date(bookmark.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {bookmarks.length === 0 && !loading && (
            <div className="glass-card p-8 text-center">
              <Bookmark size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-xl text-gray-400 mb-4">No bookmarks yet</p>
              <p className="text-gray-500 mb-6">
                Start bookmarking your favorite shayaris by clicking the bookmark button on any shayari
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all inline-flex items-center gap-2"
              >
                <Bookmark size={20} />
                Browse Shayaris
              </button>
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