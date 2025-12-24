import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { setUserInStorage, setTokenInStorage } from '@/utils/storage';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef([]);
  
  const email = location.state?.email || '';

  useEffect(() => {
    console.log('OTPVerification mounted');
    console.log('Location state:', location.state);
    console.log('Email from state:', email);
    
    if (!email) {
      console.log('No email found, redirecting to login');
      navigate('/login');
      return;
    }

    // Timer for OTP expiry
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    
    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/verify-otp`, {
        email,
        otp: otpString
      });

      setTokenInStorage(response.data.token);
      setUserInStorage(response.data.user);
      toast.success('Email verified successfully! Welcome to रामा!');
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'OTP verification failed';
      toast.error(errorMessage);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      await axios.post(`${API}/auth/resend-otp`, { email });
      toast.success('New OTP sent! Please check your email.');
      setTimeLeft(600); // Reset timer
      setOtp(['', '', '', '', '', '']); // Clear current OTP
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'
    }}>
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2" style={{ 
            fontFamily: 'Tillana, cursive',
            color: '#ff6b35',
            textShadow: '0 0 30px rgba(255, 107, 53, 0.5)'
          }}>
            रामा..!
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400" style={{ fontFamily: 'Macondo, cursive' }}>
            Email Verification
          </p>
        </div>

        <div className="glass-card p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Mail size={24} className="sm:w-8 sm:h-8 text-orange-500" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
              Enter Verification Code
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mb-1">
              We've sent a 6-digit code to
            </p>
            <p className="text-sm sm:text-base text-orange-500 font-medium break-all px-2">
              {email}
            </p>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="flex gap-2 sm:gap-3 justify-center mb-3 sm:mb-4" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-center text-lg sm:text-xl lg:text-2xl font-bold bg-black/30 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                />
              ))}
            </div>

            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-xs sm:text-sm text-gray-400">
                  Code expires in: <span className="text-orange-500 font-medium">{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-red-400">
                  OTP has expired. Please request a new one.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="sm:w-5 sm:h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>

            <button
              onClick={handleResendOTP}
              disabled={resending || timeLeft > 540} // Allow resend after 1 minute
              className="w-full py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {resending ? (
                <>
                  <Loader2 size={16} className="sm:w-5 sm:h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="sm:w-5 sm:h-5" />
                  Resend OTP
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 sm:py-3 text-gray-400 hover:text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
              Back to Login
            </button>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the code? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}