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
    { id: 'need_response', label: 'Need response', count: eventCounts.need_response, color: '#FFD700', activeColor: '#B8860B' },
    { id: 'responded', label: 'Responded', count: eventCounts.responded, color: '#FFD700', activeColor: '#B8860B' },
    { id: 'all_events', label: 'All events', count: eventCounts.all_events, color: '#FFD700', activeColor: '#B8860B' }
  ];

  const subsectorOptions = [
    { id: 'all', label: 'All subsectors', color: '#FFD700', activeColor: '#B8860B' },
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
      borderBottom: '1px solid #323130',
      boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem 2rem'
      }}>
        {/* Search Bar and Filter Button - Single Line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          marginBottom: '1rem'
        }}>
        <div style={{
          position: 'relative',
          flex: 1
        }}>
          <Search 
            size={16} 
            style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#888888'
            }}
          />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem 0.625rem 2.5rem',
              backgroundColor: '#000000',
              border: '1px solid #323130',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#888888';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#323130';
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <span style={{ fontSize: '12px', color: '#888888', fontWeight: '400' }}>
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '1px solid #323130',
              borderRadius: '6px',
              padding: '0.625rem 0.875rem',
              fontSize: '13px',
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
            backgroundColor: showFilters ? '#2A2A2A' : 'transparent',
            color: '#FFFFFF',
            border: '1px solid #323130',
            borderRadius: '6px',
            padding: '0.625rem 0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '13px',
            fontWeight: '400'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2A2A2A';
            e.currentTarget.style.borderColor = '#555555';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = showFilters ? '#2A2A2A' : 'transparent';
            e.currentTarget.style.borderColor = '#323130';
          }}
        >
          <Filter size={14} />
          <span>Filter</span>
        </button>
        </div>

        {/* Response Status Filters - Outlook Style Text Tabs */}
        <div style={{
          display: 'flex',
          gap: '0',
          marginBottom: showFilters ? '1rem' : '0',
          borderBottom: '1px solid #323130'
        }}>
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id as any)}
              style={{
                backgroundColor: 'transparent',
                color: filterBy === option.id ? '#FFFFFF' : '#888888',
                border: 'none',
                borderBottom: filterBy === option.id ? '2px solid #FFFFFF' : '2px solid transparent',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '13px',
                fontWeight: filterBy === option.id ? '600' : '400',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '-1px'
              }}
              onMouseEnter={(e) => {
                if (filterBy !== option.id) {
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderBottomColor = '#555555';
                }
              }}
              onMouseLeave={(e) => {
                if (filterBy !== option.id) {
                  e.currentTarget.style.color = '#888888';
                  e.currentTarget.style.borderBottomColor = 'transparent';
                }
              }}
            >
              <span>{option.label}</span>
              <span style={{
                color: filterBy === option.id ? '#888888' : '#666666',
                fontSize: '12px',
                fontWeight: '400'
              }}>
                ({option.count})
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
    </div>
  );
};

export default EventsPageHeader;
