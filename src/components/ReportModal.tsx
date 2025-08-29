
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { reportUser, reportPost } from '../services/reportService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'user' | 'post';
  targetUserId?: string;
  targetUsername?: string;
  postId?: string;
  postAuthorId?: string;
}

const REPORT_REASONS = [
  'Spam',
  'Nudity or sexual content',
  'Harassment or bullying',
  'Hate speech',
  'Violence or dangerous content',
  'False information',
  'Intellectual property violation',
  'Other'
];

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  type,
  targetUserId,
  targetUsername,
  postId,
  postAuthorId
}) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || !currentUser) return;

    setIsSubmitting(true);
    try {
      let success = false;
      
      if (type === 'user' && targetUserId && targetUsername) {
        success = await reportUser(
          currentUser.uid,
          currentUser.displayName || currentUser.email || 'Unknown',
          targetUserId,
          targetUsername,
          selectedReason,
          description
        );
      } else if (type === 'post' && postId && postAuthorId) {
        success = await reportPost(
          currentUser.uid,
          currentUser.displayName || currentUser.email || 'Unknown',
          postId,
          postAuthorId,
          selectedReason,
          description
        );
      }

      if (success) {
        toast({
          title: "Report submitted",
          description: "Thank you for helping keep our community safe. We'll review your report."
        });
        onClose();
        setSelectedReason('');
        setDescription('');
      } else {
        toast({
          title: "Error",
          description: "Failed to submit report. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Report {type === 'user' ? 'User' : 'Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-medium mb-3">Why are you reporting this {type}?</h3>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-primary"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide more details about why you're reporting this..."
              className="w-full px-3 py-2 border rounded-lg resize-none h-20 text-sm"
              maxLength={500}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
