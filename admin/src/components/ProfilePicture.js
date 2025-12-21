import { useState } from 'react';
import { User } from 'lucide-react';

export default function ProfilePicture({ user, size = 'md', onClick }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl',
    '2xl': 'text-4xl'
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  const handleClick = () => {
    if (onClick && user?.profilePicture) {
      onClick(user.profilePicture);
    }
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center relative ${
        onClick && user?.profilePicture ? 'cursor-pointer hover:ring-2 hover:ring-orange-500/50 transition-all' : ''
      }`}
      onClick={handleClick}
    >
      {user?.profilePicture ? (
        <img 
          src={user.profilePicture} 
          alt={`${user.firstName} ${user.lastName}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`text-white font-bold ${textSizes[size]}`}>
          {getInitials()}
        </span>
      )}
    </div>
  );
}