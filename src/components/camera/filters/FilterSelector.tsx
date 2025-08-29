
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Filter {
  id: string;
  name: string;
  icon: string;
  preview: string;
  description: string;
}

interface FilterSelectorProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  disabled?: boolean;
}

const FILTERS: Filter[] = [
  {
    id: 'normal',
    name: 'Normal',
    icon: '👤',
    preview: '👤',
    description: 'No filter'
  },
  {
    id: 'dog',
    name: 'Dog',
    icon: '🐶',
    preview: '🐕',
    description: 'Dog ears & nose'
  },
  {
    id: 'cat',
    name: 'Cat',
    icon: '🐱',
    preview: '🐈',
    description: 'Cat ears & nose'
  },
  {
    id: 'glasses',
    name: 'Glasses',
    icon: '🤓',
    preview: '👓',
    description: 'Cool sunglasses'
  },
  {
    id: 'heart',
    name: 'Heart Eyes',
    icon: '😍',
    preview: '💕',
    description: 'Heart eyes'
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    icon: '✨',
    preview: '⭐',
    description: 'Face sparkles'
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    preview: '🎨',
    description: 'Rainbow overlay'
  }
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  activeFilter,
  onFilterChange,
  disabled = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    checkScrollability();
  }, []);

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -120, behavior: 'smooth' });
      setTimeout(checkScrollability, 300);
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 120, behavior: 'smooth' });
      setTimeout(checkScrollability, 300);
    }
  };

  const handleFilterSelect = (filterId: string) => {
    onFilterChange(filterId);
    
    // Save to localStorage for persistence
    localStorage.setItem('lastUsedFilter', filterId);
  };

  return (
    <div className="absolute bottom-32 left-0 right-0 px-4">
      <div className="relative flex items-center justify-center">
        {/* Left scroll button */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className="absolute left-0 z-10 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronLeft size={16} />
          </Button>
        )}

        {/* Filters container */}
        <div 
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto scrollbar-hide px-12 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={checkScrollability}
        >
          {FILTERS.map((filter) => (
            <Button
              key={filter.id}
              variant="ghost"
              size="sm"
              onClick={() => handleFilterSelect(filter.id)}
              disabled={disabled}
              className={`flex-shrink-0 w-16 h-16 rounded-full p-0 text-2xl transition-all duration-300 ${
                activeFilter === filter.id
                  ? 'bg-white/90 scale-110 shadow-lg ring-2 ring-white/50'
                  : 'bg-black/30 hover:bg-white/40 hover:scale-105'
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-lg leading-none">{filter.icon}</span>
                {activeFilter === filter.id && (
                  <div className="w-1 h-1 bg-blue-400 rounded-full mt-1 animate-pulse" />
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            className="absolute right-0 z-10 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronRight size={16} />
          </Button>
        )}
      </div>

      {/* Filter name indicator */}
      <div className="text-center mt-2">
        <span className="text-white/80 text-sm font-medium">
          {FILTERS.find(f => f.id === activeFilter)?.name || 'Normal'}
        </span>
      </div>
    </div>
  );
};
