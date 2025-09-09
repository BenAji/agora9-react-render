import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Check, Building2, Target, BarChart3 } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { UserSubscription } from '../types/database';

// Current user ID (analyst1)
const CURRENT_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

interface Company {
  id: string;
  ticker_symbol: string;
  company_name: string;
  gics_sector: string;
  gics_subsector: string;
}

interface SubsectorData {
  name: string;
  sector: string;
  companyCount: number;
  companies: Company[];
  isSubscribed: boolean;
  subscriptionId?: string;
}

interface SectorData {
  name: string;
  subsectors: SubsectorData[];
  totalCompanies: number;
  subscribedSubsectors: number;
  isExpanded: boolean;
}

interface SubscriptionStats {
  totalCompanies: number;
  subscribedCompanies: number;
  totalSectors: number;
  subscribedSectors: number;
  totalSubsectors: number;
  subscribedSubsectors: number;
}

const SubscriptionManagementPage: React.FC = () => {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedSubsector, setSelectedSubsector] = useState<string>('all');
  const [selectedSubsectors, setSelectedSubsectors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalCompanies: 0,
    subscribedCompanies: 0,
    totalSectors: 0,
    subscribedSectors: 0,
    totalSubsectors: 0,
    subscribedSubsectors: 0
  });

  // Load subscription data
  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user subscriptions
      const userSubsResponse = await apiClient.getUserSubscriptions(CURRENT_USER_ID);
      if (!userSubsResponse.success) {
        throw new Error('Failed to load user subscriptions');
      }
      setSubscriptions(userSubsResponse.data);

      // Get all companies
      const companiesResponse = await apiClient.getCompanies();
      if (!companiesResponse.success) {
        throw new Error('Failed to load companies');
      }
      const companies = companiesResponse.data.companies || [];

      // Group companies by sector and subsector
      const sectorMap: { [key: string]: { [key: string]: Company[] } } = {};
      companies.forEach(company => {
        if (!sectorMap[company.gics_sector]) {
          sectorMap[company.gics_sector] = {};
        }
        if (!sectorMap[company.gics_sector][company.gics_subsector]) {
          sectorMap[company.gics_sector][company.gics_subsector] = [];
        }
        sectorMap[company.gics_sector][company.gics_subsector].push(company);
      });

      // Build sector data
      const sectorData: SectorData[] = Object.keys(sectorMap).map(sectorName => {
        const subsectorData: SubsectorData[] = Object.keys(sectorMap[sectorName]).map(subsectorName => {
          const companies = sectorMap[sectorName][subsectorName];
          const subscription = userSubsResponse.data.find(sub => sub.subsector === subsectorName);
          
          return {
            name: subsectorName,
            sector: sectorName,
            companyCount: companies.length,
            companies,
            isSubscribed: !!subscription && subscription.is_active && subscription.payment_status === 'paid',
            subscriptionId: subscription?.id
          };
        });

        const subscribedSubsectors = subsectorData.filter(sub => sub.isSubscribed).length;
        const totalCompanies = subsectorData.reduce((sum, sub) => sum + sub.companyCount, 0);

        return {
          name: sectorName,
          subsectors: subsectorData,
          totalCompanies,
          subscribedSubsectors,
          isExpanded: false
        };
      });

      setSectors(sectorData);

      // Calculate statistics
      const totalCompanies = companies.length;
      const subscribedCompanies = companies.filter(company => 
        userSubsResponse.data.some(sub => 
          sub.subsector === company.gics_subsector && 
          sub.is_active && 
          sub.payment_status === 'paid'
        )
      ).length;

      const totalSectors = sectorData.length;
      const subscribedSectors = sectorData.filter(sector => sector.subscribedSubsectors > 0).length;
      const totalSubsectors = sectorData.reduce((sum, sector) => sum + sector.subsectors.length, 0);
      const subscribedSubsectors = sectorData.reduce((sum, sector) => sum + sector.subscribedSubsectors, 0);

      setStats({
        totalCompanies,
        subscribedCompanies,
        totalSectors,
        subscribedSectors,
        totalSubsectors,
        subscribedSubsectors
      });

    } catch (error) {
      console.error('Failed to load subscription data:', error);
      setError('Failed to load subscription data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  // Handle bulk subscription
  const handleBulkSubscribe = async () => {
    if (selectedSubsectors.size === 0) return;

    try {
      setLoading(true);
      const promises = Array.from(selectedSubsectors).map(subsector => 
        apiClient.createSubscription({
          user_id: CURRENT_USER_ID,
          gics_subsector: subsector
        } as any)
      );

      await Promise.all(promises);
      setSelectedSubsectors(new Set());
      await loadSubscriptionData();
    } catch (error) {
      console.error('Failed to bulk subscribe:', error);
      setError('Failed to subscribe to selected subsectors');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk unsubscribe
  const handleBulkUnsubscribe = async () => {
    if (selectedSubsectors.size === 0) return;

    try {
      setLoading(true);
      const promises = Array.from(selectedSubsectors).map(subsector => {
        const subscription = subscriptions.find(sub => sub.subsector === subsector);
        return subscription ? apiClient.deleteSubscription(subscription.id) : Promise.resolve();
      });

      await Promise.all(promises);
      setSelectedSubsectors(new Set());
      await loadSubscriptionData();
    } catch (error) {
      console.error('Failed to bulk unsubscribe:', error);
      setError('Failed to unsubscribe from selected subsectors');
    } finally {
      setLoading(false);
    }
  };

  // Toggle subsector selection
  const toggleSubsectorSelection = (subsector: string) => {
    const newSelection = new Set(selectedSubsectors);
    if (newSelection.has(subsector)) {
      newSelection.delete(subsector);
    } else {
      newSelection.add(subsector);
    }
    setSelectedSubsectors(newSelection);
  };

  // Toggle sector expansion
  const toggleSectorExpansion = (sectorName: string) => {
    setSectors(prev => prev.map(sector => 
      sector.name === sectorName 
        ? { ...sector, isExpanded: !sector.isExpanded }
        : sector
    ));
  };

  // Filter sectors based on search and filters
  const filteredSectors = sectors.filter(sector => {
    const matchesSearch = searchQuery === '' || 
      sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sector.subsectors.some(sub => 
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.companies.some(company => 
          company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.ticker_symbol.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

    const matchesSectorFilter = selectedSector === 'all' || sector.name === selectedSector;
    
    return matchesSearch && matchesSectorFilter;
  });

  // Get available subsectors for filter dropdown
  const availableSubsectors = Array.from(new Set(
    sectors.flatMap(sector => sector.subsectors.map(sub => sub.name))
  )).sort();

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--primary-bg)', 
        color: 'var(--primary-text)', 
        padding: '2rem' 
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '16rem' 
          }}>
            <div style={{ 
              animation: 'spin 1s linear infinite',
              borderRadius: '50%',
              height: '3rem',
              width: '3rem',
              borderBottom: '2px solid var(--accent-bg)'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--primary-bg)', 
      color: 'var(--primary-text)' 
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.25rem', 
            fontWeight: 'bold', 
            color: 'var(--primary-text)', 
            marginBottom: '0.5rem' 
          }}>GICS Companies</h1>
          <p style={{ 
            color: 'var(--muted-text)', 
            fontSize: '1.125rem' 
          }}>Browse and subscribe to companies by sector and ticker symbol</p>
        </div>

        {/* Summary Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '2rem' 
        }}>
          <div className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginBottom: '0.5rem' 
            }}>
              <Building2 style={{ width: '1.5rem', height: '1.5rem', color: 'var(--accent-bg)' }} />
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--primary-text)' 
              }}>{stats.totalCompanies}</span>
            </div>
            <p style={{ color: 'var(--muted-text)' }}>Total Companies</p>
          </div>
          
          <div className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginBottom: '0.5rem' 
            }}>
              <Check style={{ width: '1.5rem', height: '1.5rem', color: '#28a745' }} />
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--primary-text)' 
              }}>{stats.subscribedCompanies}</span>
            </div>
            <p style={{ color: 'var(--muted-text)' }}>Subscribed</p>
          </div>
          
          <div className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginBottom: '0.5rem' 
            }}>
              <Target style={{ width: '1.5rem', height: '1.5rem', color: '#007bff' }} />
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--primary-text)' 
              }}>{stats.subscribedSectors}/{stats.totalSectors}</span>
            </div>
            <p style={{ color: 'var(--muted-text)' }}>Sectors</p>
          </div>
          
          <div className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginBottom: '0.5rem' 
            }}>
              <BarChart3 style={{ width: '1.5rem', height: '1.5rem', color: '#6f42c1' }} />
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--primary-text)' 
              }}>{stats.subscribedSubsectors}/{stats.totalSubsectors}</span>
            </div>
            <p style={{ color: 'var(--muted-text)' }}>Subsectors</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem' 
          }}>
            {/* Search Bar */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--faded-text)', 
                width: '1.25rem', 
                height: '1.25rem' 
              }} />
              <input
                type="text"
                placeholder="Search companies, tickers, or sectors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ 
                  width: '100%', 
                  paddingLeft: '2.5rem', 
                  paddingRight: '1rem', 
                  paddingTop: '0.75rem', 
                  paddingBottom: '0.75rem' 
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="form-select"
                style={{ 
                  padding: '0.75rem 1rem', 
                  minWidth: '150px' 
                }}
              >
                <option value="all">All Sectors</option>
                {sectors.map(sector => (
                  <option key={sector.name} value={sector.name}>{sector.name}</option>
                ))}
              </select>

              <select
                value={selectedSubsector}
                onChange={(e) => setSelectedSubsector(e.target.value)}
                className="form-select"
                style={{ 
                  padding: '0.75rem 1rem', 
                  minWidth: '150px' 
                }}
              >
                <option value="all">All Subsectors</option>
                {availableSubsectors.map(subsector => (
                  <option key={subsector} value={subsector}>{subsector}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div style={{ 
            marginTop: '1rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            fontSize: '0.875rem', 
            color: 'var(--muted-text)' 
          }}>
            <span>Showing {filteredSectors.reduce((sum, sector) => sum + sector.subsectors.length, 0)} subsectors</span>
            <span>{stats.subscribedSubsectors} subscribed • {stats.totalSubsectors - stats.subscribedSubsectors} available</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            backgroundColor: 'rgba(220, 53, 69, 0.1)', 
            border: '1px solid #dc3545', 
            color: '#f8d7da', 
            padding: '0.75rem 1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem' 
          }}>
            {error}
          </div>
        )}

        {/* Sector Subscriptions */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  backgroundColor: 'var(--accent-bg)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Target style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary-bg)' }} />
                </div>
                <div>
                  <h2 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: 'var(--primary-text)' 
                  }}>Sector Subscriptions</h2>
                  <p style={{ color: 'var(--muted-text)' }}>Manage your sector and subsector subscriptions</p>
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                fontSize: '0.875rem' 
              }}>
                <span style={{ color: 'var(--muted-text)' }}>{stats.totalSectors} Total Sectors</span>
                <span style={{ color: '#28a745' }}>{stats.subscribedSectors} Subscribed</span>
                <span style={{ color: '#007bff' }}>{stats.totalSubsectors} Sub-sectors</span>
              </div>
            </div>
          </div>

          <div className="card-body">
            {filteredSectors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <Building2 style={{ 
                  width: '4rem', 
                  height: '4rem', 
                  color: 'var(--faded-text)', 
                  margin: '0 auto 1rem auto' 
                }} />
                <p style={{ 
                  color: 'var(--muted-text)', 
                  fontSize: '1.125rem' 
                }}>No sectors found matching your criteria</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredSectors.map(sector => (
                  <div key={sector.name} style={{ 
                    backgroundColor: 'var(--tertiary-bg)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)' 
                  }}>
                    {/* Sector Header */}
                    <div 
                      style={{ 
                        padding: '1rem', 
                        cursor: 'pointer', 
                        transition: 'background-color 0.2s ease' 
                      }}
                      onClick={() => toggleSectorExpansion(sector.name)}
                      onMouseEnter={(e) => (e.target as HTMLDivElement).style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => (e.target as HTMLDivElement).style.backgroundColor = 'var(--tertiary-bg)'}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '2rem', 
                            height: '2rem', 
                            backgroundColor: 'var(--accent-bg)', 
                            borderRadius: '4px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Building2 style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary-bg)' }} />
                          </div>
                          <div>
                            <h3 style={{ 
                              fontSize: '1.125rem', 
                              fontWeight: '600', 
                              color: 'var(--primary-text)' 
                            }}>{sector.name}</h3>
                            <p style={{ 
                              color: 'var(--muted-text)', 
                              fontSize: '0.875rem' 
                            }}>
                              {sector.subsectors.length} subsectors • {sector.totalCompanies} companies
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {sector.subscribedSubsectors > 0 && (
                            <span style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.25rem', 
                              color: '#28a745', 
                              fontSize: '0.875rem' 
                            }}>
                              <Check style={{ width: '1rem', height: '1rem' }} />
                              {sector.subscribedSubsectors} subscribed
                            </span>
                          )}
                          {sector.isExpanded ? (
                            <ChevronUp style={{ width: '1.25rem', height: '1.25rem', color: 'var(--muted-text)' }} />
                          ) : (
                            <ChevronDown style={{ width: '1.25rem', height: '1.25rem', color: 'var(--muted-text)' }} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subsectors */}
                    {sector.isExpanded && (
                      <div style={{ 
                        borderTop: '1px solid var(--border-color)', 
                        padding: '1rem' 
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {sector.subsectors.map(subsector => (
                            <div 
                              key={subsector.name}
                              style={{ 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                border: '1px solid', 
                                transition: 'all 0.2s ease',
                                backgroundColor: subsector.isSubscribed 
                                  ? 'rgba(40, 167, 69, 0.1)' 
                                  : 'var(--quaternary-bg)',
                                borderColor: subsector.isSubscribed 
                                  ? '#28a745' 
                                  : 'var(--border-light)'
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between' 
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedSubsectors.has(subsector.name)}
                                    onChange={() => toggleSubsectorSelection(subsector.name)}
                                    style={{ 
                                      width: '1.25rem', 
                                      height: '1.25rem', 
                                      accentColor: 'var(--accent-bg)',
                                      backgroundColor: 'var(--tertiary-bg)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '4px'
                                    }}
                                  />
                                  <div>
                                    <h4 style={{ 
                                      color: 'var(--primary-text)', 
                                      fontWeight: '500' 
                                    }}>{subsector.name}</h4>
                                    <p style={{ 
                                      color: 'var(--muted-text)', 
                                      fontSize: '0.875rem' 
                                    }}>
                                      {subsector.companyCount} companies
                                    </p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  {subsector.isSubscribed && (
                                    <span style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '0.25rem', 
                                      color: '#28a745', 
                                      fontSize: '0.875rem' 
                                    }}>
                                      <Check style={{ width: '1rem', height: '1rem' }} />
                                      Subscribed
                                    </span>
                                  )}
                                  <div style={{ 
                                    color: 'var(--muted-text)', 
                                    fontSize: '0.875rem' 
                                  }}>
                                    {subsector.companies.map(company => company.ticker_symbol).join(', ')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSubsectors.size > 0 && (
          <div style={{ 
            position: 'fixed', 
            bottom: '1.5rem', 
            right: '1.5rem', 
            backgroundColor: 'var(--secondary-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            padding: '1rem', 
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ 
                color: 'var(--primary-text)', 
                fontWeight: '500' 
              }}>
                {selectedSubsectors.size} subsector{selectedSubsectors.size > 1 ? 's' : ''} selected
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleBulkSubscribe}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ 
                    backgroundColor: '#28a745', 
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#218838' }}
                  onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#28a745' }}
                >
                  Subscribe
                </button>
                <button
                  onClick={handleBulkUnsubscribe}
                  disabled={loading}
                  style={{ 
                    backgroundColor: '#dc3545', 
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#c82333' }}
                  onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545' }}
                >
                  Unsubscribe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;
