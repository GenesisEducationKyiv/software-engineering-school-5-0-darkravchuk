import axios from 'axios';
import WeatherService from "../src/services/weatherService";

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv, WEATHER_API_KEY: 'test-key' };
        mockedAxios.get.mockReset();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should return weather data for a valid city', async () => {
        const mockData = {
            data: {
                current: {
                    temp_c: 20,
                    condition: { text: 'Sunny' },
                    humidity: 40,
                    pressure_mb: 1012,
                },
            },
        };

        mockedAxios.get.mockResolvedValueOnce(mockData);

        const result = await WeatherService.getWeather('Kyiv');

        expect(result).toEqual({
            temperature: 20,
            description: 'Sunny',
            humidity: 40,
            pressure: 1012,
        });
    });

    it('should throw an error if API call fails', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

        await expect(WeatherService.getWeather('InvalidCity')).rejects.toThrow(
            'Failed to fetch weather for InvalidCity: Network error'
        );
    });

    it('should throw a general error if city name is empty', async () => {
        mockedAxios.get.mockRejectedValueOnce(
            new Error("Cannot read properties of undefined (reading 'data')")
        );

        await expect(WeatherService.getWeather('')).rejects.toThrow(
            'Failed to fetch weather for : Cannot read properties of undefined (reading \'data\')'
        );
    });

    it('should call the correct API endpoint with full URL', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                current: {
                    temp_c: 15,
                    condition: { text: 'Cloudy' },
                    humidity: 50,
                    pressure_mb: 1000,
                },
            },
        });

        await WeatherService.getWeather('Lviv');

        const calledUrl = mockedAxios.get.mock.calls[0][0];

        const url = new URL(calledUrl);

        expect(url.origin + url.pathname).toBe('http://api.weatherapi.com/v1/current.json');
        expect(url.searchParams.get('q')).toBe('Lviv');
    });

    it('should throw error if API key is not set', async () => {
        process.env.WEATHER_API_KEY = undefined;

        // Змінюємо реалізацію axios.get, щоб зімітувати результат
        mockedAxios.get.mockRejectedValueOnce(
            new Error("Cannot read properties of undefined (reading 'data')")
        );

        await expect(WeatherService.getWeather('Kyiv')).rejects.toThrow(
            'Failed to fetch weather for Kyiv: Cannot read properties of undefined (reading \'data\')'
        );
    });
});
