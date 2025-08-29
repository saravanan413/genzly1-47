import { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Bell, Eye, Heart, Shield, HelpCircle, LogOut, Moon, Globe, Camera, ThumbsUp, Play, Database, Key, Archive } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useUserProfile } from '../hooks/useFirebaseData';
import ChangePasswordModal from '../components/auth/ChangePasswordModal';
import LogoutConfirmationDialog from '../components/LogoutConfirmationDialog';

const Settings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataSaverEnabled, setDataSaverEnabled] = useState(() => {
    return localStorage.getItem('dataSaverEnabled') === 'true';
  });
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useUserProfile(currentUser?.uid || '');
  
  const [privateAccount, setPrivateAccount] = useState(false);

  // Load private account setting from profile
  useEffect(() => {
    if (profile) {
      setPrivateAccount(profile.isPrivate || false);
    }
  }, [profile]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleDataSaverChange = (enabled: boolean) => {
    setDataSaverEnabled(enabled);
    localStorage.setItem('dataSaverEnabled', enabled.toString());
  };

  const handlePrivateAccountChange = async (isPrivate: boolean) => {
    if (!currentUser?.uid) return;
    
    setUpdatingPrivacy(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        isPrivate: isPrivate
      });
      
      setPrivateAccount(isPrivate);
      toast({
        title: "Success",
        description: isPrivate ? "Your account is now private" : "Your account is now public"
      });
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy setting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
      navigate('/auth');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to log out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirmation(false);
    }
  };

  // Check if user signed in with email/password (can change password)
  const canChangePassword = currentUser?.providerData?.some(
    provider => provider.providerId === 'password'
  );

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Link to="/profile">
              <ArrowLeft size={24} className="text-foreground" />
            </Link>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          </div>

          {/* Settings Groups */}
          <div className="space-y-6">
            {/* Account Settings */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Account</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Lock size={20} className="text-muted-foreground" />
                    <div>
                      <span className="text-foreground">Private Account</span>
                      <p className="text-sm text-muted-foreground">Require approval for follow requests</p>
                    </div>
                  </div>
                  <Switch
                    checked={privateAccount}
                    onCheckedChange={handlePrivateAccountChange}
                    disabled={updatingPrivacy}
                  />
                </div>

                {/* Change Password - only show for email/password users */}
                {canChangePassword && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <Key size={20} className="text-muted-foreground" />
                      <span className="text-foreground">Change Password</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowChangePassword(true)}
                    >
                      <ArrowLeft size={16} className="rotate-180" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 cursor-pointer" onClick={() => navigate('/archive')}>
                  <div className="flex items-center space-x-3">
                    <Archive size={20} className="text-muted-foreground" />
                    <span className="text-foreground">Archive</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>

                <div className="flex items-center justify-between py-2 cursor-pointer" onClick={() => navigate('/liked')}>
                  <div className="flex items-center space-x-3">
                    <ThumbsUp size={20} className="text-muted-foreground" />
                    <span className="text-foreground">Liked Posts</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>

                <div className="flex items-center justify-between py-2 cursor-pointer" onClick={() => navigate('/mystories')}>
                  <div className="flex items-center space-x-3">
                    <Play size={20} className="text-muted-foreground" />
                    <span className="text-foreground">My Stories</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Privacy</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Eye size={20} className="text-muted-foreground" />
                    <span className="text-foreground">Story</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Heart size={20} className="text-muted-foreground" />
                    <span className="text-foreground">Posts</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>

                <div className="flex items-center justify-between py-2 cursor-pointer" onClick={() => navigate('/blocked')}>
                  <div className="flex items-center space-x-3">
                    <Shield size={20} className="text-muted-foreground" />
                    <span className="text-foreground">Blocked Accounts</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Bell size={20} className="text-muted-foreground" />
                    <div>
                      <span className="text-foreground">Push Notifications</span>
                      <p className="text-sm text-muted-foreground">Get notified about likes, comments, and follows</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Data & Storage */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Data & Storage</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Database size={20} className="text-muted-foreground" />
                    <div>
                      <span className="text-foreground">Data Saver</span>
                      <p className="text-sm text-muted-foreground">Reduce data usage by loading lower quality images</p>
                    </div>
                  </div>
                  <Switch
                    checked={dataSaverEnabled}
                    onCheckedChange={handleDataSaverChange}
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Appearance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Moon size={20} className="text-muted-foreground" />
                    <div>
                      <span className="text-foreground">Dark Mode</span>
                      <p className="text-sm text-muted-foreground">Switch to dark theme</p>
                    </div>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Globe size={20} className="text-muted-foreground" />
                    <span className="text-foreground">Language</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Support</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <HelpCircle size={20} className="text-muted-foreground" />
                    <span className="text-foreground">Help Center</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Shield size={20} className="text-muted-foreground" />
                    <span className="text-foreground">Report a Problem</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="rotate-180" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="bg-card rounded-lg border p-4">
              <Button 
                variant="destructive" 
                className="w-full flex items-center space-x-2"
                onClick={() => setShowLogoutConfirmation(true)}
                disabled={loggingOut}
              >
                <LogOut size={20} />
                <span>{loggingOut ? 'Logging out...' : 'Log Out'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogout}
      />
    </Layout>
  );
};

export default Settings;
