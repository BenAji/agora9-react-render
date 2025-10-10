/**
 * AGORA Weather Forecast Component
 * 
 * PHASE 3, STEP 3.3: Weather Forecast Integration
 * Dependencies: calendar.ts types
 * Purpose: 3-day weather forecast display
 * 
 * SAFETY: Uses mock data only, no API calls, no external dependencies
 */

import React from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, MapPin } from 'lucide-react';
// import { WeatherForecast as WeatherForecastType } from '../../types/calendar';
import { format, subDays } from 'date-fns';

interface WeatherForecastProps {
  eventDate: Date;
  location?: string;
  className?: string;
}

interface MockWeatherData {
  date: Date;
  temperature: {
    high: number;
    low: number;
  };
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  description: string;
  humidity: number;
  windSpeed: number;
}

const WeatherForecast: React.FC<WeatherForecastProps> = ({ 
  eventDate, 
  location = 'Event Location',
  className = '' 
}) => {
  
  // Generate mock weather data for 3 days prior to event
  const generateMockWeatherData = (): MockWeatherData[] => {
    const weatherConditions = [
      { condition: 'sunny' as const, description: 'Sunny', icon: Sun },
      { condition: 'cloudy' as const, description: 'Partly Cloudy', icon: Cloud },
      { condition: 'rainy' as const, description: 'Light Rain', icon: CloudRain },
      { condition: 'cloudy' as const, description: 'Overcast', icon: Cloud }
    ];

    const mockData: MockWeatherData[] = [];
    
    // Generate data for 3 days prior to event + event day
    for (let i = 3; i >= 0; i--) {
      const date = subDays(eventDate, i);
      const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
      
      mockData.push({
        date,
        temperature: {
          high: Math.floor(Math.random() * 15) + 65, // 65-80°F
          low: Math.floor(Math.random() * 15) + 50   // 50-65°F
        },
        condition: randomWeather.condition,
        description: randomWeather.description,
        humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
        windSpeed: Math.floor(Math.random() * 10) + 5   // 5-15 mph
      });
    }

    return mockData;
  };

  const weatherData = generateMockWeatherData();

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
      default:
        return <Cloud {...iconProps} />;
    }
  };

  const isEventDay = (date: Date) => {
    return date.toDateString() === eventDate.toDateString();
  };

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
                {day.temperature.high}°
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--muted-text)'
              }}>
                {day.temperature.low}°
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

            {/* Additional Details */}
            <div style={{
              fontSize: '0.625rem',
              color: 'var(--muted-text)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem'
            }}>
              <div>Humidity: {day.humidity}%</div>
              <div>Wind: {day.windSpeed} mph</div>
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
          between {weatherData[weatherData.length - 1]?.temperature.low}° and{' '}
          {weatherData[weatherData.length - 1]?.temperature.high}°F.
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
