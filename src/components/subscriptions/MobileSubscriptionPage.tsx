/**
 * Mobile-Friendly Subscription Management Page
 * 
 * Features:
 * - Card-based layout optimized for mobile
 * - Simplified search
 * - Bloomberg theme
 * - Responsive design
 * - Touch-friendly interactions
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, Building2, BarChart3, Check } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { UserWithSubscriptions } from '../../types/database';
import { useSubscriptionContext } from '../../contexts/SubscriptionContext';
import MobileSubscriptionCard from './MobileSubscriptionCard';

interface MobileSubscriptionPageProps {
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

const MobileSubscriptionPage: React.FC<MobileSubscriptionPageProps> = ({ 
  currentUser, 
  onSubscriptionChange 
}) => {
  const { triggerRefresh } = useSubscriptionContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [subsectors, setSubsectors] = useState<SubsectorData[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalCompanies: 0,
    subscribedCompanies: 0,
    totalSectors: 0,
    subscribedSectors: 0,
    totalSubsectors: 0,
    subscribedSubsectors: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subscription data
  useEffect(() => {
    loadSubscriptionData();
  }, [currentUser]);

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

      // Process data
      const allCompanies = companiesResponse.data || [];
      const userSubscriptions = userSubsResponse.data || [];
      const subsectorNames = allSubsectorsResponse.data || [];

      // Group companies by subsector
      const companiesBySubsector: { [key: string]: Company[] } = {};
      allCompanies.forEach(company => {
        if (!companiesBySubsector[company.gics_subsector]) {
          companiesBySubsector[company.gics_subsector] = [];
        }
        companiesBySubsector[company.gics_subsector].push(company);
      });

      const processedSubsectors: SubsectorData[] = subsectorNames.map(subsectorName => {
        const companies = companiesBySubsector[subsectorName] || [];
        const userSubscription = userSubscriptions.find(sub => sub.subsector === subsectorName);
        
        return {
          name: subsectorName,
          sector: companies[0]?.gics_sector || 'Unknown',
          companyCount: companies.length,
          companies: companies,
          isSubscribed: !!userSubscription,
          subscriptionId: userSubscription?.id,
          subscriptionDetails: userSubscription ? {
            expires_at: userSubscription.expires_at ? String(userSubscription.expires_at) : '',
            created_at: userSubscription.created_at ? String(userSubscription.created_at) : '',
            payment_status: userSubscription.payment_status || 'pending'
          } : undefined
        };
      });

      setSubsectors(processedSubsectors);

      // Calculate stats
      const subscribedSubsectors = processedSubsectors.filter(s => s.isSubscribed);
      const totalCompanies = processedSubsectors.reduce((sum, s) => sum + s.companyCount, 0);
      const subscribedCompanies = subscribedSubsectors.reduce((sum, s) => sum + s.companyCount, 0);
      const totalSectors = new Set(processedSubsectors.map(s => s.sector)).size;
      const subscribedSectors = new Set(subscribedSubsectors.map(s => s.sector)).size;

      setStats({
        totalCompanies,
        subscribedCompanies,
        totalSectors,
        subscribedSectors,
        totalSubsectors: processedSubsectors.length,
        subscribedSubsectors: subscribedSubsectors.length
      });

    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  // Handle unsubscribe
  const handleUnsubscribe = async (subscriptionId: string) => {
    try {
      const response = await apiClient.deleteSubscription(subscriptionId);
      if (response.success) {
        await loadSubscriptionData();
        triggerRefresh();
        onSubscriptionChange?.();
      } else {
        throw new Error(response.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    }
  };

  // Handle manage subscription
  const handleManage = (subscriptionId: string) => {
    // For now, just show an alert. In a real app, this would open a management modal
    alert('Manage subscription functionality would open here');
  };

  // Filter subsectors based on search
  const filteredSubsectors = subsectors.filter(subsector =>
    subsector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subsector.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subsector.companies.some(company => 
      company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.ticker_symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Separate subscribed and unsubscribed
  const subscribedSubsectors = filteredSubsectors.filter(s => s.isSubscribed);
  const unsubscribedSubsectors = filteredSubsectors.filter(s => !s.isSubscribed);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        color: '#FFFFFF'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            📊
          </div>
          <p>Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        color: '#FFFFFF',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: '#1a1a1a',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #333333'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            ⚠️
          </div>
          <h3 style={{
            color: '#FFD700',
            marginBottom: '1rem'
          }}>
            Error Loading Subscriptions
          </h3>
          <p style={{
            color: '#cccccc',
            marginBottom: '1rem'
          }}>
            {error}
          </p>
          <button
            onClick={loadSubscriptionData}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FFD700',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Manage Subscriptions
        </h1>
        <p style={{
          color: '#cccccc',
          fontSize: '14px',
          margin: 0
        }}>
          View and manage your current subscriptions
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '1.5rem'
      }}>
        <Search 
          size={20} 
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666666'
          }}
        />
        <input
          type="text"
          placeholder="Search subscriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 12px 12px 44px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontSize: '16px',
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

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #333333',
          textAlign: 'center'
        }}>
          <Building2 size={24} color="#FFD700" style={{ marginBottom: '8px' }} />
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: '4px'
          }}>
            {stats.subscribedCompanies}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#cccccc'
          }}>
            Subscribed Companies
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #333333',
          textAlign: 'center'
        }}>
          <BarChart3 size={24} color="#FFD700" style={{ marginBottom: '8px' }} />
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: '4px'
          }}>
            {stats.subscribedSubsectors}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#cccccc'
          }}>
            Active Subscriptions
          </div>
        </div>
      </div>

      {/* Current Subscriptions */}
      {subscribedSubsectors.length > 0 && (
        <div style={{
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} color="#FFD700" />
            Current Subscriptions ({subscribedSubsectors.length})
          </h2>
          
          <div>
            {subscribedSubsectors.map(subsector => (
              <MobileSubscriptionCard
                key={subsector.subscriptionId}
                subscription={{
                  id: subsector.subscriptionId || '',
                  subsector: subsector.name,
                  sector: subsector.sector,
                  companyCount: subsector.companyCount,
                  companies: subsector.companies,
                  expiresAt: subsector.subscriptionDetails?.expires_at || '',
                  paymentStatus: subsector.subscriptionDetails?.payment_status || 'pending'
                }}
                onUnsubscribe={handleUnsubscribe}
                onManage={handleManage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add More Subscriptions */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#FFFFFF',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Plus size={18} color="#FFD700" />
          Available Subscriptions ({unsubscribedSubsectors.length})
        </h2>
        
        {unsubscribedSubsectors.length > 0 ? (
          <div>
            {unsubscribedSubsectors.slice(0, 5).map(subsector => (
              <div
                key={subsector.name}
                style={{
                  backgroundColor: '#1a1a1a',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #333333',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FFD700';
                  e.currentTarget.style.backgroundColor = '#222222';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333333';
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#FFFFFF',
                      margin: 0,
                      marginBottom: '4px'
                    }}>
                      {subsector.name}
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: '#cccccc',
                      margin: 0,
                      marginBottom: '8px'
                    }}>
                      {subsector.sector}
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: '#FFFFFF',
                      margin: 0
                    }}>
                      {subsector.companyCount} companies
                    </p>
                  </div>
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#FFD700',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            ))}
            
            {unsubscribedSubsectors.length > 5 && (
              <div style={{
                textAlign: 'center',
                padding: '16px',
                color: '#cccccc',
                fontSize: '14px'
              }}>
                +{unsubscribedSubsectors.length - 5} more available subscriptions
              </div>
            )}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#cccccc'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              🎉
            </div>
            <p>You're subscribed to all available subsectors!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSubscriptionPage;
