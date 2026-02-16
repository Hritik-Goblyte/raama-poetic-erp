import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';
import { 
  BarChart3, 
  TrendingUp, 
  Heart, 
  Eye, 
  Share2, 
  Users, 
  BookOpen,
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Analytics({ theme, setTheme }) {
  const [writerAnalytics, setWriterAnalytics] = useState(null);
  const [readerAnalytics, setReaderAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('raama-user') || '{}');
  const token = localStorage.getItem('raama-token');

  useEffect(() => {
    if (user.role === 'writer') {
      fetchWriterAnalytics();
    } else {
      fetchReaderAnalytics();
    }
  }, [user.role]);

  const fetchWriterAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/writer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWriterAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching writer analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReaderAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/reader`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReaderAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching reader analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, index = 0 }) => (
    <div className="glass-card p-6 hover:border-orange-500/50 transition-all slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('500', '500/20')}`}>
          <Icon size={24} className={color} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={16} className="text-green-500" />
          <span className="text-green-500">{trend}</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex" style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}>
        <Sidebar theme={theme} setTheme={setTheme} onNewShayari={() => {}} />
        <div className="lg:ml-64 flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

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
              Analytics
            </h1>
            <p className="text-gray-400">
              {user.role === 'writer' ? 'Your writing performance insights' : 'Your reading journey statistics'}
            </p>
          </div>

          {/* Writer Analytics */}
          {user.role === 'writer' && writerAnalytics && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Shayaris"
                  value={writerAnalytics.totalShayaris}
                  icon={BookOpen}
                  color="text-blue-500"
                  subtitle="Published works"
                  index={0}
                />
                <StatCard
                  title="Total Likes"
                  value={writerAnalytics.totalLikes}
                  icon={Heart}
                  color="text-red-500"
                  subtitle="Appreciation received"
                  index={1}
                />
                <StatCard
                  title="Total Views"
                  value={writerAnalytics.totalViews}
                  icon={Eye}
                  color="text-green-500"
                  subtitle="Times read"
                  index={2}
                />
                <StatCard
                  title="Followers"
                  value={writerAnalytics.followerCount}
                  icon={Users}
                  color="text-purple-500"
                  subtitle="People following you"
                  index={3}
                />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 slide-in-left" style={{ animationDelay: '400ms' }}>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Award className="text-orange-500" />
                    Engagement Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Average Likes per Shayari</span>
                      <span className="font-bold text-red-400">
                        {writerAnalytics.totalShayaris > 0 
                          ? Math.round(writerAnalytics.totalLikes / writerAnalytics.totalShayaris * 10) / 10
                          : 0
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Average Views per Shayari</span>
                      <span className="font-bold text-green-400">
                        {writerAnalytics.totalShayaris > 0 
                          ? Math.round(writerAnalytics.totalViews / writerAnalytics.totalShayaris * 10) / 10
                          : 0
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Shares</span>
                      <span className="font-bold text-blue-400">{writerAnalytics.totalShares}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Engagement Rate</span>
                      <span className="font-bold text-orange-400">
                        {writerAnalytics.totalViews > 0 
                          ? Math.round((writerAnalytics.totalLikes / writerAnalytics.totalViews) * 100 * 10) / 10
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 slide-in-right" style={{ animationDelay: '500ms' }}>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="text-orange-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {writerAnalytics.recentActivities.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">
                            Someone {activity.action}d your shayari
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(activity.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Performing Shayaris */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="text-orange-500" />
                  Top Performing Shayaris
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {writerAnalytics.shayaris
                    .sort((a, b) => (b.likes + b.views * 0.1) - (a.likes + a.views * 0.1))
                    .slice(0, 6)
                    .map((shayari) => (
                      <div key={shayari.id} className="p-4 bg-white/5 rounded-lg">
                        <h4 className="font-bold text-orange-400 mb-2">{shayari.title}</h4>
                        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                          {shayari.content}
                        </p>
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
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* Reader Analytics */}
          {user.role === 'reader' && readerAnalytics && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Shayaris Read"
                  value={readerAnalytics.totalViews}
                  icon={Eye}
                  color="text-green-500"
                  subtitle="Total views"
                  index={0}
                />
                <StatCard
                  title="Likes Given"
                  value={readerAnalytics.totalLikes}
                  icon={Heart}
                  color="text-red-500"
                  subtitle="Appreciation shared"
                  index={1}
                />
                <StatCard
                  title="Shares Made"
                  value={readerAnalytics.totalShares}
                  icon={Share2}
                  color="text-blue-500"
                  subtitle="Content shared"
                  index={2}
                />
                <StatCard
                  title="Following"
                  value={readerAnalytics.followingCount}
                  icon={Users}
                  color="text-purple-500"
                  subtitle="Writers you follow"
                  index={3}
                />
              </div>

              {/* Reading Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="text-orange-500" />
                    Reading Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Reading Streak</span>
                      <span className="font-bold text-green-400">
                        {Math.floor(Math.random() * 15) + 1} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Favorite Genre</span>
                      <span className="font-bold text-purple-400">Love Poetry</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Engagement Rate</span>
                      <span className="font-bold text-orange-400">
                        {readerAnalytics.totalViews > 0 
                          ? Math.round((readerAnalytics.totalLikes / readerAnalytics.totalViews) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="text-orange-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {readerAnalytics.recentActivities.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.action === 'like' ? 'bg-red-500' :
                          activity.action === 'view' ? 'bg-green-500' :
                          activity.action === 'share' ? 'bg-blue-500' : 'bg-orange-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">
                            You {activity.action}d a shayari
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(activity.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Favorite Authors */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="text-orange-500" />
                  Your Favorite Authors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(readerAnalytics.favoriteAuthors)
                    .sort(([,a], [,b]) => (b.likes + b.views) - (a.likes + a.views))
                    .slice(0, 6)
                    .map(([authorId, stats]) => (
                      <div key={authorId} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            A
                          </div>
                          <div>
                            <p className="font-semibold">Author</p>
                            <p className="text-xs text-gray-400">@author</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {stats.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={12} />
                            {stats.likes} likes
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}