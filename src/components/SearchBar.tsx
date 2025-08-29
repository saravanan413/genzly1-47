
import React, { useEffect, useRef } from 'react';
import SearchInput from './SearchInput';
import SearchDropdown from './SearchDropdown';
import { useSearch } from '../hooks/useSearch';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  onUserSelect?: (userId: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search...", 
  onUserSelect 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    query,
    setQuery,
    isActive,
    setIsActive,
    users,
    loading,
    clearSearch
  } = useSearch();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleUserClick = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
    setIsActive(false);
    setQuery('');
  };

  const handleClear = () => {
    clearSearch();
    onSearch('');
  };

  return (
    <div ref={containerRef} className="relative mb-6">
      <SearchInput
        query={query}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={() => setIsActive(true)}
        onClear={handleClear}
      />
      
      <SearchDropdown
        isVisible={isActive}
        loading={loading}
        users={users}
        query={query}
        onUserClick={handleUserClick}
      />
    </div>
  );
};

export default SearchBar;
