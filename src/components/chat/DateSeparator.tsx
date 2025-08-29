
import React from 'react';

interface DateSeparatorProps {
  timestamp: any;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ timestamp }) => {
  const formatDateSeparator = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Reset time to compare dates only
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      
      if (messageDate.getTime() === todayDate.getTime()) {
        return 'Today';
      } else if (messageDate.getTime() === yesterdayDate.getTime()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('Error formatting date separator:', error);
      return '';
    }
  };

  const dateText = formatDateSeparator(timestamp);
  
  if (!dateText) return null;

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
          {dateText}
        </span>
      </div>
    </div>
  );
};

export default DateSeparator;
