import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Users, User, LogOut, Moon, Sun, Plus, Menu, X, Edit, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import NotificationCenter from './NotificationCenter';

export default function Sidebar({ theme, setTheme, onNewShayari }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('raama-user') || '{}');
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    // Clear dashboard cache for all users
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('dashboard-cache-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing dashboard cache:', error);
    }
    
    localStorage.removeItem('raama-token');
    localStorage.removeItem('raama-user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleNewShayari = () => {
    if (user.role !== 'writer') {
      setShowRestrictionModal(true);
    } else {
      onNewShayari();
    }
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard', mobileLabel: 'Home' },
    { path: '/bookmarks', icon: BookOpen, label: 'Bookmarks', mobileLabel: 'Saved' },
    { path: '/my-shayari', icon: Edit, label: 'My Shayari', mobileLabel: 'My Posts' },
    { path: '/writers', icon: Users, label: 'Writers', mobileLabel: 'Writers' },
    { path: '/profile', icon: User, label: 'Profile', mobileLabel: 'Profile' }
  ];

  return (
    <>
      {/* Mobile Header - Instagram Style */}
      {isMobile && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 mobile-header px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ 
              fontFamily: 'Tillana, cursive',
              color: '#ff6b35'
            }}>
              रामा
            </h1>
            <div className="flex items-center gap-3">
              <NotificationCenter user={user} />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-white hover:bg-gray-800 rounded-lg transition-all mobile-nav-transition"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay - Instagram Style */}
      {isMobile && isMobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div className="lg:hidden fixed top-16 right-4 z-50 mobile-menu-dropdown rounded-2xl shadow-2xl min-w-[200px]">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-700/50">
                <div className="w-10 h-10 profile-avatar rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">@{user?.username || 'Guest'}</p>
                  <p className="text-gray-400 text-xs">{user?.role || 'Reader'}</p>
                </div>
              </div>
              
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all text-left"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
              >
                <LogOut size={18} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <div className={`
        hidden lg:flex
        w-64 h-screen fixed left-0 top-0 glass-card flex-col p-6 z-50
      `} style={{
        borderRight: '1px solid rgba(255, 107, 53, 0.2)'
      }}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ 
            fontFamily: 'Tillana, cursive',
            color: '#ff6b35',
            textShadow: '0 0 20px rgba(255, 107, 53, 0.5)'
          }}>
            रामा..!
          </h1>
        </div>

        <button
          data-testid="new-shayari-button"
          onClick={handleNewShayari}
          className="w-full py-3 mb-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/50"
        >
          <Plus size={20} />
          New Shayari
        </button>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-500 border-l-4 border-orange-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-4 mt-auto">
          <button
            data-testid="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <button
            data-testid="logout-button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Instagram Style */}
      {isMobile && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav">
          <div className="flex items-center justify-around py-2 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `mobile-nav-item mobile-nav-transition rounded-lg ${
                    isActive
                      ? 'mobile-nav-active'
                      : 'text-gray-400 hover:text-white'
                  }`
                }
              >
                <item.icon size={22} strokeWidth={1.5} />
                <span className="text-xs font-medium">{item.mobileLabel}</span>
              </NavLink>
            ))}
            <button
              onClick={handleNewShayari}
              className="mobile-nav-item text-orange-500"
            >
              <div className="w-6 h-6 mobile-create-btn flex items-center justify-center">
                <Plus size={16} strokeWidth={2} className="text-white" />
              </div>
              <span className="text-xs font-medium">Create</span>
            </button>
          </div>
        </div>
      )}

      {/* Fixed Notification Bell for Desktop - Top Right Corner */}
      {!isMobile && (
        <div className="hidden lg:block fixed top-6 right-6 z-50">
          <div className="flex items-center gap-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-full px-4 py-2 shadow-lg hover:bg-gray-900/90 transition-all">
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome</p>
              <p className="text-orange-500 font-semibold">@{user?.username || 'Guest'}</p>
            </div>
            <NotificationCenter user={user} />
          </div>
        </div>
      )}

      <Dialog open={showRestrictionModal} onOpenChange={setShowRestrictionModal}>
        <DialogContent data-testid="restriction-modal" className="bg-gray-900 border-orange-500/30" aria-describedby="restriction-description">
          <DialogHeader>
            <DialogTitle className="text-orange-500 text-2xl">Action Not Allowed</DialogTitle>
          </DialogHeader>
          <p id="restriction-description" className="sr-only">This action is restricted to writers only</p>
          <div className="text-gray-300">
            <p>Only writers can create shayaris. Your current role is <span className="font-bold text-orange-500">{user.role}</span>.</p>
            <p className="mt-4 text-sm text-gray-400">To become a writer, please contact the administrator.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}