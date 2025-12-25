import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { setUserInStorage, setTokenInStorage } from '@/utils/storage';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://raama-backend-srrb.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    role: 'reader'
  });
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const [emailVerificationError, setEmailVerificationError] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Check for email verification token in URL (optional - users can login without verification)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmailToken(token);
    }
  }, [searchParams]);

  const verifyEmailToken = async (token) => {
    try {
      await axios.post(`${API}/auth/verify-email`, { token });
      toast.success('Email verified successfully!');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Email verification failed');
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: 'Checking...' });
    
    try {
      const response = await axios.post(`${API}/auth/check-username`, { username });
      const available = response.data.available;
      setUsernameStatus({
        checking: false,
        available,
        message: available ? 'Username is available!' : 'Username is already taken'
      });
    } catch (error) {
      setUsernameStatus({ checking: false, available: null, message: 'Error checking username' });
    }
  };

  const handleUsernameChange = (e) => {
    const username = e.target.value;
    setFormData({...formData, username});
    
    // Debounce username check
    clearTimeout(window.usernameTimeout);
    window.usernameTimeout = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailVerificationError(false);
    
    // Check username availability before registration
    if (!isLogin && (!usernameStatus.available && formData.username)) {
      toast.error('Please choose an available username');
      return;
    }
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      if (isLogin) {
        // Login successful
        setTokenInStorage(response.data.token);
        setUserInStorage(response.data.user);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        // Registration successful - redirect to OTP verification
        toast.success('Registration successful! Please check your email for OTP.');
        
        // Use setTimeout to ensure the toast is shown before navigation
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { email: formData.email },
            replace: true
          });
        }, 100);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Something went wrong';
      
      // Check if it's an email verification error
      if (error.response?.status === 403 && errorMessage.includes('verify your email')) {
        setEmailVerificationError(true);
      }
      
      toast.error(errorMessage);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    setResendingEmail(true);
    try {
      // Use the new OTP resend endpoint
      await axios.post(`${API}/auth/resend-otp`, {
        email: formData.email
      });
      toast.success('New OTP sent! Please check your email.');
      setEmailVerificationError(false);
      
      // Redirect to OTP verification page
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { email: formData.email },
          replace: true
        });
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'
    }}>
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2" style={{ 
            fontFamily: 'Tillana, cursive',
            color: '#ff6b35',
            textShadow: '0 0 30px rgba(255, 107, 53, 0.5)'
          }}>
            रामा..!
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400" style={{ fontFamily: 'Macondo, cursive' }}>
            The Poetic ERP
          </p>
        </div>

        <div className="glass-card p-4 sm:p-6 lg:p-8">
          <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6">
            <button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                isLogin ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                !isLogin ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <input
                      data-testid="firstName-input"
                      type="text"
                      placeholder="First Name"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <input
                      data-testid="lastName-input"
                      type="text"
                      placeholder="Last Name"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <input
                      data-testid="username-input"
                      type="text"
                      placeholder="Pen Name (Username)"
                      required
                      value={formData.username}
                      onChange={handleUsernameChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-black/30 border rounded-lg text-white placeholder-gray-500 focus:outline-none text-sm sm:text-base ${
                        usernameStatus.available === true ? 'border-green-500 focus:border-green-500' :
                        usernameStatus.available === false ? 'border-red-500 focus:border-red-500' :
                        'border-gray-700 focus:border-orange-500'
                      }`}
                    />
                    <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus.checking ? (
                        <Loader2 size={16} className="sm:w-5 sm:h-5 animate-spin text-orange-500" />
                      ) : usernameStatus.available === true ? (
                        <CheckCircle size={16} className="sm:w-5 sm:h-5 text-green-500" />
                      ) : usernameStatus.available === false ? (
                        <XCircle size={16} className="sm:w-5 sm:h-5 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {usernameStatus.message && (
                    <p className={`text-xs sm:text-sm mt-1 ${
                      usernameStatus.available === true ? 'text-green-500' :
                      usernameStatus.available === false ? 'text-red-500' :
                      'text-gray-400'
                    }`}>
                      {usernameStatus.message}
                    </p>
                  )}
                </div>
                <div>
                  <select
                    data-testid="role-select"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none text-sm sm:text-base"
                  >
                    <option value="reader">Reader</option>
                  </select>
                </div>
              </>
            )}
            
            <div>
              <input
                data-testid="email-input"
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none text-sm sm:text-base"
              />
            </div>
            
            <div className="relative">
              <input
                data-testid="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none text-sm sm:text-base"
              />
              <button
                data-testid="toggle-password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
              </button>
            </div>

            <button
              data-testid="submit-button"
              type="submit"
              className="w-full py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50 text-sm sm:text-base"
            >
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          {emailVerificationError && isLogin && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs sm:text-sm mb-2">
                Your email address is not verified.
              </p>
              <p className="text-gray-400 text-xs mb-2 sm:mb-3">
                Email: <span className="text-orange-500 break-all">{formData.email}</span>
              </p>
              <button
                onClick={handleResendVerification}
                disabled={resendingEmail || !formData.email}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                {resendingEmail ? (
                  <>
                    <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP & Verify Email'
                )}
              </button>
            </div>
          )}

          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-400">
            <p className="text-gray-500">
              Welcome to रामा - Where Poetry Meets Technology
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}