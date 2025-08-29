
import { useState, useRef } from 'react';
import { Image, Camera, Mic, File } from 'lucide-react';

interface MediaUploadProps {
  onSendMedia: (media: { type: 'image' | 'video' | 'audio' | 'file'; url: string; name: string }) => void;
}

const MediaUpload = ({ onSendMedia }: MediaUploadProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      let type: 'image' | 'video' | 'audio' | 'file' = 'file';
      
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      onSendMedia({
        type,
        url: result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      setRecordedChunks(chunks);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onload = () => {
          onSendMedia({
            type: 'audio',
            url: reader.result as string,
            name: `voice-message-${Date.now()}.wav`
          });
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setRecordedChunks([]);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <button
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.accept = "image/*";
            fileInputRef.current.click();
          }
        }}
        className="p-2 hover:bg-muted dark:hover:bg-gray-700 rounded-full transition-colors"
        title="Upload Image"
      >
        <Image size={20} className="text-foreground dark:text-white" />
      </button>

      <button
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.accept = "video/*";
            fileInputRef.current.click();
          }
        }}
        className="p-2 hover:bg-muted dark:hover:bg-gray-700 rounded-full transition-colors"
        title="Upload Video"
      >
        <Camera size={20} className="text-foreground dark:text-white" />
      </button>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-2 rounded-full transition-colors ${
          isRecording 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'hover:bg-muted dark:hover:bg-gray-700 text-foreground dark:text-white'
        }`}
        title={isRecording ? "Stop Recording" : "Record Voice"}
      >
        <Mic size={20} />
      </button>

      <button
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.accept = "*/*";
            fileInputRef.current.click();
          }
        }}
        className="p-2 hover:bg-muted dark:hover:bg-gray-700 rounded-full transition-colors"
        title="Upload File"
      >
        <File size={20} className="text-foreground dark:text-white" />
      </button>
    </div>
  );
};

export default MediaUpload;
