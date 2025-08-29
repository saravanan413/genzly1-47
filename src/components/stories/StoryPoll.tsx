
import React, { useState } from 'react';

interface StoryPollProps {
  question: string;
  options: string[];
  onVote?: (optionIndex: number) => void;
  results?: number[];
  hasVoted?: boolean;
  votedOption?: number;
}

const StoryPoll: React.FC<StoryPollProps> = ({
  question,
  options,
  onVote,
  results = [0, 0],
  hasVoted = false,
  votedOption
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleVote = (optionIndex: number) => {
    if (!hasVoted && !selectedOption) {
      setSelectedOption(optionIndex);
      onVote?.(optionIndex);
    }
  };

  const totalVotes = results.reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 mx-4 my-8">
      <h3 className="text-white text-lg font-semibold mb-4 text-center">
        {question}
      </h3>
      
      <div className="space-y-3">
        {options.map((option, index) => {
          const percentage = totalVotes > 0 ? (results[index] / totalVotes) * 100 : 0;
          const isSelected = selectedOption === index || votedOption === index;
          
          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={hasVoted || selectedOption !== null}
              className={`relative w-full p-3 rounded-xl text-white font-medium overflow-hidden transition-all duration-200 ${
                isSelected 
                  ? 'bg-white/30 border-2 border-white' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {/* Progress bar for results */}
              {(hasVoted || selectedOption !== null) && (
                <div 
                  className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              <div className="relative z-10 flex justify-between items-center">
                <span>{option}</span>
                {(hasVoted || selectedOption !== null) && (
                  <span className="text-sm">{Math.round(percentage)}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {totalVotes > 0 && (
        <p className="text-white/70 text-sm text-center mt-3">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default StoryPoll;
