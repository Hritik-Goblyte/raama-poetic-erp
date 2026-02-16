import { useEffect, useState } from 'react';

const LoadingScreen = ({ stage = 'loading', message = 'Loading...' }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const stages = {
    authenticating: {
      message: 'Authenticating',
      icon: '🔐',
      color: 'text-blue-500',
      progress: 25
    },
    loading_profile: {
      message: 'Loading your profile',
      icon: '👤',
      color: 'text-green-500',
      progress: 50
    },
    fetching_content: {
      message: 'Fetching shayaris',
      icon: '📖',
      color: 'text-purple-500',
      progress: 75
    },
    almost_ready: {
      message: 'Almost ready',
      icon: '✨',
      color: 'text-orange-500',
      progress: 90
    },
    loading: {
      message: message,
      icon: '⏳',
      color: 'text-orange-500',
      progress: 50
    }
  };

  const currentStage = stages[stage] || stages.loading;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-50">
      <div className="text-center max-w-md px-6">
        {/* Animated Logo */}
        <div className="mb-8 animate-pulse">
          <h1 className="text-5xl font-bold text-orange-500 mb-2" style={{ fontFamily: 'Tillana, cursive' }}>
            रामा….
          </h1>
          <p className="text-gray-400 text-sm">The Poetic Platform</p>
        </div>

        {/* Spinner with Icon */}
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-orange-500 mx-auto loading-spinner-glow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl animate-pulse">{currentStage.icon}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className={`h-full ${currentStage.color.replace('text-', 'bg-')} transition-all duration-500 ease-out`}
            style={{ width: `${currentStage.progress}%` }}
          ></div>
        </div>

        {/* Loading Message */}
        <p className={`text-xl font-medium ${currentStage.color} mb-2 animate-fade-in-up`}>
          {currentStage.message}{dots}
        </p>
        <p className="text-gray-500 text-sm animate-fade-in-up animate-delay-100">
          Please wait while we prepare everything for you
        </p>

        {/* Loading Tips */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-xs">
            💡 <span className="text-gray-300">Tip:</span> You can create beautiful shayaris and share them with the community!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;