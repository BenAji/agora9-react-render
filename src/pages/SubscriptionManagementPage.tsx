import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Check, Building2, Target, BarChart3 } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { supabaseService } from '../lib/supabase';
import { UserSubscription, UserWithSubscriptions } from '../types/database';

interface SubscriptionManagementPageProps {
  currentUser: UserWithSubscriptions | null;
}

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

const SubscriptionManagementPage: React.FC<SubscriptionManagementPageProps> = ({ currentUser }) => {
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
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view');
  const [currentSubscriptionsExpanded, setCurrentSubscriptionsExpanded] = useState(false);

  // Load subscription data
  const loadSubscriptionData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      const userSubsResponse = await apiClient.getUserSubscriptions(currentUser.id);
      if (!userSubsResponse.success) {
        throw new Error('Failed to load user subscriptions');
      }
      setSubscriptions(userSubsResponse.data);

      // Get ALL companies (not filtered by subscription) for the subscription management page
      // We need to see all companies to build the complete list of available subsectors
      const { data: allCompanies, error: companiesError } = await supabaseService
        .from('companies')
        .select('id, company_name, ticker_symbol, gics_sector, gics_subsector')
        .eq('is_active', true);

      if (companiesError) {
        console.error('❌ Failed to load companies:', companiesError);
        throw new Error('Failed to load companies');
      }
      const companies = allCompanies || [];

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

  // Load data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadSubscriptionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // Only depend on the ID, ignore loadSubscriptionData

  // Early return if no current user
  if (!currentUser) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        color: 'var(--primary-text)'
      }}>
        Loading user data...
      </div>
    );
  }

  // Handle bulk subscription
  const handleBulkSubscribe = async () => {
    if (selectedSubsectors.size === 0) return;

    try {
      setLoading(true);
      const promises = Array.from(selectedSubsectors).map(subsector => 
        apiClient.createSubscription({
          user_id: currentUser.id,
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

  // Filter sectors based on search and filters - SEPARATE LOGIC FOR EACH TAB
  const getFilteredSectorsForTab = (tabType: 'view' | 'add') => {
    return sectors.filter(sector => {
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

      // Tab-specific filtering
      let hasRelevantSubsectors = false;
      if (tabType === 'view') {
        // View tab: only show sectors with subscribed subsectors
        hasRelevantSubsectors = sector.subsectors.some(sub => sub.isSubscribed);
      } else {
        // Add tab: only show sectors with unsubscribed subsectors
        hasRelevantSubsectors = sector.subsectors.some(sub => !sub.isSubscribed);
      }

      return matchesSearch && matchesSectorFilter && hasRelevantSubsectors;
    }).map(sector => ({
      ...sector,
      subsectors: sector.subsectors.filter(sub => {
        // Tab-specific subsector filtering
        if (tabType === 'view') {
          return sub.isSubscribed;
        } else {
          return !sub.isSubscribed;
        }
      })
    })).filter(sector => sector.subsectors.length > 0); // Remove sectors with no relevant subsectors
  };

  // Use different filtered data for each tab
  const filteredSectors = getFilteredSectorsForTab(activeTab);

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
          }}>Manage Subscriptions</h1>
          <p style={{ 
            color: 'var(--muted-text)', 
            fontSize: '1.125rem',
            marginBottom: '1rem'
          }}>Subscribe to subsectors to see their companies' events in your calendar</p>
          
          {/* Helpful Instructions */}
          <div style={{
            backgroundColor: 'var(--tertiary-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Target size={16} style={{ color: 'var(--accent-bg)' }} />
              <span style={{ fontWeight: '600', color: 'var(--primary-text)' }}>
                How to manage subscriptions:
              </span>
            </div>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1.5rem', 
              color: 'var(--muted-text)',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              <li>Click <strong style={{ color: 'var(--success-color)' }}>Subscribe</strong> to add a subsector to your calendar</li>
              <li>Click <strong style={{ color: 'var(--error-color)' }}>Unsubscribe</strong> to remove a subsector from your calendar</li>
              <li>Use checkboxes to select multiple subsectors for bulk actions</li>
              <li>Only events from subscribed subsectors will appear in your calendar</li>
            </ul>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '2rem',
          backgroundColor: 'var(--secondary-bg)',
          borderRadius: '8px 8px 0 0'
        }}>
          <button
            onClick={() => setActiveTab('view')}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              borderBottom: activeTab === 'view' ? '2px solid var(--accent-bg)' : '2px solid transparent',
              color: activeTab === 'view' ? 'var(--accent-bg)' : 'var(--muted-text)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '8px 0 0 0'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'view') {
                (e.target as HTMLButtonElement).style.color = 'var(--primary-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'view') {
                (e.target as HTMLButtonElement).style.color = 'var(--muted-text)';
              }
            }}
          >
            View Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('add')}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              borderBottom: activeTab === 'add' ? '2px solid var(--accent-bg)' : '2px solid transparent',
              color: activeTab === 'add' ? 'var(--accent-bg)' : 'var(--muted-text)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '0 8px 0 0'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'add') {
                (e.target as HTMLButtonElement).style.color = 'var(--primary-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'add') {
                (e.target as HTMLButtonElement).style.color = 'var(--muted-text)';
              }
            }}
          >
            Add Subscriptions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'view' ? (
          <div>
            {/* View Subscriptions Tab Content */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--primary-text)',
                marginBottom: '1rem'
              }}>Current Subscriptions</h2>
              <p style={{
                color: 'var(--muted-text)',
                marginBottom: '1.5rem'
              }}>Manage your active subscriptions and view detailed information</p>
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
                                  {/* Individual Subscribe/Unsubscribe Button */}
                                  <button
                                    onClick={async () => {
                                      try {
                                        setLoading(true);
                                        if (subsector.isSubscribed) {
                                          // Unsubscribe
                                          const subscription = subscriptions.find(sub => sub.subsector === subsector.name);
                                          if (subscription) {
                                            await apiClient.deleteSubscription(subscription.id);
                                          }
                                        } else {
                                          // Subscribe
                                          await apiClient.createSubscription({
                                            user_id: currentUser.id,
                                            gics_subsector: subsector.name
                                          } as any);
                                        }
                                        await loadSubscriptionData();
                                      } catch (error) {
                                        console.error('Failed to toggle subscription:', error);
                                        setError(`Failed to ${subsector.isSubscribed ? 'unsubscribe from' : 'subscribe to'} ${subsector.name}`);
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    disabled={loading}
                                    style={{
                                      padding: '0.375rem 0.75rem',
                                      backgroundColor: subsector.isSubscribed ? '#dc3545' : '#28a745',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      cursor: loading ? 'not-allowed' : 'pointer',
                                      opacity: loading ? 0.5 : 1,
                                      transition: 'all 0.2s ease',
                                      minWidth: '80px'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!loading) {
                                        (e.target as HTMLButtonElement).style.backgroundColor = subsector.isSubscribed ? '#c82333' : '#218838';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!loading) {
                                        (e.target as HTMLButtonElement).style.backgroundColor = subsector.isSubscribed ? '#dc3545' : '#28a745';
                                      }
                                    }}
                                  >
                                    {subsector.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                                  </button>
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
        ) : (
          <div>
            {/* Add Subscriptions Tab Content */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--primary-text)',
                marginBottom: '1rem'
              }}>Manage Subscriptions</h2>
              <p style={{
                color: 'var(--muted-text)',
                marginBottom: '1.5rem'
              }}>Quick view of current subscriptions and discover new subsectors to add</p>
            </div>

            {/* Current Subscriptions - Collapsible */}
            {subscriptions.length > 0 && (
              <div style={{
                marginBottom: '2rem',
                backgroundColor: 'var(--secondary-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}>
                {/* Collapsible Header */}
                <div 
                  onClick={() => setCurrentSubscriptionsExpanded(!currentSubscriptionsExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    backgroundColor: 'var(--tertiary-bg)',
                    borderBottom: currentSubscriptionsExpanded ? '1px solid var(--border-color)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLDivElement).style.backgroundColor = 'var(--quaternary-bg)'}
                  onMouseLeave={(e) => (e.target as HTMLDivElement).style.backgroundColor = 'var(--tertiary-bg)'}
                >
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--primary-text)',
                    margin: 0
                  }}>Current Subscriptions ({subscriptions.filter(sub => sub.is_active && sub.payment_status === 'paid').length})</h3>
                  <ChevronDown 
                    size={20} 
                    style={{ 
                      color: 'var(--muted-text)',
                      transform: currentSubscriptionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </div>
                
                {/* Collapsible Content */}
                {currentSubscriptionsExpanded && (
                  <div style={{
                    padding: '1rem 1.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {subscriptions.filter(sub => sub.is_active && sub.payment_status === 'paid').map((subscription) => {
                        // Get company details for this subsector
                        const subsectorCompanies = sectors
                          .flatMap(sector => sector.subsectors)
                          .find(sub => sub.name === subscription.subsector)?.companies || [];
                        
                        return (
                          <div
                            key={subscription.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem 1rem',
                              backgroundColor: 'var(--quaternary-bg)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <Check size={16} style={{ color: '#28a745' }} />
                              <div>
                                <div style={{
                                  fontWeight: '500',
                                  color: 'var(--primary-text)',
                                  fontSize: '0.875rem',
                                  marginBottom: '0.25rem'
                                }}>
                                  {subscription.subsector}
                                </div>
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--muted-text)'
                                }}>
                                  {subsectorCompanies.length} companies • {subsectorCompanies.map(c => c.ticker_symbol).join(', ')}
                                </div>
                              </div>
                            </div>
                            <div style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.7rem',
                              borderRadius: '12px',
                              backgroundColor: 'rgba(40, 167, 69, 0.1)',
                              color: '#28a745',
                              fontWeight: '500'
                            }}>
                              Active
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: 'var(--border-color)'
              }}></div>
              <span style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: 'var(--muted-text)',
                padding: '0 1rem'
              }}>Available Subscriptions</span>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: 'var(--border-color)'
              }}></div>
            </div>

            {/* Search and Filters */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: 'var(--secondary-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
                  <Search size={20} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted-text)'
                  }} />
                  <input
                    type="text"
                    placeholder="Search subsectors, companies, or sectors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary-bg)',
                      color: 'var(--primary-text)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary-bg)',
                    color: 'var(--primary-text)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">All Sectors</option>
                  {Array.from(new Set(sectors.map(s => s.name))).map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--muted-text)'
              }}>
                {(() => {
                  const unsubscribedSubsectors = sectors.flatMap(sector => 
                    sector.subsectors.filter(sub => !sub.isSubscribed)
                  ).filter(subsector => {
                    const matchesSearch = searchQuery === '' || 
                      subsector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      subsector.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      subsector.companies.some(company => 
                        company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        company.ticker_symbol.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                    
                    const matchesSectorFilter = selectedSector === 'all' || subsector.sector === selectedSector;
                    
                    return matchesSearch && matchesSectorFilter;
                  });
                  
                  return `Showing ${unsubscribedSubsectors.length} available subsectors`;
                })()
              }
              </div>
            </div>

            {/* Available Subsectors - Flat List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                const unsubscribedSubsectors = sectors.flatMap(sector => 
                  sector.subsectors.filter(sub => !sub.isSubscribed)
                ).filter(subsector => {
                  const matchesSearch = searchQuery === '' || 
                    subsector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    subsector.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    subsector.companies.some(company => 
                      company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      company.ticker_symbol.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                  
                  const matchesSectorFilter = selectedSector === 'all' || subsector.sector === selectedSector;
                  
                  return matchesSearch && matchesSectorFilter;
                });

                if (unsubscribedSubsectors.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem 2rem',
                      backgroundColor: 'var(--secondary-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{
                        fontSize: '3rem',
                        marginBottom: '1rem'
                      }}>🎉</div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: 'var(--primary-text)',
                        marginBottom: '0.5rem'
                      }}>You're subscribed to all available subsectors!</h3>
                      <p style={{
                        color: 'var(--muted-text)',
                        margin: 0
                      }}>Great job! You have access to events from all companies in our database.</p>
                    </div>
                  );
                }

                return unsubscribedSubsectors.map(subsector => {
                  const pricingOptions = [25, 30, 35, 40, 45, 50, 55, 60];
                  const randomPrice = pricingOptions[Math.floor(Math.random() * pricingOptions.length)];
                  
                  return (
                    <div
                      key={subsector.name}
                      style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--secondary-bg)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLDivElement).style.borderColor = 'var(--accent-bg)';
                        (e.target as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(218, 165, 32, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLDivElement).style.borderColor = 'var(--border-color)';
                        (e.target as HTMLDivElement).style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.75rem'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--accent-bg)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '1.25rem',
                              fontWeight: 'bold'
                            }}>
                              {subsector.name.charAt(0)}
                            </div>
                            <div>
                              <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: 'var(--primary-text)',
                                margin: 0,
                                marginBottom: '0.25rem'
                              }}>{subsector.name}</h3>
                              <div style={{
                                fontSize: '0.875rem',
                                color: 'var(--muted-text)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <span>{subsector.sector}</span>
                                <span>•</span>
                                <span>{subsector.companyCount} companies</span>
                                <span>•</span>
                                <span style={{ color: 'var(--accent-bg)', fontWeight: '500' }}>${randomPrice}/month</span>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.75rem'
                          }}>
                            <span style={{
                              fontSize: '0.875rem',
                              color: 'var(--muted-text)',
                              fontWeight: '500'
                            }}>Companies:</span>
                            <div style={{
                              fontSize: '0.875rem',
                              color: 'var(--primary-text)',
                              fontFamily: 'monospace'
                            }}>
                              {subsector.companies.map(company => company.ticker_symbol).join(', ')}
                            </div>
                          </div>

                          <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--muted-text)',
                            lineHeight: '1.4'
                          }}>
                            Get access to earnings calls, investor meetings, and other corporate events from 
                            {subsector.companyCount === 1 ? ' this company' : ` these ${subsector.companyCount} companies`} 
                            in the {subsector.name} subsector.
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.75rem',
                          minWidth: '120px'
                        }}>
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                setError(null);
                                await apiClient.createSubscription({
                                  user_id: currentUser.id,
                                  gics_subsector: subsector.name
                                } as any);
                                await loadSubscriptionData();
                                
                                // Show success message
                                setError(null);
                              } catch (error) {
                                console.error('Failed to subscribe:', error);
                                setError('Failed to subscribe to ' + subsector.name);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              backgroundColor: 'var(--accent-bg)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              cursor: loading ? 'not-allowed' : 'pointer',
                              opacity: loading ? 0.5 : 1,
                              transition: 'all 0.2s ease',
                              textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                              if (!loading) {
                                (e.target as HTMLButtonElement).style.backgroundColor = '#d4af37';
                                (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading) {
                                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-bg)';
                                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            {loading ? 'Subscribing...' : 'Subscribe'}
                          </button>
                          
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted-text)',
                            textAlign: 'center'
                          }}>
                            30-day free trial
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()
            }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;
