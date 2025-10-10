/**
 * Weather Service
 * 
 * Provides real weather data integration with fallback to mock data
 */

import { getEnvironmentConfig } from '../config/environment';

export interface WeatherData {
  date: Date;
  temperature: {
    min: number;
    max: number;
    current: number;
  };
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
  };
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  description: string;
  icon: string;
}

class WeatherService {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    const config = getEnvironmentConfig();
    this.apiKey = config.weatherApiKey;
    this.baseUrl = config.weatherApiUrl || 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get weather forecast for a location
   */
  async getWeatherForecast(location: string, eventDate: Date): Promise<WeatherForecast[]> {
    if (!this.apiKey) {
      // Weather API key not configured, using mock data
      return this.generateMockWeatherForecast(eventDate);
    }

    try {
      // Get coordinates for the location (simplified - in production you'd use a geocoding service)
      const coordinates = await this.getCoordinates(location);
      
      // Get weather forecast from OpenWeatherMap API
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API data to our format
      return this.transformWeatherData(data, eventDate);
    } catch (error) {
      // Weather API error, falling back to mock data
      return this.generateMockWeatherForecast(eventDate);
    }
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location: string): Promise<WeatherData | null> {
    if (!this.apiKey) {
      // Weather API key not configured, using mock data
      return this.generateMockCurrentWeather();
    }

    try {
      const coordinates = await this.getCoordinates(location);
      
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        date: new Date(),
        temperature: {
          min: data.main.temp_min,
          max: data.main.temp_max,
          current: data.main.temp
        },
        condition: this.mapWeatherCondition(data.weather[0].main),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        icon: data.weather[0].icon
      };
    } catch (error) {
      // Weather API error, falling back to mock data
      return this.generateMockCurrentWeather();
    }
  }

  /**
   * Get coordinates for a location (simplified implementation)
   */
  private async getCoordinates(location: string): Promise<{ lat: number; lon: number }> {
    // Simplified coordinate lookup - in production, use a proper geocoding service
    const locationMap: Record<string, { lat: number; lon: number }> = {
      'new york': { lat: 40.7128, lon: -74.0060 },
      'san francisco': { lat: 37.7749, lon: -122.4194 },
      'london': { lat: 51.5074, lon: -0.1278 },
      'tokyo': { lat: 35.6762, lon: 139.6503 },
      'chicago': { lat: 41.8781, lon: -87.6298 },
      'boston': { lat: 42.3601, lon: -71.0589 },
      'austin': { lat: 30.2672, lon: -97.7431 },
      'seattle': { lat: 47.6062, lon: -122.3321 }
    };

    const normalizedLocation = location.toLowerCase();
    return locationMap[normalizedLocation] || { lat: 40.7128, lon: -74.0060 }; // Default to NYC
  }

  /**
   * Transform OpenWeatherMap API data to our format
   */
  private transformWeatherData(apiData: any, eventDate: Date): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const targetDate = new Date(eventDate);
    
    // Get forecasts for the next 3 days including event date
    for (let i = 0; i < 3; i++) {
      const forecastDate = new Date(targetDate);
      forecastDate.setDate(targetDate.getDate() + i);
      
      // Find the closest forecast to our target date
      const closestForecast = apiData.list.find((item: any) => {
        const itemDate = new Date(item.dt * 1000);
        return Math.abs(itemDate.getTime() - forecastDate.getTime()) < 12 * 60 * 60 * 1000; // Within 12 hours
      });

      if (closestForecast) {
        forecasts.push({
          date: forecastDate,
          temperature: {
            min: closestForecast.main.temp_min,
            max: closestForecast.main.temp_max
          },
          condition: this.mapWeatherCondition(closestForecast.weather[0].main),
          description: closestForecast.weather[0].description,
          icon: closestForecast.weather[0].icon
        });
      } else {
        // Fallback to mock data if no forecast found
        forecasts.push(this.generateMockWeatherForDate(forecastDate));
      }
    }

    return forecasts;
  }

  /**
   * Map OpenWeatherMap weather conditions to our format
   */
  private mapWeatherCondition(condition: string): 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' {
    const conditionMap: Record<string, 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'> = {
      'Clear': 'sunny',
      'Sun': 'sunny',
      'Clouds': 'cloudy',
      'Cloud': 'cloudy',
      'Rain': 'rainy',
      'Drizzle': 'rainy',
      'Thunderstorm': 'stormy',
      'Snow': 'snowy'
    };

    return conditionMap[condition] || 'sunny';
  }

  /**
   * Generate mock weather forecast (fallback)
   */
  private generateMockWeatherForecast(eventDate: Date): WeatherForecast[] {
    const weatherConditions = [
      { condition: 'sunny' as const, description: 'Sunny', icon: '☀️' },
      { condition: 'cloudy' as const, description: 'Cloudy', icon: '☁️' },
      { condition: 'rainy' as const, description: 'Rainy', icon: '🌧️' },
      { condition: 'stormy' as const, description: 'Stormy', icon: '⛈️' },
      { condition: 'snowy' as const, description: 'Snowy', icon: '❄️' }
    ];

    const forecasts: WeatherForecast[] = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(eventDate);
      date.setDate(date.getDate() + i);
      
      const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
      
      forecasts.push({
        date,
        temperature: {
          min: Math.floor(Math.random() * 10) + 5, // 5-15°C
          max: Math.floor(Math.random() * 15) + 15 // 15-30°C
        },
        condition: randomWeather.condition,
        description: randomWeather.description,
        icon: randomWeather.icon
      });
    }

    return forecasts;
  }

  /**
   * Generate mock current weather (fallback)
   */
  private generateMockCurrentWeather(): WeatherData {
    return {
      date: new Date(),
      temperature: {
        min: Math.floor(Math.random() * 10) + 5,
        max: Math.floor(Math.random() * 15) + 15,
        current: Math.floor(Math.random() * 15) + 10
      },
      condition: 'sunny',
      description: 'Partly cloudy',
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      icon: '☀️'
    };
  }

  /**
   * Generate mock weather for a specific date (fallback)
   */
  private generateMockWeatherForDate(date: Date): WeatherForecast {
    const weatherConditions = [
      { condition: 'sunny' as const, description: 'Sunny', icon: '☀️' },
      { condition: 'cloudy' as const, description: 'Cloudy', icon: '☁️' },
      { condition: 'rainy' as const, description: 'Rainy', icon: '🌧️' }
    ];

    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    return {
      date,
      temperature: {
        min: Math.floor(Math.random() * 10) + 5,
        max: Math.floor(Math.random() * 15) + 15
      },
      condition: randomWeather.condition,
      description: randomWeather.description,
      icon: randomWeather.icon
    };
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
