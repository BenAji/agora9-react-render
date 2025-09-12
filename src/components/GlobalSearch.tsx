import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, Building2, Users, Bell } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'event' | 'company' | 'subscription' | 'user';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface GlobalSearchProps {
  onResultClick?: (result: SearchResult) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onResultClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock search results - in real app, this would be an API call
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'event',
      title: 'Q4 Earnings Call',
      subtitle: 'Apple Inc. - Dec 15, 2024',
      icon: <Calendar size={16} />
    },
    {
      id: '2',
      type: 'company',
      title: 'Apple Inc.',
      subtitle: 'Technology - AAPL',
      icon: <Building2 size={16} />
    },
    {
      id: '3',
      type: 'subscription',
      title: 'Technology Sector',
      subtitle: '12 companies subscribed',
      icon: <Bell size={16} />
    },
    {
      id: '4',
      type: 'user',
      title: 'John Smith',
      subtitle: 'john.smith@company.com',
      icon: <Users size={16} />
    }
  ];

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filteredResults);
      setIsLoading(false);
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="global-search" ref={dropdownRef}>
      <div className="search-input-container">
        <Search size={16} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search events, companies, subscriptions..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        <div className="search-shortcut">Ctrl+K</div>
      </div>

      {isOpen && (
        <div className="search-dropdown">
          {isLoading ? (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="search-results">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="result-icon">{result.icon}</div>
                  <div className="result-content">
                    <div className="result-title">{result.title}</div>
                    <div className="result-subtitle">{result.subtitle}</div>
                  </div>
                  <div className="result-type">{result.type}</div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="search-no-results">
              <Search size={24} />
              <span>No results found for "{query}"</span>
            </div>
          ) : (
            <div className="search-placeholder">
              <Search size={24} />
              <span>Start typing to search...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
