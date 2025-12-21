import { useState, useEffect, useRef } from 'react';
import { Search, Clock, TrendingUp, Hash, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SearchBar({ onSearch, onClose }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({
    recentSearches: [],
    popularSearches: [],
    trendingTags: []
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const token = localStorage.getItem('raama-token');

  useEffect(() => {
    fetchSuggestions();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API}/search/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/search/shayaris`, {
        params: { q: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSearch(response.data, searchQuery);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearchHistory = async () => {
    try {
      await axios.delete(`${API}/search/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(prev => ({ ...prev, recentSearches: [] }));
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="w-full max-w-2xl mx-4">
        {/* Search Input */}
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search shayaris, authors, or tags..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="glass-card p-6 max-h-96 overflow-y-auto">
            {/* Recent Searches */}
            {suggestions.recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                    <Clock size={18} />
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearSearchHistory}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(search)}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-all"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {suggestions.popularSearches.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Popular Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.popularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(search)}
                      className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm transition-all"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Tags */}
            {suggestions.trendingTags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Hash size={18} />
                  Trending Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.trendingTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(tag)}
                      className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-all"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No suggestions */}
            {suggestions.recentSearches.length === 0 && 
             suggestions.popularSearches.length === 0 && 
             suggestions.trendingTags.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>Start typing to search for shayaris...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}