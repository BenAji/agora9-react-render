/**
 * AGORA Weather Forecast Component
 * 
 * PHASE 2: Real Weather API Integration
 * Dependencies: weatherService, calendar.ts types
 * Purpose: 3-day weather forecast display with real weather data
 * 
 * SAFETY: Uses real weather API with fallback to mock data
 */

import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, MapPin, Loader2 } from 'lucide-react';
import { weatherService, WeatherForecast as WeatherForecastType } from '../../services/weatherService';
import { format, subDays } from 'date-fns';

interface WeatherForecastProps {
  eventDate: Date;
  location?: string;
  className?: string;
}

const WeatherForecast: React.FC<WeatherForecastProps> = ({ 
  eventDate, 
  location = 'Event Location',
  className = '' 
}) => {
  const [weatherData, setWeatherData] = useState<WeatherForecastType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real weather data
  useEffect(() => {
    const loadWeatherData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const forecast = await weatherService.getWeatherForecast(location, eventDate);
        setWeatherData(forecast);
      } catch (err) {
        console.error('Failed to load weather data:', err);
        setError('Failed to load weather data');
        // Fallback to empty array - the service will handle mock data internally
        setWeatherData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeatherData();
  }, [eventDate, location]);

  const getWeatherIcon = (condition: string, size: number = 20) => {
    const iconProps = { size, color: 'var(--muted-text)' };
    
    switch (condition) {
      case 'sunny':
        return <Sun {...iconProps} color="var(--accent-text)" />;
      case 'cloudy':
        return <Cloud {...iconProps} />;
      case 'rainy':
        return <CloudRain {...iconProps} color="var(--info-text)" />;
      case 'snowy':
        return <CloudSnow {...iconProps} color="var(--info-text)" />;
      case 'stormy':
        return <CloudRain {...iconProps} color="var(--info-text)" />;
      default:
        return <Cloud {...iconProps} />;
    }
  };

  const isEventDay = (date: Date) => {
    return date.toDateString() === eventDate.toDateString();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`weather-forecast ${className}`} style={{
        backgroundColor: 'var(--primary-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1rem',
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={20} className="animate-spin" />
          <span style={{ color: 'var(--muted-text)' }}>Loading weather forecast...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || weatherData.length === 0) {
    return (
      <div className={`weather-forecast ${className}`} style={{
        backgroundColor: 'var(--primary-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1rem',
        fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <MapPin size={16} color="var(--muted-text)" />
          <div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--primary-text)'
            }}>
              Weather Forecast
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--muted-text)'
            }}>
              {location}
            </div>
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          color: 'var(--muted-text)',
          fontSize: '0.875rem'
        }}>
          Weather data temporarily unavailable
        </div>
      </div>
    );
  }

  return (
    <div className={`weather-forecast ${className}`} style={{
      backgroundColor: 'var(--primary-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1rem',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      width: '100%'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <MapPin size={16} color="var(--muted-text)" />
        <div>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--primary-text)'
          }}>
            Weather Forecast
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--muted-text)'
          }}>
            {location}
          </div>
        </div>
      </div>

      {/* 4-Day Forecast Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem'
      }}>
        {weatherData.map((day, index) => (
          <div
            key={index}
            style={{
              padding: '0.75rem',
              backgroundColor: isEventDay(day.date) 
                ? 'var(--accent-bg-light)' 
                : 'var(--tertiary-bg)',
              border: isEventDay(day.date) 
                ? '2px solid var(--accent-bg)' 
                : '1px solid var(--border-color)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Event Day Badge */}
            {isEventDay(day.date) && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--primary-bg)',
                fontSize: '0.625rem',
                fontWeight: '600',
                padding: '0.125rem 0.375rem',
                borderRadius: '8px',
                textTransform: 'uppercase'
              }}>
                Event Day
              </div>
            )}

            {/* Date */}
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isEventDay(day.date) ? 'var(--accent-text)' : 'var(--primary-text)',
              marginBottom: '0.5rem'
            }}>
              {format(day.date, 'MMM d')}
            </div>

            {/* Weather Icon */}
            <div style={{ marginBottom: '0.5rem' }}>
              {getWeatherIcon(day.condition, 24)}
            </div>

            {/* Temperature */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginBottom: '0.25rem'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--primary-text)'
              }}>
                {day.temperature.max}°
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--muted-text)'
              }}>
                {day.temperature.min}°
              </span>
            </div>

            {/* Condition */}
            <div style={{
              fontSize: '0.625rem',
              color: 'var(--muted-text)',
              marginBottom: '0.25rem'
            }}>
              {day.description}
            </div>
          </div>
        ))}
      </div>

      {/* Travel Information */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: 'var(--tertiary-bg)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'var(--primary-text)',
          marginBottom: '0.5rem'
        }}>
          Travel Information
        </div>
        
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--muted-text)',
          lineHeight: '1.4'
        }}>
          Plan accordingly for weather conditions. Event day forecast: {' '}
          {weatherData[weatherData.length - 1]?.description.toLowerCase()} with temperatures 
          between {weatherData[weatherData.length - 1]?.temperature.min}° and{' '}
          {weatherData[weatherData.length - 1]?.temperature.max}°C.
        </div>
        
        <div style={{
          fontSize: '0.625rem',
          color: 'var(--muted-text)',
          marginTop: '0.5rem',
          fontStyle: 'italic'
        }}>
          * Weather data is estimated and may change
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;
