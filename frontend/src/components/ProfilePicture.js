import { useState, useRef } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfilePicture({ user, onUpdate, size = 'md', editable = false }) {
  const [uploading, setUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('raama-token');

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Convert to base64 and upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setUploading(true);
          await uploadProfilePicture(e.target.result);
        } catch (error) {
          toast.error('Failed to upload image');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async (base64Image) => {
    try {
      await axios.put(`${API}/profile/picture`, {
        profilePicture: base64Image
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Profile picture updated successfully!');
      if (onUpdate) onUpdate(base64Image);
      setShowUploadOptions(false);
    } catch (error) {
      throw error;
    }
  };

  const removeProfilePicture = async () => {
    try {
      setUploading(true);
      await axios.delete(`${API}/profile/picture`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Profile picture removed');
      if (onUpdate) onUpdate(null);
      setShowUploadOptions(false);
    } catch (error) {
      toast.error('Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center relative group ${
        user?.profilePicture && !editable ? 'cursor-pointer hover:ring-2 hover:ring-orange-500/50 transition-all' : ''
      }`}>
        {user?.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-bold text-sm">
            {getInitials()}
          </span>
        )}
        
        {editable && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={iconSizes[size] * 0.6} className="text-white" />
          </div>
        )}
      </div>

      {editable && (
        <>
          <button
            onClick={() => setShowUploadOptions(!showUploadOptions)}
            className="absolute -bottom-1 -right-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-1 transition-all"
            disabled={uploading}
          >
            <Camera size={12} />
          </button>

          {showUploadOptions && (
            <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-48">
              <div className="p-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-all text-white"
                >
                  <Upload size={16} />
                  <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                </button>
                
                {user?.profilePicture && (
                  <button
                    onClick={removeProfilePicture}
                    disabled={uploading}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-all text-red-400"
                  >
                    <Trash2 size={16} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {showUploadOptions && (
            <div 
              className="fixed inset-0 z-5"
              onClick={() => setShowUploadOptions(false)}
            />
          )}
        </>
      )}
    </div>
  );
}