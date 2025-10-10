import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';

interface EventsPageHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterBy: 'upcoming' | 'need_response' | 'responded' | 'all_events';
  onFilterChange: (filter: 'upcoming' | 'need_response' | 'responded' | 'all_events') => void;
  subsectorFilter: string;
  onSubsectorFilterChange: (subsector: string) => void;
  sortBy: 'date' | 'subsector' | 'company' | 'status';
  onSortChange: (sort: 'date' | 'subsector' | 'company' | 'status') => void;
  eventCounts: {
    upcoming: number;
    need_response: number;
    responded: number;
    all_events: number;
  };
  availableSubsectors: string[];
}

const EventsPageHeader: React.FC<EventsPageHeaderProps> = ({
  searchQuery,
  onSearchChange,
  filterBy,
  onFilterChange,
  subsectorFilter,
  onSubsectorFilterChange,
  sortBy,
  onSortChange,
  eventCounts,
  availableSubsectors
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const filterOptions = [
    { id: 'upcoming', label: 'Upcoming', count: eventCounts.upcoming, color: '#FFD700', activeColor: '#B8860B' },
    { id: 'need_response', label: 'Need Response', count: eventCounts.need_response, color: '#FFD700', activeColor: '#B8860B' },
    { id: 'responded', label: 'Responded', count: eventCounts.responded, color: '#FFD700', activeColor: '#B8860B' },
    { id: 'all_events', label: 'All Events', count: eventCounts.all_events, color: '#FFD700', activeColor: '#B8860B' }
  ];

  const subsectorOptions = [
    { id: 'all', label: 'All Subsectors', color: '#FFD700', activeColor: '#B8860B' },
    ...availableSubsectors.map(subsector => ({
      id: subsector,
      label: subsector,
      color: getSubsectorColor(subsector),
      activeColor: '#B8860B'
    }))
  ];

  function getSubsectorColor(subsector: string): string {
    const colorMap: { [key: string]: string } = {
      'Technology': '#FFD700',
      'Healthcare': '#FFD700',
      'Finance': '#FFD700',
      'Consumer': '#FFD700',
      'Industrial': '#FFD700'
    };
    return colorMap[subsector] || '#FFD700';
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      backgroundColor: '#1A1A1A',
      borderBottom: '2px solid #FFD700',
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
    }}>
      {/* Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '1rem'
      }}>
        <div style={{
          position: 'relative',
          flex: 1
        }}>
          <Search 
            size={20} 
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FFFFFF'
            }}
          />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              backgroundColor: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#FFD700';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#333333';
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: '500' }}>
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '1px solid #333333',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="date">Date</option>
            <option value="subsector">Subsector</option>
            <option value="company">Company</option>
            <option value="status">Status</option>
          </select>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            backgroundColor: showFilters ? '#B8860B' : '#333333',
            color: showFilters ? '#000000' : '#FFFFFF',
            border: '1px solid #FFD700',
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Filter size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Filter</span>
        </button>
      </div>

      {/* Response Status Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: showFilters ? '1rem' : '0',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {filterOptions.map(option => (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id as any)}
            style={{
              backgroundColor: filterBy === option.id ? option.activeColor : '#333333',
              color: filterBy === option.id ? '#000000' : '#FFFFFF',
              border: `1px solid ${filterBy === option.id ? option.activeColor : '#555555'}`,
              borderRadius: '20px',
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.8rem',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: 'fit-content'
            }}
            onMouseEnter={(e) => {
              if (filterBy !== option.id) {
                e.currentTarget.style.backgroundColor = '#555555';
              }
            }}
            onMouseLeave={(e) => {
              if (filterBy !== option.id) {
                e.currentTarget.style.backgroundColor = '#333333';
              }
            }}
          >
            <span>{option.label}</span>
            <span style={{
              backgroundColor: filterBy === option.id ? 'rgba(0,0,0,0.2)' : '#555555',
              color: filterBy === option.id ? '#000000' : '#FFFFFF',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '0.7rem',
              fontWeight: '600'
            }}>
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#1A1A1A',
          borderRadius: '8px',
          border: '1px solid #333333'
        }}>
          {/* Subsector Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#FFFFFF',
              marginBottom: '0.5rem'
            }}>
              Subsector
            </label>
            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              {subsectorOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => onSubsectorFilterChange(option.id)}
                  style={{
                    backgroundColor: subsectorFilter === option.id ? option.activeColor : '#333333',
                    color: subsectorFilter === option.id ? '#000000' : '#FFFFFF',
                    border: `1px solid ${subsectorFilter === option.id ? option.activeColor : '#555555'}`,
                    borderRadius: '16px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (subsectorFilter !== option.id) {
                      e.currentTarget.style.backgroundColor = '#555555';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (subsectorFilter !== option.id) {
                      e.currentTarget.style.backgroundColor = '#333333';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPageHeader;
