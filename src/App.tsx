
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import { initializeFCM, onForegroundMessage } from "./services/fcmService";
// Import pages
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import Reels from "./pages/Reels";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Chat from "./pages/Chat";
import IndividualChat from "./pages/IndividualChat";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import AddStory from "./pages/AddStory";
import StoryViewerPage from "./pages/StoryViewerPage";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import LikedPosts from "./pages/LikedPosts";
import LanguageSettings from "./pages/LanguageSettings";
// Import new settings sub-pages
import LikedPostsReels from "./pages/LikedPostsReels";
import Archive from "./pages/Archive";
import BlockedUsers from "./pages/BlockedUsers";
import MyStories from "./pages/MyStories";

const queryClient = new QueryClient();

const AppContent = () => {
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (currentUser) {
      // Initialize FCM when user is logged in
      initializeFCM(currentUser.uid);
      
      // Set up foreground message listener
      onForegroundMessage();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/create" element={<CreatePost />} />
      <Route path="/reels" element={<Reels />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat/:userId" element={<IndividualChat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/language" element={<LanguageSettings />} />
      <Route path="/liked-posts" element={<LikedPosts />} />
      {/* New settings sub-pages */}
      <Route path="/liked" element={<LikedPostsReels />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/blocked" element={<BlockedUsers />} />
      <Route path="/mystories" element={<MyStories />} />
      <Route path="/add-story" element={<AddStory />} />
      <Route path="/story/:userIndex/:storyIndex" element={<StoryViewerPage />} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
