import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await axios.post(`${API}/auth/verify-email`, { token });
      setStatus('success');
      setMessage(response.data.message);
      toast.success('Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Email verification failed');
      toast.error('Email verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'
    }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-6xl font-bold mb-2" style={{ 
            fontFamily: 'Tillana, cursive',
            color: '#ff6b35',
            textShadow: '0 0 30px rgba(255, 107, 53, 0.5)'
          }}>
            रामा..!
          </h1>
          <p className="text-gray-400 text-lg" style={{ fontFamily: 'Macondo, cursive' }}>
            Email Verification
          </p>
        </div>

        <div className="glass-card p-6 lg:p-8 text-center">
          <div className="mb-6">
            {status === 'verifying' && (
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={32} className="text-orange-500 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
            )}
          </div>

          <h2 className={`text-2xl font-bold mb-4 ${
            status === 'success' ? 'text-green-500' :
            status === 'error' ? 'text-red-500' :
            'text-orange-500'
          }`}>
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          <p className="text-gray-400 mb-6">
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified. You can now login to your account.'}
            {status === 'error' && message}
          </p>

          {status === 'success' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm">
                Redirecting to login page in 3 seconds...
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              {status === 'success' ? 'Go to Login' : 'Back to Login'}
            </button>

            {status === 'error' && (
              <p className="text-gray-500 text-sm">
                If you continue to have issues, please contact support or try registering again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}