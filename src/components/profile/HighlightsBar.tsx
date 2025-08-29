import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import HighlightIcon from './HighlightIcon';
import CreateHighlightModal from './CreateHighlightModal';
import HighlightViewerModal from './HighlightViewerModal';
import { Highlight, getUserHighlights } from '../../services/highlightsService';
import { useAuth } from '../../contexts/AuthContext';

interface HighlightsBarProps {
  userId: string;
  isOwnProfile: boolean;
}

const HighlightsBar: React.FC<HighlightsBarProps> = ({ userId, isOwnProfile }) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  // Load highlights
  useEffect(() => {
    const loadHighlights = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const userHighlights = await getUserHighlights(userId);
        setHighlights(userHighlights);
      } catch (error) {
        console.error('Error loading highlights:', error);
      }
      setLoading(false);
    };

    loadHighlights();
  }, [userId]);

  const handleCreateHighlight = () => {
    setShowCreateModal(true);
  };

  const handleHighlightClick = (highlight: Highlight) => {
    setSelectedHighlight(highlight);
  };

  const handleHighlightCreated = (newHighlight: Highlight) => {
    setHighlights(prev => [newHighlight, ...prev]);
    setShowCreateModal(false);
  };

  const handleHighlightDeleted = (highlightId: string) => {
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
    setSelectedHighlight(null);
  };

  if (loading) {
    return (
      <div className="flex space-x-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (highlights.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <>
      <div className="px-4 py-2">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Add highlight button (only for own profile) */}
          {isOwnProfile && (
            <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={handleCreateHighlight}>
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                <Plus className="text-gray-500 dark:text-gray-400" size={24} />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">New</span>
            </div>
          )}

          {/* Existing highlights */}
          {highlights.map((highlight) => (
            <div key={highlight.id} className="flex-shrink-0">
              <HighlightIcon
                highlight={highlight}
                onClick={() => handleHighlightClick(highlight)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Create Highlight Modal */}
      {showCreateModal && (
        <CreateHighlightModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onHighlightCreated={handleHighlightCreated}
        />
      )}

      {/* Highlight Viewer Modal */}
      {selectedHighlight && (
        <HighlightViewerModal
          isOpen={!!selectedHighlight}
          highlight={selectedHighlight}
          onClose={() => setSelectedHighlight(null)}
          onHighlightDeleted={handleHighlightDeleted}
          canDelete={isOwnProfile}
        />
      )}
    </>
  );
};

export default HighlightsBar;
