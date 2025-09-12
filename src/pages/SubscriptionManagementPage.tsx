import React, { useState, useEffect } from 'react';
import { Search, Check, Building2, BarChart3, Calendar } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { apiClient } from '../utils/apiClient';
import { UserSubscription, UserWithSubscriptions } from '../types/database';

interface SubscriptionManagementPageProps {
  currentUser: UserWithSubscriptions | null;
  onSubscriptionChange?: () => void;
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
  subscriptionDetails?: {
    expires_at: string;
    created_at: string;
    payment_status: string;
  };
}

interface SubscriptionStats {
  totalCompanies: number;
  subscribedCompanies: number;
  totalSectors: number;
  subscribedSectors: number;
  totalSubsectors: number;
  subscribedSubsectors: number;
}

const SubscriptionManagementPage: React.FC<SubscriptionManagementPageProps> = ({ currentUser, onSubscriptionChange }) => {
  
  // Helper function to format expiration date
  const formatExpirationDate = (expiresAt: string) => {
    // Handle null, undefined, or empty string
    if (!expiresAt || expiresAt.trim() === '') {
      return { text: 'No expiration date', color: 'var(--warning-color)', days: 0 };
    }
    
    try {
      const expirationDate = parseISO(expiresAt);
      
      // Check if the parsed date is valid
      if (isNaN(expirationDate.getTime())) {
        return { text: 'Invalid date', color: 'var(--error-color)', days: 0 };
      }
      
      const now = new Date();
      const daysUntilExpiry = differenceInDays(expirationDate, now);
      
      // Note: Only active subscriptions exist in database since expired ones are deleted
      if (daysUntilExpiry < 0) {
        return { text: 'Expired', color: 'var(--error-color)', days: 0 };
      } else if (daysUntilExpiry === 0) {
        return { text: 'Expires today', color: 'var(--warning-color)', days: 0 };
      } else if (daysUntilExpiry <= 7) {
        return { text: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`, color: 'var(--warning-color)', days: daysUntilExpiry };
      } else {
        return { text: `Expires ${format(expirationDate, 'MMM dd, yyyy')}`, color: 'var(--muted-text)', days: daysUntilExpiry };
      }
    } catch (error) {
      return { text: 'Invalid date', color: 'var(--error-color)', days: 0 };
    }
  };

  const [subsectors, setSubsectors] = useState<SubsectorData[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
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

  // Load subscription data
  const loadSubscriptionData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);

      // Get all companies and user subscriptions in parallel
      const [companiesResponse, userSubsResponse, allSubsectorsResponse] = await Promise.all([
        apiClient.getAllCompanies(),
        apiClient.getUserSubscriptions(currentUser.id),
        apiClient.getAllSubsectors()
      ]);

      if (!companiesResponse.success || !userSubsResponse.success || !allSubsectorsResponse.success) {
        throw new Error('Failed to load subscription data');
      }

      const companies = companiesResponse.data;
      const userSubscriptions = userSubsResponse.data;
      const allSubsectors = allSubsectorsResponse.data;



      // Group companies by subsector and create subsector data
      const subsectorMap = new Map<string, SubsectorData>();

      // Initialize all subsectors from the API
      allSubsectors.forEach(subsectorName => {
        const subsectorCompanies = companies.filter(company => 
          company.gics_subsector === subsectorName
        );

        const userSub = userSubscriptions.find(sub => sub.subsector === subsectorName);

        // Get sector from the first company in this subsector
        const sectorName = subsectorCompanies.length > 0 ? subsectorCompanies[0].gics_sector : 'Unknown';

        // Check if user has an active subscription to this subsector
        const isSubscribed = !!userSub && userSub.is_active;
        
        // Note: Expired subscriptions are automatically deleted from database
        // so they will automatically appear in "Add Subscriptions" tab for reactivation


        subsectorMap.set(subsectorName, {
          name: subsectorName,
          sector: sectorName,
          companyCount: subsectorCompanies.length,
          companies: subsectorCompanies,
          isSubscribed: isSubscribed,
          subscriptionId: userSub?.id,
          subscriptionDetails: userSub ? {
            expires_at: typeof userSub.expires_at === 'string' ? userSub.expires_at : (userSub.expires_at ? userSub.expires_at.toISOString() : ''),
            created_at: typeof userSub.created_at === 'string' ? userSub.created_at : userSub.created_at.toISOString(),
            payment_status: userSub.payment_status
          } : undefined
        });
      });

      const subsectorData = Array.from(subsectorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setSubsectors(subsectorData);
      setSubscriptions(userSubscriptions);

      // Calculate statistics (only count active subscriptions)
      const subscribedSubsectors = subsectorData.filter(sub => sub.isSubscribed);
      const subscribedCompanies = subscribedSubsectors.reduce((sum, sub) => sum + sub.companyCount, 0);
      const sectors = new Set(subsectorData.map(sub => sub.sector));
      const subscribedSectors = new Set(subscribedSubsectors.map(sub => sub.sector));

      setStats({
        totalCompanies: companies.length,
        subscribedCompanies,
        totalSectors: sectors.size,
        subscribedSectors: subscribedSectors.size,
        totalSubsectors: subsectorData.length,
        subscribedSubsectors: subscribedSubsectors.length
      });

    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError('Failed to load subscription data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadSubscriptionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Early return if no user
  if (!currentUser) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: 'var(--muted-text)'
      }}>
        Loading user data...
      </div>
    );
  }

  // Handle subscribe/unsubscribe
  const handleSubscribe = async (subsectorName: string) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const response = await apiClient.createSubscription({
        user_id: currentUser.id,
        subsector: subsectorName
      });

      if (response.success) {
        await loadSubscriptionData();
        onSubscriptionChange?.(); // Notify parent component
      } else {
        setError('Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setError('Failed to subscribe. Please try again.');
      
      // Even if there's an error, refresh data since subscription might have been created
      // This handles cases where API throws error but subscription is actually successful
      try {
        await loadSubscriptionData();
        onSubscriptionChange?.();
      } catch (refreshError) {
        console.error('Error refreshing data after failed subscription:', refreshError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (subscriptionId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.deleteSubscription(subscriptionId);

      if (response.success) {
        await loadSubscriptionData();
        onSubscriptionChange?.(); // Notify parent component
      } else {
        setError('Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setError('Failed to unsubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search and sector
  const getFilteredSubsectors = () => {
    return subsectors.filter(subsector => {
      const matchesSearch = searchQuery === '' || 
        subsector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subsector.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subsector.companies.some(company => 
          company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.ticker_symbol.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesSector = selectedSector === 'all' || subsector.sector === selectedSector;

      // For view tab, only show active subscriptions
      // For add tab, show subsectors that are either:
      // 1. Never subscribed to, OR
      // 2. Previously subscribed but now expired (for reactivation)
      const matchesTab = activeTab === 'view' 
        ? subsector.isSubscribed 
        : !subsector.isSubscribed; // This includes both never-subscribed and expired subscriptions

      return matchesSearch && matchesSector && matchesTab;
    });
  };

  const filteredSubsectors = getFilteredSubsectors();
  const availableSectors = Array.from(new Set(subsectors.map(sub => sub.sector))).sort();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: 'var(--muted-text)'
      }}>
        Loading subscription data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: 'var(--error-color)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={loadSubscriptionData}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--primary-bg)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'var(--primary-bg)', 
      minHeight: '100vh', 
      color: 'var(--primary-text)',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem' 
      }}>
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
            marginBottom: '2rem'
          }}>View and manage your current subscriptions below</p>
        </div>

        {/* Tab Navigation - Bloomberg Style */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setActiveTab('view')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: activeTab === 'view' ? 'var(--primary-bg)' : 'var(--primary-text)',
              backgroundColor: activeTab === 'view' ? 'var(--accent-bg)' : 'var(--tertiary-bg)',
              border: activeTab === 'view' ? '2px solid var(--accent-bg)' : '2px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '6px',
              boxShadow: activeTab === 'view' ? '0 2px 8px rgba(212, 175, 55, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'view') {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                (e.target as HTMLButtonElement).style.borderColor = 'var(--accent-bg)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'view') {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
                (e.target as HTMLButtonElement).style.borderColor = 'var(--border-color)';
              }
            }}
          >
            View Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('add')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: activeTab === 'add' ? 'var(--primary-bg)' : 'var(--primary-text)',
              backgroundColor: activeTab === 'add' ? 'var(--accent-bg)' : 'var(--tertiary-bg)',
              border: activeTab === 'add' ? '2px solid var(--accent-bg)' : '2px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '6px',
              boxShadow: activeTab === 'add' ? '0 2px 8px rgba(212, 175, 55, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'add') {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
                (e.target as HTMLButtonElement).style.borderColor = 'var(--accent-bg)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'add') {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
                (e.target as HTMLButtonElement).style.borderColor = 'var(--border-color)';
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
              
              {/* Statistics Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem', 
                marginBottom: '2rem' 
              }}>
                <div style={{ 
                  backgroundColor: 'var(--tertiary-bg)', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Building2 style={{ color: 'var(--accent-bg)', width: '1.5rem', height: '1.5rem' }} />
                    <span style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: 'var(--primary-text)' 
                    }}>{stats.subscribedCompanies}</span>
                  </div>
                  <p style={{ color: 'var(--muted-text)' }}>Subscribed Companies</p>
                </div>
                
                <div style={{ 
                  backgroundColor: 'var(--tertiary-bg)', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <BarChart3 style={{ color: 'var(--accent-bg)', width: '1.5rem', height: '1.5rem' }} />
                    <span style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: 'var(--primary-text)' 
                    }}>{stats.subscribedSectors}</span>
                  </div>
                  <p style={{ color: 'var(--muted-text)' }}>Sectors</p>
                </div>
                
                <div style={{ 
                  backgroundColor: 'var(--tertiary-bg)', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Check style={{ color: 'var(--accent-bg)', width: '1.5rem', height: '1.5rem' }} />
                    <span style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: 'var(--primary-text)' 
                    }}>{stats.subscribedSubsectors}</span>
                  </div>
                  <p style={{ color: 'var(--muted-text)' }}>Subsectors</p>
                </div>
              </div>
            </div>

            {/* Filters for View Tab */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
                <Search 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--muted-text)' 
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    backgroundColor: 'var(--tertiary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--primary-text)',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--tertiary-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--primary-text)',
                  fontSize: '1rem',
                  minWidth: '150px'
                }}
              >
                <option value="all">All Sectors</option>
                {availableSectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            {/* Subscribed Subsectors List */}
            {filteredSubsectors.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                color: 'var(--muted-text)',
                backgroundColor: 'var(--tertiary-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <p style={{ fontSize: '1.125rem' }}>
                  {subscriptions.length === 0 
                    ? "You don't have any subscriptions yet" 
                    : "No subscriptions match your search criteria"
                  }
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredSubsectors.map(subsector => (
                  <div 
                    key={subsector.name}
                    style={{ 
                      padding: '1.5rem', 
                      borderRadius: '8px', 
                      border: '1px solid var(--status-accepted)', 
                      transition: 'all 0.2s ease',
                      backgroundColor: 'rgba(40, 167, 69, 0.1)'
                    }}
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
                          backgroundColor: 'var(--status-accepted)', 
                          borderRadius: '4px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Check style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4 style={{ 
                              color: 'var(--primary-text)', 
                              fontWeight: '600',
                              fontSize: '1rem',
                              margin: 0
                            }}>{subsector.name}</h4>
                            <span style={{ 
                              color: 'var(--muted-text)', 
                              fontSize: '0.75rem',
                              backgroundColor: 'var(--quaternary-bg)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px'
                            }}>{subsector.sector}</span>
                          </div>
                          <p style={{ 
                            color: 'var(--muted-text)', 
                            fontSize: '0.875rem',
                            margin: 0
                          }}>
                            {subsector.companyCount} companies
                            <span style={{ color: 'var(--status-accepted)', marginLeft: '0.5rem' }}>
                              • {subsector.companies.map(c => c.ticker_symbol).join(', ')}
                            </span>
                          </p>
                          {subsector.subscriptionDetails && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.25rem', 
                              marginTop: '0.25rem' 
                            }}>
                              <Calendar style={{ 
                                width: '0.875rem', 
                                height: '0.875rem', 
                                color: formatExpirationDate(subsector.subscriptionDetails.expires_at).color 
                              }} />
                              <span style={{ 
                                color: formatExpirationDate(subsector.subscriptionDetails.expires_at).color,
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                {formatExpirationDate(subsector.subscriptionDetails.expires_at).text}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          color: 'var(--status-accepted)', 
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          <Check style={{ width: '1rem', height: '1rem' }} />
                          Subscribed
                        </span>
                        <button
                          onClick={() => handleUnsubscribe(subsector.subscriptionId!)}
                          disabled={loading}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--error-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            opacity: loading ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              (e.target as HTMLButtonElement).style.backgroundColor = '#c82333';
                              (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                              (e.target as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading) {
                              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--error-color)';
                              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                              (e.target as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                        >
                          {loading ? 'Processing...' : 'Unsubscribe'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
              }}>Available Subscriptions</h2>
              <p style={{ 
                color: 'var(--muted-text)', 
                fontSize: '1rem',
                marginBottom: '2rem'
              }}>Browse and subscribe to new subsectors to receive their company events</p>
            </div>

            {/* Filters for Add Tab */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
                <Search 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--muted-text)' 
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search available subsectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    backgroundColor: 'var(--tertiary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--primary-text)',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--tertiary-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--primary-text)',
                  fontSize: '1rem',
                  minWidth: '150px'
                }}
              >
                <option value="all">All Sectors</option>
                {availableSectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            {/* Available Subsectors List */}
            {filteredSubsectors.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                color: 'var(--muted-text)',
                backgroundColor: 'var(--tertiary-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <p style={{ fontSize: '1.125rem' }}>
                  {subsectors.filter(s => !s.isSubscribed).length === 0 
                    ? "You're subscribed to all available subsectors!" 
                    : "No available subsectors match your search criteria"
                  }
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredSubsectors.map(subsector => {
                  // Check if this subsector has an expired subscription
                  const hasExpiredSubscription = subsector.subscriptionId !== undefined && !subsector.isSubscribed;
                  
                  return (
                  <div 
                    key={subsector.name}
                    style={{ 
                      padding: '1.5rem', 
                      borderRadius: '8px', 
                      border: hasExpiredSubscription ? '1px solid var(--warning-color)' : '1px solid var(--border-color)', 
                      transition: 'all 0.2s ease',
                      backgroundColor: hasExpiredSubscription ? 'rgba(255, 193, 7, 0.1)' : 'var(--tertiary-bg)'
                    }}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4 style={{ 
                              color: 'var(--primary-text)', 
                              fontWeight: '600',
                              fontSize: '1rem',
                              margin: 0
                            }}>{subsector.name}</h4>
                            <span style={{ 
                              color: 'var(--muted-text)', 
                              fontSize: '0.75rem',
                              backgroundColor: 'var(--quaternary-bg)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px'
                            }}>{subsector.sector}</span>
                          </div>
                          <p style={{ 
                            color: 'var(--muted-text)', 
                            fontSize: '0.875rem',
                            margin: 0
                          }}>
                            {subsector.companyCount} companies • {subsector.companies.map(c => c.ticker_symbol).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          color: 'var(--muted-text)', 
                          fontSize: '0.875rem' 
                        }}>
                          Available
                        </span>
                        <button
                          onClick={() => handleSubscribe(subsector.name)}
                          disabled={loading}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--accent-bg)',
                            color: 'var(--primary-bg)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            opacity: loading ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-hover)';
                              (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                              (e.target as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(212, 175, 55, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading) {
                              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-bg)';
                              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                              (e.target as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                        >
                          {loading ? 'Processing...' : 'Subscribe'}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;