import { Dialog, DialogContent } from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Note } from '../../services/notesService';

interface ViewNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  formatTimeAgo: (timestamp: Date) => string;
}

const ViewNoteModal = ({ note, isOpen, onClose, formatTimeAgo }: ViewNoteModalProps) => {
  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center space-y-4 py-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={note.userAvatar || ''} />
            <AvatarFallback>
              {note.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{note.username}</h3>
            <p className="text-xl">{note.content}</p>
            <p className="text-sm text-muted-foreground">
              {formatTimeAgo(note.createdAt)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewNoteModal;