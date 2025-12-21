import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, User } from 'lucide-react';

export default function ProfilePictureModal({ isOpen, onClose, profilePicture, userName }) {
  if (!profilePicture) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-black/95 backdrop-blur-xl border-orange-500/30 max-w-2xl max-h-[95vh] w-[98vw] lg:w-full p-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 m-1 lg:m-auto"
        aria-describedby="profile-picture-modal-description"
      >
        <div className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>

          {/* Profile Picture */}
          <div className="flex items-center justify-center p-8">
            <div className="relative">
              <img 
                src={profilePicture} 
                alt={userName || 'Profile Picture'}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
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

        <p id="profile-picture-modal-description" className="sr-only">
          Expanded view of profile picture for {userName || 'user'}
        </p>
      </DialogContent>
    </Dialog>
  );
}