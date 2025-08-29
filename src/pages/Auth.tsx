import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { login, signup, googleLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast({ title: "Welcome back!", description: "Successfully signed in." });
      } else {
        if (!username.trim() || !displayName.trim()) {
          toast({
            title: "Error",
            description: "Username and display name are required",
            variant: "destructive"
          });
          return;
        }
        await signup(email, password, username.trim(), displayName.trim());
        toast({ title: "Account created!", description: "Welcome to Genzly!" });
      }
      navigate('/');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;
    
    setGoogleLoading(true);
    console.log('🔄 Starting Google login...');
    
    try {
      await googleLogin();
      console.log('✅ Google login successful');
      
      toast({ 
        title: "Welcome!", 
        description: "Successfully signed in with Google." 
      });
      navigate('/');
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      
      // Show user-friendly error message
      toast({
        title: "Google Sign-in Failed",
        description: error.message || "Please try again or use email/password",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="h-12 text-base border-gray-300 focus:border-gray-400 focus:ring-0"
              />
            </div>
            
            {!isLogin && (
              <>
                <div>
                  <Input
                    type="text"
                    placeholder="Username (e.g., john_doe)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                    disabled={loading || googleLoading}
                    className="h-12 text-base border-gray-300 focus:border-gray-400 focus:ring-0"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Display Name (e.g., John Doe)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="h-12 text-base border-gray-300 focus:border-gray-400 focus:ring-0"
                  />
                </div>
              </>
            )}
            
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="h-12 text-base border-gray-300 focus:border-gray-400 focus:ring-0 pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password link - only show on login */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                onClick={() => setShowForgotPassword(true)}
                disabled={loading || googleLoading}
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md"
              disabled={loading || googleLoading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </div>
        </form>
        
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading || googleLoading}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default Auth;
