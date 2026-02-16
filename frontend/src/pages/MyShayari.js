import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ShayariModal from '@/components/ShayariModal';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Heart, Calendar, Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function MyShayari({ theme, setTheme }) {
  const [shayaris, setShayaris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewShayariModal, setShowNewShayariModal] = useState(false);
  const [newShayari, setNewShayari] = useState({ title: '', content: '' });
  const [selectedShayari, setSelectedShayari] = useState(null);
  const [showShayariModal, setShowShayariModal] = useState(false);
  const user = JSON.parse(localStorage.getItem('raama-user') || '{}');
  const token = localStorage.getItem('raama-token');

  useEffect(() => {
    fetchMyShayaris();
  }, []);

  const fetchMyShayaris = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/shayaris/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShayaris(response.data);
    } catch (error) {
      console.error('Error fetching shayaris:', error);
      toast.error('Failed to load your shayaris');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShayari = async (e) => {
    e.preventDefault();
    try {
      // Show AI processing toast
      const processingToast = toast.loading('Creating shayari and processing with AI...', {
        duration: 10000
      });
      
      const response = await axios.post(`${API}/shayaris`, newShayari, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Dismiss processing toast
      toast.dismiss(processingToast);
      
      // Show success message with AI results
      const shayari = response.data;
      if (shayari.aiProcessed) {
        toast.success('Shayari created successfully with AI analysis! 🤖✨', {
          description: 'Your shayari has been analyzed and enhanced by AI'
        });
      } else {
        toast.success('Shayari created successfully!', {
          description: 'AI analysis was not available'
        });
      }
      
      setShowNewShayariModal(false);
      setNewShayari({ title: '', content: '' });
      fetchMyShayaris();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create shayari');
    }
  };

  const handleDeleteShayari = async (id, e) => {
    e.stopPropagation(); // Prevent card click when deleting
    if (!window.confirm('Are you sure you want to delete this shayari?')) return;
    
    try {
      await axios.delete(`${API}/shayaris/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Shayari deleted successfully');
      setShayaris(shayaris.filter(s => s.id !== id));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete shayari');
    }
  };

  const handleShayariClick = (shayari) => {
    setSelectedShayari(shayari);
    setShowShayariModal(true);
  };

  const handleShayariUpdate = (updatedShayari) => {
    setShayaris(prev => prev.map(s => s.id === updatedShayari.id ? updatedShayari : s));
    if (selectedShayari?.id === updatedShayari.id) {
      setSelectedShayari(updatedShayari);
    }
  };

  return (
    <div className="flex" style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}>
      <Sidebar theme={theme} setTheme={setTheme} onNewShayari={() => setShowNewShayariModal(true)} />
      
      <div className="lg:ml-64 flex-1 p-4 lg:p-8 min-h-screen pt-20 lg:pt-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div>
              <h1 className="text-3xl lg:text-5xl font-bold mb-2" style={{ 
                fontFamily: 'Macondo, cursive',
                color: '#ff6b35'
              }}>
                My Shayari
              </h1>
              <p className="text-gray-400">Your poetic creations</p>
            </div>
            {user.role === 'writer' && (
              <button
                data-testid="create-new-shayari-button"
                onClick={() => setShowNewShayariModal(true)}
                className="lg:hidden px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/50"
              >
                <Plus size={20} />
                New Shayari
              </button>
            )}
          </div>

          <div data-testid="my-shayari-list">
            {user.role !== 'writer' ? (
              <div className="glass-card p-8 text-center">
                <p className="text-xl text-gray-400">Only writers can create shayaris.</p>
                <p className="text-orange-500 mt-2">Your role: <span className="font-bold">{user.role}</span></p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
                  <p className="text-gray-400">Loading your shayaris...</p>
                </div>
              </div>
            ) : shayaris.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-xl text-gray-400 mb-4">You haven't created any shayaris yet.</p>
                <button
                  onClick={() => setShowNewShayariModal(true)}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create Your First Shayari
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {shayaris.map((shayari, index) => (
                  <div 
                    key={shayari.id} 
                    className="glass-card p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all group cursor-pointer transform hover:scale-[1.02] slide-in-up" 
                    data-testid="my-shayari-card"
                    onClick={() => handleShayariClick(shayari)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-orange-500 flex-1">{shayari.title}</h3>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShayariClick(shayari);
                          }}
                          className="text-gray-400 hover:text-orange-500 transition-colors"
                          title="Edit Shayari"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          data-testid={`delete-shayari-${shayari.id}`}
                          onClick={(e) => handleDeleteShayari(shayari.id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Shayari"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-2" style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}>
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
      </div>

      <Dialog open={showNewShayariModal} onOpenChange={setShowNewShayariModal}>
        <DialogContent data-testid="new-shayari-modal" className="bg-gray-900 border-orange-500/30 max-w-2xl w-[95vw] lg:w-full m-2 lg:m-auto" aria-describedby="shayari-modal-description">
          <DialogHeader>
            <DialogTitle className="text-orange-500 text-3xl" style={{ fontFamily: 'Macondo, cursive' }}>Create New Shayari</DialogTitle>
          </DialogHeader>
          <p id="shayari-modal-description" className="sr-only">Form to create a new shayari with title and content fields</p>
          <form onSubmit={handleCreateShayari} className="space-y-4">
            <div>
              <input
                data-testid="shayari-title-input"
                type="text"
                placeholder="Shayari Title"
                required
                value={newShayari.title}
                onChange={(e) => setNewShayari({...newShayari, title: e.target.value})}
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <textarea
                data-testid="shayari-content-input"
                placeholder="Write your shayari here..."
                required
                rows={8}
                value={newShayari.content}
                onChange={(e) => setNewShayari({...newShayari, content: e.target.value})}
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                style={{ fontFamily: 'Style Script, cursive', fontSize: '1.1rem' }}
              />
            </div>
            <button
              data-testid="create-shayari-submit"
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50"
            >
              Create Shayari
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <ShayariModal 
        shayari={selectedShayari}
        isOpen={showShayariModal}
        onClose={() => setShowShayariModal(false)}
        onShayariUpdate={handleShayariUpdate}
      />
    </div>
  );
}