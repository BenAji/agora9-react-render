/**
 * AGORA Subscription Management Page
 * Handles GICS subsector-based subscriptions with mock Stripe integration
 */

import React, { useState } from 'react';
import { Check, X, CreditCard, Building } from 'lucide-react';

interface Subscription {
  id: string;
  subsector: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
}

interface AvailableSubsector {
  name: string;
  description: string;
  companyCount: number;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

const availableSubsectors: AvailableSubsector[] = [
  {
    name: 'Software & IT Services',
    description: 'Technology companies including software development, cloud services, and IT consulting',
    companyCount: 8,
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: ['Earnings calls', 'Product launches', 'Developer conferences', 'Quarterly updates']
  },
  {
    name: 'Semiconductors & Semiconductor Equipment',
    description: 'Chip manufacturers and semiconductor equipment companies',
    companyCount: 5,
    monthlyPrice: 39,
    yearlyPrice: 390,
    features: ['Earnings calls', 'Technology roadmaps', 'Industry conferences', 'Supply chain updates']
  },
  {
    name: 'Banks',
    description: 'Commercial banks and financial institutions',
    companyCount: 3,
    monthlyPrice: 59,
    yearlyPrice: 590,
    features: ['Earnings calls', 'Regulatory updates', 'Economic forecasts', 'Interest rate discussions']
  },
  {
    name: 'Investment Banking & Brokerage',
    description: 'Investment banks and brokerage firms',
    companyCount: 2,
    monthlyPrice: 69,
    yearlyPrice: 690,
    features: ['Earnings calls', 'Market analysis', 'Trading updates', 'Regulatory changes']
  },
  {
    name: 'Pharmaceuticals, Biotechnology & Life Sciences',
    description: 'Drug manufacturers and biotech companies',
    companyCount: 4,
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: ['Clinical trials', 'FDA approvals', 'Research updates', 'Partnership announcements']
  }
];

const mockUserSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    subsector: 'Software & IT Services',
    payment_status: 'paid',
    is_active: true,
    expires_at: new Date('2025-12-31'),
    created_at: new Date('2024-01-01')
  },
  {
    id: 'sub-2',
    subsector: 'Banks',
    payment_status: 'paid',
    is_active: true,
    expires_at: new Date('2025-06-30'),
    created_at: new Date('2024-06-01')
  }
];

const SubscriptionPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockUserSubscriptions);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (subsector: AvailableSubsector) => {
    setLoading(true);
    
    // Mock subscription process
    setTimeout(() => {
      const newSubscription: Subscription = {
        id: `sub-${Date.now()}`,
        subsector: subsector.name,
        payment_status: 'paid',
        is_active: true,
        expires_at: selectedPlan === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        created_at: new Date()
      };
      
      setSubscriptions(prev => [...prev, newSubscription]);
      setLoading(false);
      
      // Mock success notification
      alert(`Successfully subscribed to ${subsector.name}!`);
    }, 2000);
  };

  const handleUnsubscribe = async (subscriptionId: string) => {
    if (window.confirm('Are you sure you want to unsubscribe? You will lose access to all events in this subsector.')) {
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, is_active: false, payment_status: 'cancelled' as const }
            : sub
        )
      );
    }
  };

  const isSubscribed = (subsectorName: string) => {
    return subscriptions.some(sub => 
      sub.subsector === subsectorName && sub.is_active && sub.payment_status === 'paid'
    );
  };

  return (
    <div className="subscription-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header mb-6">
        <h1 className="text-2xl font-bold text-primary-text mb-2">Subscription Management</h1>
        <p className="text-muted">
          Subscribe to GICS subsectors to receive event notifications and calendar access for companies in those sectors.
        </p>
      </div>

      {/* Current Subscriptions */}
      <div className="current-subscriptions mb-8">
        <h2 className="text-xl font-semibold text-primary-text mb-4">Your Active Subscriptions</h2>
        {subscriptions.filter(sub => sub.is_active).length === 0 ? (
          <div className="empty-state p-6 text-center" style={{ 
            backgroundColor: 'var(--secondary-bg)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)'
          }}>
            <Building size={48} className="mx-auto mb-4 text-muted" />
            <p className="text-muted">No active subscriptions. Subscribe to a subsector below to get started.</p>
          </div>
        ) : (
          <div className="subscription-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {subscriptions.filter(sub => sub.is_active).map(subscription => (
              <div key={subscription.id} className="subscription-card p-4" style={{
                backgroundColor: 'var(--secondary-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-primary-text">{subscription.subsector}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        subscription.payment_status === 'paid' ? 'bg-green-600' : 'bg-yellow-600'
                      }`}>
                        {subscription.payment_status.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted">
                        Expires: {subscription.expires_at?.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm text-red-400"
                    onClick={() => handleUnsubscribe(subscription.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Selection */}
      <div className="plan-selection mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-primary-text">Available Subscriptions</h2>
          <div className="plan-toggle" style={{ 
            display: 'flex', 
            backgroundColor: 'var(--tertiary-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            padding: '0.25rem'
          }}>
            <button 
              className={`px-3 py-1 rounded text-sm ${selectedPlan === 'monthly' ? 'bg-accent-color text-primary-bg' : 'text-muted'}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm ${selectedPlan === 'yearly' ? 'bg-accent-color text-primary-bg' : 'text-muted'}`}
              onClick={() => setSelectedPlan('yearly')}
            >
              Yearly (Save 17%)
            </button>
          </div>
        </div>
      </div>

      {/* Available Subsectors */}
      <div className="available-subscriptions">
        <div className="subsector-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {availableSubsectors.map(subsector => {
            const subscribed = isSubscribed(subsector.name);
            const price = selectedPlan === 'yearly' ? subsector.yearlyPrice : subsector.monthlyPrice;
            
            return (
              <div key={subsector.name} className={`subsector-card p-6 ${subscribed ? 'subscribed' : ''}`} style={{
                backgroundColor: 'var(--secondary-bg)',
                border: subscribed ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                position: 'relative'
              }}>
                {subscribed && (
                  <div className="subscribed-badge" style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'var(--accent-color)',
                    color: 'var(--primary-bg)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    <Check size={12} className="inline mr-1" />
                    SUBSCRIBED
                  </div>
                )}
                
                <div className="subsector-header mb-4">
                  <h3 className="text-lg font-semibold text-primary-text mb-2">{subsector.name}</h3>
                  <p className="text-muted text-sm mb-3">{subsector.description}</p>
                  <div className="subsector-stats flex items-center gap-4 text-sm text-muted">
                    <span><Building size={14} className="inline mr-1" />{subsector.companyCount} companies</span>
                  </div>
                </div>

                <div className="pricing mb-4">
                  <div className="price-display">
                    <span className="text-2xl font-bold text-accent">${price}</span>
                    <span className="text-muted">/{selectedPlan}</span>
                  </div>
                  {selectedPlan === 'yearly' && (
                    <div className="savings text-sm text-green-400">
                      Save ${(subsector.monthlyPrice * 12) - subsector.yearlyPrice} per year
                    </div>
                  )}
                </div>

                <div className="features mb-6">
                  <h4 className="font-semibold text-primary-text mb-2">Included:</h4>
                  <ul className="space-y-1">
                    {subsector.features.map(feature => (
                      <li key={feature} className="text-sm text-muted flex items-center">
                        <Check size={14} className="text-green-400 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  className={`btn w-full ${subscribed ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => !subscribed && handleSubscribe(subsector)}
                  disabled={subscribed || loading}
                >
                  {loading ? (
                    'Processing...'
                  ) : subscribed ? (
                    'Already Subscribed'
                  ) : (
                    <>
                      <CreditCard size={16} className="mr-2" />
                      Subscribe Now
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;