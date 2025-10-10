/**
 * Environment Configuration Utility
 * 
 * Centralizes all environment variable access with proper validation
 * and fallbacks for different environments.
 */

export interface EnvironmentConfig {
  // Supabase Configuration
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // API Configuration
  apiUrl: string;
  
  // Environment
  environment: 'development' | 'staging' | 'production';
  
  // Optional Services
  weatherApiKey?: string;
  weatherApiUrl?: string;
  analyticsId?: string;
  sentryDsn?: string;
}

/**
 * Validates that required environment variables are present
 */
function validateEnvironment(): void {
  const required = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}

/**
 * Gets the current environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Validate required variables in production
  if (process.env.NODE_ENV === 'production') {
    validateEnvironment();
  }

  const environment = (process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';

  return {
    // Supabase Configuration
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
    supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
    
    // API Configuration
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    
    // Environment
    environment,
    
    // Optional Services
    weatherApiKey: process.env.REACT_APP_WEATHER_API_KEY,
    weatherApiUrl: process.env.REACT_APP_WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
    analyticsId: process.env.REACT_APP_ANALYTICS_ID,
    sentryDsn: process.env.REACT_APP_SENTRY_DSN
  };
}

/**
 * Checks if we're in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().environment === 'development';
}

/**
 * Checks if we're in production mode
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().environment === 'production';
}

/**
 * Gets the base URL for API calls
 */
export function getApiBaseUrl(): string {
  return getEnvironmentConfig().apiUrl;
}

/**
 * Gets Supabase configuration
 */
export function getSupabaseConfig() {
  const config = getEnvironmentConfig();
  return {
    url: config.supabaseUrl,
    anonKey: config.supabaseAnonKey
  };
}

// Export the default configuration
export const env = getEnvironmentConfig();
