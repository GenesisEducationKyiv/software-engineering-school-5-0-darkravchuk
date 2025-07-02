export class WeatherDataDTO {
    constructor(
        public temperature: number,
        public description: string,
        public humidity: number,
        public pressure: number,
    ) {}
}