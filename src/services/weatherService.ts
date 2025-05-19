import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

class WeatherService {
    private apiKey: string;

    constructor() {
        console.log('WEATHER_API_KEY:', process.env.WEATHER_API_KEY);
        this.apiKey = process.env.WEATHER_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('WEATHER_API_KEY is not set in environment variables');
        }
    }

    async getWeather(city: string) {
        try {
            const url = `http://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${city}`;
            console.log(`Requesting URL: ${url}`); // Debug log to see the full URL
            const response = await axios.get(url);

            const { current } = response.data;
            return {
                temperature: current.temp_c, // Temperature in Celsius
                description: current.condition.text, // Weather description
                humidity: current.humidity,
                pressure: current.pressure_mb, // Pressure in millibars
            };
        } catch (error) {
            throw new Error(`Failed to fetch weather for ${city}: ${(error as Error).message}`);
        }
    }
}

export default new WeatherService();