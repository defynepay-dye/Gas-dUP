import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';

// This is a static component for now.
// It could be enhanced with an API call to a weather service.
export default function WeatherWidget() {
    const weather = {
        city: "New York",
        temperature: 72,
        condition: "Partly Cloudy",
        icon: <Cloud className="w-10 h-10" />
    };

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-lg">{weather.city}</p>
                <p className="text-sm text-gray-400">{weather.condition}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-4xl font-bold">{weather.temperature}°</span>
                {weather.icon}
            </div>
        </div>
    );
}