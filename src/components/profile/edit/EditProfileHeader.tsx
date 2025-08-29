
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface EditProfileHeaderProps {
  hasChanges: boolean;
  saving: boolean;
  hasErrors: boolean;
  onSave: () => void;
}

const EditProfileHeader = ({ hasChanges, saving, hasErrors, onSave }: EditProfileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => navigate('/profile')} 
          className="p-2 hover:bg-muted rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold">Edit profile</h1>
      </div>
      
      <Button
        onClick={onSave}
        disabled={!hasChanges || saving || hasErrors}
        size="sm"
        className="font-semibold"
      >
        {saving ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Saving</span>
          </div>
        ) : (
          'Save'
        )}
      </Button>
    </div>
  );
};

export default EditProfileHeader;
