import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  // Check for email verification token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmailToken(token);
    }
  }, [searchParams]);

  const verifyEmailToken = async (token) => {
    try {
      await axios.post(`${API}/auth/verify-email`, { token });
      toast.success('Email verified successfully! You can now login.');
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
    
    // Check username availability before registration
    if (!isLogin && (!usernameStatus.available && formData.username)) {
      toast.error('Please choose an available username');
      return;
    }
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      if (isLogin) {
        localStorage.setItem('raama-token', response.data.token);
        localStorage.setItem('raama-user', JSON.stringify(response.data.user));
        toast.success('Welcome back!');
        navigate('/');
      } else {
        // Registration successful - show email verification message
        setVerificationEmail(formData.email);
        setShowEmailVerification(true);
        toast.success('Registration successful! Please check your email to verify your account.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Something went wrong';
      
      if (errorMessage.includes('verify your email')) {
        // Show email verification dialog for unverified accounts
        setVerificationEmail(formData.email);
        setShowEmailVerification(true);
      }
      
      toast.error(errorMessage);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingEmail(true);
    try {
      await axios.post(`${API}/auth/resend-verification`, {
        email: verificationEmail,
        password: formData.password
      });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resend verification email');
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)'
    }}>
      <div className="w-full max-w-md p-6 lg:p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-6xl font-bold mb-2" style={{ 
            fontFamily: 'Tillana, cursive',
            color: '#ff6b35',
            textShadow: '0 0 30px rgba(255, 107, 53, 0.5)'
          }}>
            रामा..!
          </h1>
          <p className="text-gray-400 text-lg" style={{ fontFamily: 'Macondo, cursive' }}>
            The Poetic ERP
          </p>
        </div>

        <div className="glass-card p-6 lg:p-8">
          <div className="flex gap-2 mb-6">
            <button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                isLogin ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                !isLogin ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <input
                    data-testid="firstName-input"
                    type="text"
                    placeholder="First Name"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
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
                    className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                  />
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
                      className={`w-full px-4 py-3 pr-12 bg-black/30 border rounded-lg text-white placeholder-gray-500 focus:outline-none ${
                        usernameStatus.available === true ? 'border-green-500 focus:border-green-500' :
                        usernameStatus.available === false ? 'border-red-500 focus:border-red-500' :
                        'border-gray-700 focus:border-orange-500'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus.checking ? (
                        <Loader2 size={20} className="animate-spin text-orange-500" />
                      ) : usernameStatus.available === true ? (
                        <CheckCircle size={20} className="text-green-500" />
                      ) : usernameStatus.available === false ? (
                        <XCircle size={20} className="text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {usernameStatus.message && (
                    <p className={`text-sm mt-1 ${
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
                    className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
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
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
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
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
              <button
                data-testid="toggle-password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              data-testid="submit-button"
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50"
            >
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Demo Accounts:</p>
            <p>Writer: writer@raama.com / password123</p>
            <p>Reader: reader@raama.com / password123</p>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card p-6 lg:p-8 max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-orange-500 mb-2">Verify Your Email</h2>
              <p className="text-gray-400">
                We've sent a verification link to <span className="text-white font-semibold">{verificationEmail}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Next Steps:</strong>
                </p>
                <ul className="text-blue-300 text-sm mt-2 space-y-1">
                  <li>• Check your email inbox</li>
                  <li>• Click the verification link</li>
                  <li>• Return here to login</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailVerification(false)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResendingEmail ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Email'
                  )}
                </button>
              </div>

              <p className="text-gray-500 text-xs text-center">
                Didn't receive the email? Check your spam folder or click "Resend Email"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}