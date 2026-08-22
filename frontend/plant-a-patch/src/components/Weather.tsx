import { useState, useEffect } from 'react';

type Forecast = {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    time: string[];
    weather_code: number[];
}

type ForecastDay = {
    date: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
}

type Location = {
    name: string;
    country: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    latitude: number;
    longitude: number;
}

type WeatherProps = {
    setIsRainingOn: (isRainingOn: string) => void;
    setIsHotOn: (isHotOn: string) => void;
    setIsFreezingOn: (isFreezingOn: string) => void;
}

function Weather({setIsRainingOn, setIsHotOn, setIsFreezingOn}: WeatherProps) {
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);
    const [temperatureUnit, setTemperatureUnit] = useState('celsius');
    const [displayUnit, setDisplayUnit] = useState('celsius');
    const [weeklyWeather, setWeeklyWeather] = useState<ForecastDay[]>([]);
    const [springFrostDate, setSpringFrostDate] = useState('');
    const [autumnFrostDate, setAutumnFrostDate] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Variables for changing the user location
    const [isChangingLocation, setIsChangingLocation] = useState(false);
    const [locations, setLocations] = useState<Location[]>([]);
    const [newCity, setNewCity] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    function getWeatherIcon(weatherCode: number): string {
        switch (weatherCode) {
            case 0: // Clear sky
                return '☀️'; 
            case 1: // Mainly clear
                return '🌤'; 
            case 2: // Partly cloudy
                return '⛅️'; 
            case 3: // Overcast
            case 45: // Fog
            case 48: // Depositing rime fog
                return '☁️';
            case 51: // Drizzle - light
            case 53: // Drizzle  - moderate 
            case 55: // Drizzle - dense
            case 61: // Rain - light
            case 63: // Rain  - moderate 
            case 65: // Rain - heavy
            case 80: // Rain showers - slight
            case 81: // Rain showers - moderate
            case 82: // Rain showers - violent
                return '🌧';
            case 95: // Thunderstorm - slight or moderate
            case 96: // Thunderstorm with slight hail
            case 99: // Thunderstorm with heavy hail
                return '🌩';
            default: // Snow, freezing rain
                return '❄️';
        }
    }

    // Fetch user's location when the component mounts
    useEffect(() => {
        async function getUserLocation() {
            const token = localStorage.getItem('token');
            const apiEndpoint = import.meta.env.VITE_API_URL;

            try {
                const response = await fetch(`${apiEndpoint}/user_info/`, {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error('Failed to fetch user location');
                }

                setCity(data.city);
                setCountry(data.country);
                setLatitude(Number(data.latitude));
                setLongitude(Number(data.longitude));

                if (data.country === 'United States') {
                    setTemperatureUnit('fahrenheit');
                    setDisplayUnit('fahrenheit');
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(String(error));
                }
            }
        }
        getUserLocation();
    }, []);

    // Fetch weather data and frost dates from the back end 
    useEffect(() => {
        if (latitude === 0 && longitude === 0) {
            return;
        }

        async function getWeatherData() {
            setIsLoading(true);
            const apiEndpoint = import.meta.env.VITE_API_URL;

            try {
                const response = await fetch(`${apiEndpoint}/weather/?latitude=${latitude}&longitude=${longitude}&unit=${temperatureUnit}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch weather data');
                }

                const springFrost = data.frost_dates.spring_frost_date;
                const autumnFrost = data.frost_dates.autumn_frost_date;

                if (isNaN(new Date(springFrost).getTime())) {
                    setSpringFrostDate(springFrost); 
                } else {
                    setSpringFrostDate(new Date(springFrost).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'long'
                    }));
                }
                
                if (isNaN(new Date(autumnFrost).getTime())) {
                    setAutumnFrostDate(autumnFrost); 
                } else {
                    setAutumnFrostDate(new Date(autumnFrost).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'long'
                    }));
                }
                
                const forecast: Forecast = data.forecast;

                const forecastDays: ForecastDay[] = forecast.time.map((date, index) => ({
                    date: new Date(date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                    }),
                    maxTemp: forecast.temperature_2m_max[index],
                    minTemp: forecast.temperature_2m_min[index],
                    weatherCode: forecast.weather_code[index],
                }));

                setWeeklyWeather(forecastDays);
                setDisplayUnit(temperatureUnit);
                getWeatherAlerts(forecastDays);
            }
            catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError(String(error));
                }
            }
            finally {
                setIsLoading(false);
            }
        }

        function getWeatherAlerts(forecastDays: ForecastDay[]) {
            const rainyDays = forecastDays.filter(day => [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(day.weatherCode));
            
            const hotDays = forecastDays.filter(day => {
                if (temperatureUnit === 'celsius') {
                    return day.maxTemp >= 25;
                } else {
                    return day.maxTemp >= 77;
                }
            });

            const freezingDays = forecastDays.filter(day => {
                if (temperatureUnit === 'celsius') {
                    return day.minTemp <= 0;
                } else {
                    return day.minTemp <= 32;
                }
            });

            if (rainyDays.length === 1) {
                setIsRainingOn(`It's going to rain on ${rainyDays[0].date}. You might not need to water your plants!`);
            } else if (rainyDays.length > 1) {
                const rainyDaysList = rainyDays.map(day => day.date);

                if (rainyDaysList.length === 2) {
                    setIsRainingOn(`It's going to rain on ${rainyDaysList[0]} and ${rainyDaysList[1]}. You might not need to water your plants!`);
                } else {
                    const lastRainyDay = rainyDaysList.pop();
                    setIsRainingOn(`It's going to rain on ${rainyDaysList.join(', ')}, and ${lastRainyDay}. You might not need to water your plants!`);
                }
            }

            if (hotDays.length === 1) {
                setIsHotOn(`It's going to be hot on ${hotDays[0].date}. You should probably water your plants!`);
            } else if (hotDays.length > 1) {
                const hotDaysList = hotDays.map(day => day.date);

                if (hotDaysList.length === 2) {
                    setIsHotOn(`It's going to be hot on ${hotDaysList[0]} and ${hotDaysList[1]}. You should probably water your plants!`);
                } else {
                    const lastHotDay = hotDaysList.pop();
                    setIsHotOn(`It's going to be hot on ${hotDaysList.join(', ')}, and ${lastHotDay}. You should probably water your plants!`);
                }
            }

            if (freezingDays.length === 1) {
                setIsFreezingOn(`It's going to be freezing on ${freezingDays[0].date}. You might want to protect your plants!`);
            } else if (freezingDays.length > 1) {
                const freezingDaysList = freezingDays.map(day => day.date);

                if (freezingDaysList.length === 2) {
                    setIsFreezingOn(`It's going to be freezing on ${freezingDaysList[0]} and ${freezingDaysList[1]}. You might want to protect your plants!`);
                } else {
                    const lastFreezingDay = freezingDaysList.pop();
                    setIsFreezingOn(`It's going to be freezing on ${freezingDaysList.join(', ')}, and ${lastFreezingDay}. You might want to protect your plants!`);
                }            
            }
        }

        getWeatherData();
    }, [temperatureUnit, country, latitude, longitude, setIsRainingOn, setIsHotOn, setIsFreezingOn]);

    async function searchForLocation(city: string) {
        if (!city.trim()) {
            return; 
        }

        const apiEndpoint = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${apiEndpoint}/locations/?city=${city}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch location data');
            }

            setLocations(data.results || []);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(String(error));
            }
        }
    }

    async function changeUserLocation() {
        setError('');
        setIsRainingOn('');
        setIsHotOn('');
        setIsFreezingOn('');

        if (!selectedLocation) {
            setError('Please select a location from the list.');
            return;
        }

        const token = localStorage.getItem('token');
        const apiEndpoint = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${apiEndpoint}/update_user_location/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    city: selectedLocation.name,
                    country: selectedLocation.country,
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update user location.');
            }

            if (selectedLocation.country === 'United States') {
                setTemperatureUnit('fahrenheit');
                setDisplayUnit('fahrenheit');
            } else {
                setTemperatureUnit('celsius');
                setDisplayUnit('celsius');
            }

            setCity(selectedLocation.name);
            setCountry(selectedLocation.country);
            setLatitude(selectedLocation.latitude);
            setLongitude(selectedLocation.longitude);

            setIsChangingLocation(false);
            setLocations([]);
            setSelectedLocation(null);
        }
        catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(String(error));
            }
        }
    }

    return (
        <div className="mx-auto mt-8 p-4 rounded-xl shadow-lg bg-white">
            <h2 className="text-xl font-bold mb-4 text-center">Weather</h2>
            <form className="flex gap-4 justify-center mb-4">
                <p>Select Temperature Unit:</p>
                <label className="flex items-center gap-1"> 
                    <input type="radio" name="unit" value="celsius" 
                    checked={temperatureUnit === 'celsius'} 
                    onChange={() => setTemperatureUnit('celsius')}
                    className="accent-emerald-600" />
                    Celsius 
                </label>
                <label className="flex items-center gap-1">
                    <input type="radio" name="unit" value="fahrenheit" 
                    checked={temperatureUnit === 'fahrenheit'} 
                    onChange={() => setTemperatureUnit('fahrenheit')} 
                    className="accent-emerald-600" />
                    Fahrenheit
                </label>
            </form>
            {error && <p className="text-red-500 font-bold text-center mb-4">{error}</p>}
            <div>
                <h3 className="text-lg font-bold text-center">{city}</h3>
                <div className="flex justify-center mt-4 mb-4">
                    <button className="text-amber-200 bg-emerald-600 font-bold text-xl p-2 rounded-full hover:bg-emerald-700 transition-colors duration-300 cursor-pointer"
                        onClick={() => setIsChangingLocation(!isChangingLocation)}
                    >Change Location</button>
                </div>
                <div className="flex justify-around overflow-x-auto snap-x snap-mandatory gap-4 mt-4 mb-4 border-2 border-orange-200 rounded-lg p-2">
                    {isLoading && <p className="text-center motion-safe:animate-pulse">Loading weather...</p>}
                    {!isLoading && weeklyWeather.map((day, index) => (
                        <div key={index} className="snap-center text-center p-2">
                            <p className="text-4xl md:text-6xl mb-2">{getWeatherIcon(day.weatherCode)}</p>
                            <p className="font-semibold">{day.date}</p>
                            <p>High: {day.maxTemp}{displayUnit === 'celsius' ? '°C' : '°F'} </p>
                            <p>Low: {day.minTemp}{displayUnit === 'celsius' ? '°C' : '°F'} </p>
                        </div>
                    ))}
                </div>
            </div>

            {isChangingLocation && (
                <div className="mb-4 bg-amber-50 p-4 rounded-lg">
                    <label htmlFor="city" className="block mb-2 font-semibold">Where is your garden located?</label>
                    <input 
                        type="text" 
                        id="city" 
                        name="city" 
                        className="w-full p-2 rounded-full bg-amber-100 focus:outline-4 focus:outline-emerald-600" 
                        value={newCity} 
                        onChange={(e) => {
                            setNewCity(e.target.value);
                            searchForLocation(e.target.value);
                        }}
                        placeholder="Enter your city (e.g. Glasgow)" 
                    />
                    {locations.length > 0 && (
                        <div className="mt-2">
                            <ul className="cursor-pointer max-h-40 overflow-auto bg-white rounded-md shadow border">
                                {locations.map((location: Location, index: number) => (
                                    <button type="button" key={index} 
                                        className="bg-orange-100 hover:bg-emerald-100 mb-1 p-2 
                                        text-sm w-full"
                                        onClick={() => {
                                            setSelectedLocation(location);
                                            setNewCity(location.name);
                                            setLocations([]);
                                        }}
                                    >
                                        {[location.name, location.country, location.admin1, location.admin2, location.admin3].filter(Boolean).join(", ")}
                                    </button>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="flex justify-between gap-4 mt-4">
                        <button className="bg-emerald-600 text-amber-200 font-bold p-2 rounded-full hover:bg-emerald-700 transition-colors duration-300 text-sm w-full md:w-auto px-4 cursor-pointer"
                        onClick={changeUserLocation}>Save Location</button>
                        <button className="bg-slate-500 text-amber-200 font-bold p-2 rounded-full hover:bg-slate-600 transition-colors duration-300 text-sm w-full md:w-auto px-4 cursor-pointer"
                        onClick={() => {
                            setSelectedLocation(null);
                            setIsChangingLocation(false);
                            setLocations([]);
                        }}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="flex justify-between gap-4">
                <div className="bg-cyan-100 text-center p-2 rounded-lg">
                    <h3 className="text-lg font-bold">Last Spring Frost:</h3>
                    <p>{springFrostDate}</p>
                </div>
                <div className="bg-cyan-100 text-center p-2 rounded-lg">
                    <h3 className="text-lg font-bold">First Autumn Frost:</h3>
                    <p>{autumnFrostDate}</p>
                </div>
            </div>
        </div>
    );
}

export default Weather;