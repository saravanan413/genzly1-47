
import { useState, useEffect } from 'react';
import { UserProfile } from '../services/firestoreService';
import { searchUsers } from '../utils/userSearch';

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (query.trim() && isActive) {
        setLoading(true);
        const results = await searchUsers(query);
        setUsers(results);
        setLoading(false);
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, isActive]);

  const clearSearch = () => {
    setQuery('');
    setUsers([]);
  };

  return {
    query,
    setQuery,
    isActive,
    setIsActive,
    users,
    loading,
    clearSearch
  };
};
