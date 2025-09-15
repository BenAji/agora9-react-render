/**
 * AGORA Error Boundary Component
 * 
 * PHASE 4, STEP 4.4: Error Boundaries for API Failures
 * Purpose: Catch and handle React errors gracefully
 * 
 * SAFETY: Prevents app crashes and provides fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and external service
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info in state
    this.setState({
      error,
      errorInfo
    });

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--primary-bg)',
          border: '1px solid var(--error-color)',
          borderRadius: '8px',
          margin: '1rem',
          fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            🚨
          </div>
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--error-color)',
            marginBottom: '1rem'
          }}>
            Something went wrong
          </h2>
          
          <p style={{
            fontSize: '1rem',
            color: 'var(--muted-text)',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            We encountered an unexpected error. This might be due to a network issue or a temporary problem with our services.
          </p>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--primary-bg)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity = '1';
              }}
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--tertiary-bg)',
                color: 'var(--primary-text)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--tertiary-bg)';
              }}
            >
              Refresh Page
            </button>
          </div>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '2rem',
              textAlign: 'left',
              backgroundColor: 'var(--tertiary-bg)',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Error Details (Development)
              </summary>
              
              <div style={{
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                color: 'var(--error-color)',
                marginBottom: '1rem'
              }}>
                <strong>Error:</strong> {this.state.error.message}
              </div>
              
              {this.state.error.stack && (
                <pre style={{
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--primary-bg)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  border: '1px solid var(--border-color)'
                }}>
                  {this.state.error.stack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
