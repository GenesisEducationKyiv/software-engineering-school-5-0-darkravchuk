"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const weatherService_1 = __importDefault(require("../services/weatherService"));
class WeatherController {
    getWeather(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { city } = req.params;
            if (!city) {
                return res.status(400).json({ error: 'City parameter is required' });
            }
            try {
                const weather = yield weatherService_1.default.getWeather(city);
                res.status(200).json({ city, weather });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch weather: ' + error.message });
            }
        });
    }
}
exports.default = new WeatherController();
