import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createNote, deleteNote, Note } from '../../services/notesService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNote?: Note;
}

const CreateNoteModal = ({ isOpen, onClose, existingNote }: CreateNoteModalProps) => {
  const { currentUser } = useAuth();
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingNote && isOpen) {
      setNoteText(existingNote.content || '');
    } else if (isOpen) {
      setNoteText('');
    }
  }, [existingNote, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid || !noteText.trim()) return;

    setLoading(true);
    try {
      await createNote(currentUser.uid, noteText.trim());
      toast.success(existingNote ? 'Note updated!' : 'Note posted!');
      onClose();
    } catch (error) {
      console.error('Error posting note:', error);
      toast.error('Failed to post note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser?.uid || !existingNote) return;

    setLoading(true);
    try {
      await deleteNote(currentUser.uid);
      toast.success('Note deleted!');
      onClose();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {existingNote ? 'Edit your note' : 'Add a note'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Share a thought..."
              maxLength={60}
              className="text-center text-lg"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {noteText.length}/60 characters
            </p>
          </div>

          <div className="flex space-x-2">
            {existingNote && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1"
              >
                Delete
              </Button>
            )}
            <Button
              type="submit"
              disabled={!noteText.trim() || loading}
              className="flex-1"
            >
              {loading ? 'Posting...' : existingNote ? 'Update' : 'Share'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNoteModal;