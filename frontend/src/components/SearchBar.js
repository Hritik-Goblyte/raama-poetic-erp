import { useState, useEffect, useRef } from 'react';
import { Search, X, User, BookOpen, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function SearchBar({ onSearch, onClose }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({
    shayaris: [],
    writers: []
  });
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (query.length > 2) {
      searchContent();
    } else {
      setSuggestions({ shayaris: [], writers: [] });
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions({ shayaris: [], writers: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item, type) => {
    if (type === 'shayari') {
      setQuery(item.title);
      handleSearch(item.title);
    } else if (type === 'writer') {
      setQuery(item.username);
      handleSearch(item.username);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search shayaris, writers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full pl-10 pr-20 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin text-orange-500" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions({ shayaris: [], writers: [] });
                setShowSuggestions(false);
              }}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {showSuggestions && (suggestions.shayaris.length > 0 || suggestions.writers.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {suggestions.writers.length > 0 && (
            <div className="p-3 border-b border-gray-700">
              <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <User size={14} />
                Writers
              </h4>
              {suggestions.writers.map((writer) => (
                <button
                  key={writer.id}
                  onClick={() => handleSuggestionClick(writer, 'writer')}
                  className="w-full text-left p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <User size={14} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{writer.username}</p>
                      <p className="text-gray-400 text-sm">{writer.firstName} {writer.lastName}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {suggestions.shayaris.length > 0 && (
            <div className="p-3">
              <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <BookOpen size={14} />
                Shayaris
              </h4>
              {suggestions.shayaris.map((shayari) => (
                <button
                  key={shayari.id}
                  onClick={() => handleSuggestionClick(shayari, 'shayari')}
                  className="w-full text-left p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <BookOpen size={14} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{shayari.title}</p>
                      <p className="text-gray-400 text-sm">by {shayari.authorName}</p>
                      <p className="text-gray-500 text-xs line-clamp-2 mt-1">
                        {shayari.content.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}