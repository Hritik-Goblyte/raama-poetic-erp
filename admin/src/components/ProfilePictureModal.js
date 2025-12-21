import { X } from 'lucide-react';

export default function ProfilePictureModal({ isOpen, onClose, profilePicture, userName }) {
  if (!isOpen || !profilePicture) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="relative max-w-2xl max-h-[90vh] w-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Profile Picture */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <img 
              src={profilePicture} 
              alt={userName || 'Profile Picture'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            
            {/* User Name Overlay */}
            {userName && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                <p className="text-white font-semibold text-lg text-center">{userName}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}