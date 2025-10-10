import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, Building2, Bell } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { CalendarEvent } from '../types/database';

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

  // Real search data from API
  const [searchData, setSearchData] = useState<{
    events: CalendarEvent[];
    companies: any[];
    subsectors: string[];
  }>({
    events: [],
    companies: [],
    subsectors: []
  });

  // Load search data on component mount
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [eventsResponse, companiesResponse, subsectorsResponse] = await Promise.all([
          apiClient.getEvents(),
          apiClient.getAllCompanies(),
          apiClient.getAllSubsectors()
        ]);

        setSearchData({
          events: eventsResponse.success ? eventsResponse.data.events : [],
          companies: companiesResponse.success ? companiesResponse.data : [],
          subsectors: subsectorsResponse.success ? subsectorsResponse.data : []
        });
      } catch (error) {
        // Handle error silently for search
      }
    };

    loadSearchData();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const query = searchQuery.toLowerCase();
      const searchResults: SearchResult[] = [];

      // Search events
      searchData.events.forEach(event => {
        if (
          event.title.toLowerCase().includes(query) ||
          (event.description && event.description.toLowerCase().includes(query)) ||
          event.companies.some(company => 
            company.company_name.toLowerCase().includes(query) ||
            company.ticker_symbol.toLowerCase().includes(query)
          )
        ) {
          searchResults.push({
            id: event.id,
            type: 'event',
            title: event.title,
            subtitle: `${event.companies[0]?.company_name || 'Unknown'} - ${new Date(event.start_date).toLocaleDateString()}`,
            icon: <Calendar size={16} />
          });
        }
      });

      // Search companies
      searchData.companies.forEach(company => {
        if (
          company.company_name.toLowerCase().includes(query) ||
          company.ticker_symbol.toLowerCase().includes(query) ||
          company.gics_subsector.toLowerCase().includes(query)
        ) {
          searchResults.push({
            id: company.id,
            type: 'company',
            title: company.company_name,
            subtitle: `${company.gics_subsector} - ${company.ticker_symbol}`,
            icon: <Building2 size={16} />
          });
        }
      });

      // Search subsectors
      searchData.subsectors.forEach(subsector => {
        if (subsector.toLowerCase().includes(query)) {
          const companyCount = searchData.companies.filter(c => c.gics_subsector === subsector).length;
          searchResults.push({
            id: `subsector-${subsector}`,
            type: 'subscription',
            title: subsector,
            subtitle: `${companyCount} companies`,
            icon: <Bell size={16} />
          });
        }
      });

      // Limit results to top 10
      setResults(searchResults.slice(0, 10));
    } catch (error) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        handleSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, handleSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
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
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted-text)',
              cursor: 'pointer',
              padding: '4px',
              marginLeft: '8px'
            }}
          >
            ✕
          </button>
        )}
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

