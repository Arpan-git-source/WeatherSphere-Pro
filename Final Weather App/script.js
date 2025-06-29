// DOM Elements
const unitToggle = document.getElementById('unitToggle');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = document.getElementById('darkModeIcon');
const tempValue = document.getElementById('tempValue');
const unitC = document.getElementById('unitC');
const unitF = document.getElementById('unitF');
const feelsLike = document.getElementById('feelsLike');
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecastBody = document.getElementById('dailyForecastBody');
const moonIcon = document.getElementById('moonIcon');
const searchInput = document.getElementById('searchInput');
const locationBtn = document.getElementById('locationBtn');
const locationElement = document.getElementById('location');
const currentDateElement = document.getElementById('currentDate');
const weatherCondition = document.getElementById('weatherCondition');
const weatherIcon = document.getElementById('weatherIcon');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const precip = document.getElementById('precip');
const visibility = document.getElementById('visibility');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const moonrise = document.getElementById('moonrise');
const moonset = document.getElementById('moonset');
const moonPhase = document.getElementById('moonPhase');
const uvIndex = document.getElementById('uvIndex');
const pressure = document.getElementById('pressure');
const windDirection = document.getElementById('windDirection');
const tipsList = document.getElementById('tipsList');
const errorMessage = document.getElementById('errorMessage');

// State
let isCelsius = true;
let isDarkMode = false;
let currentWeatherData = null;
let forecastData = null;

// API Key (Replace with your actual API key)
const API_KEY = "5ef5aa5e81e359dbbd3f4b44e34970eb";

// Initialize the app
function initApp() {
    checkDarkModePreference();
    setupEventListeners();

    // Get user's location or default to London
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherData(latitude, longitude);
            },
            error => {
                console.error("Geolocation error:", error);
                fetchWeatherData(51.5074, -0.1278); // Default to London
            }
        );
    } else {
        fetchWeatherData(51.5074, -0.1278); // Default to London
    }
}

function setupEventListeners() {
    // Unit toggle
    unitToggle.addEventListener('click', toggleTemperatureUnit);
    unitC.addEventListener('click', () => {
        if (!isCelsius) {
            isCelsius = true;
            updateWeatherDisplay();
        }
    });
    unitF.addEventListener('click', () => {
        if (isCelsius) {
            isCelsius = false;
            updateWeatherDisplay();
        }
    });

    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Location button
    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...';
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherData(latitude, longitude);
                    locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> My Location';
                },
                error => {
                    console.error("Geolocation error:", error);
                    showError("Unable to get your location. Please try again.");
                    locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> My Location';
                }
            );
        } else {
            showError("Geolocation is not supported by your browser.");
        }
    });

    // Search functionality
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const location = searchInput.value.trim();
            if (location) {
                searchWeather(location);
            }
        }
    });

    // Graph tabs
    const graphTabs = document.querySelectorAll('.graph-tab');
    graphTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.dataset.type;
            switchGraphTab(type);
        });
    });
}

function checkDarkModePreference() {
    // Check for saved dark mode preference or use system preference
    const savedMode = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedMode !== null) {
        isDarkMode = savedMode === 'true';
    } else {
        isDarkMode = systemPrefersDark;
    }

    applyDarkMode();
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyDarkMode();
}

function applyDarkMode() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeIcon.className = 'fas fa-sun';
        darkModeToggle.title = 'Switch to Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeIcon.className = 'fas fa-moon';
        darkModeToggle.title = 'Switch to Dark Mode';
    }
}

function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    updateWeatherDisplay();
}

function updateWeatherDisplay() {
    if (!currentWeatherData || !forecastData) return;

    // Update current temperature
    const temp = isCelsius ? currentWeatherData.main.temp : celsiusToFahrenheit(currentWeatherData.main.temp);
    tempValue.textContent = Math.round(temp);

    // Update feels like temperature
    const feelsLikeTemp = isCelsius ? currentWeatherData.main.feels_like : celsiusToFahrenheit(currentWeatherData.main.feels_like);
    feelsLike.textContent = `${Math.round(feelsLikeTemp)}°`;

    // Update unit buttons
    if (isCelsius) {
        unitC.classList.add('active');
        unitF.classList.remove('active');
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        unitC.classList.remove('active');
        unitF.classList.add('active');
        celsiusBtn.classList.remove('active');
        fahrenheitBtn.classList.add('active');
    }

    // Update hourly forecast
    updateHourlyForecast();

    // Update daily forecast
    updateDailyForecast();
}

function celsiusToFahrenheit(c) {
    return (c * 9 / 5) + 32;
}

function fetchWeatherData(lat, lon) {
    // Show loading state
    locationElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    // Fetch current weather
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            return response.json();
        })
        .then(data => {
            currentWeatherData = data;
            return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Forecast data not available');
            }
            return response.json();
        })
        .then(data => {
            forecastData = data;
            updateUI();
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            showError("Unable to fetch weather data. Please try again.");
            locationElement.innerHTML = '<i class="fas fa-map-marker-alt"></i> Weather Unavailable';
        });
}

function searchWeather(location) {
    // Show loading state
    locationElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';

    // First get coordinates for the location
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Location not found');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                throw new Error('Location not found');
            }
            const { lat, lon } = data[0];
            return fetchWeatherData(lat, lon);
        })
        .catch(error => {
            console.error('Error searching location:', error);
            showError("Location not found. Please try another search.");
            locationElement.innerHTML = '<i class="fas fa-map-marker-alt"></i> Search Failed';
        });
}

function updateUI() {
    if (!currentWeatherData || !forecastData) return;

    // Update location and date
    locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${currentWeatherData.name}, ${currentWeatherData.sys.country}`;

    const now = new Date();
    currentDateElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })}`;

    // Update current weather
    const weather = currentWeatherData.weather[0];
    weatherCondition.innerHTML = `<i class="fas fa-${getWeatherIcon(weather.id, currentWeatherData.dt, currentWeatherData.sys.sunrise, currentWeatherData.sys.sunset)}"></i> ${weather.description}`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

    // Update temperature
    const temp = isCelsius ? currentWeatherData.main.temp : celsiusToFahrenheit(currentWeatherData.main.temp);
    tempValue.textContent = Math.round(temp);

    // Update other weather details
    humidity.innerHTML = `<i class="fas fa-tint"></i> ${currentWeatherData.main.humidity}%`;
    wind.innerHTML = `<i class="fas fa-wind"></i> ${Math.round(currentWeatherData.wind.speed * 3.6)} km/h`;
    precip.innerHTML = `<i class="fas fa-cloud-rain"></i> ${forecastData.list[0].pop ? Math.round(forecastData.list[0].pop * 100) : 0}%`;
    visibility.innerHTML = `<i class="fas fa-eye"></i> ${currentWeatherData.visibility / 1000} km`;

    // Update astronomy data
    const sunriseTime = new Date(currentWeatherData.sys.sunrise * 1000);
    const sunsetTime = new Date(currentWeatherData.sys.sunset * 1000);
    sunrise.textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sunset.textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // For demo purposes, we'll simulate moon data
    const moonTimes = getMoonTimes(now);
    moonrise.textContent = moonTimes.rise;
    moonset.textContent = moonTimes.set;
    moonPhase.textContent = getMoonPhase(now);
    moonIcon.className = `fas ${getMoonPhaseIcon(now)}`;

    // Update additional info
    uvIndex.textContent = currentWeatherData.uvi || '--';
    pressure.textContent = `${currentWeatherData.main.pressure} hPa`;
    windDirection.textContent = getWindDirection(currentWeatherData.wind.deg);

    // Update feels like temperature
    const feelsLikeTemp = isCelsius ? currentWeatherData.main.feels_like : celsiusToFahrenheit(currentWeatherData.main.feels_like);
    feelsLike.textContent = `${Math.round(feelsLikeTemp)}°`;

    // Update forecast data
    updateHourlyForecast();
    updateDailyForecast();

    // Update weather graphs
    updateWeatherGraphs();

    // Update lifestyle tips
    updateLifestyleTips(weather.id, Math.round(temp), currentWeatherData.main.humidity);
}

function updateHourlyForecast() {
    if (!forecastData) return;

    hourlyForecast.innerHTML = '';

    // Get the next 8 hours of forecast (3-hour intervals)
    const hourlyData = forecastData.list.slice(0, 8);

    hourlyData.forEach(item => {
        const time = new Date(item.dt * 1000);
        const hour = time.getHours();
        const temp = isCelsius ? item.main.temp : celsiusToFahrenheit(item.main.temp);
        const weather = item.weather[0];

        const hourItem = document.createElement('div');
        hourItem.className = 'hourly-item';
        hourItem.innerHTML = `
            <div class="hour">${hour}:00</div>
            <div class="hour-temp">${Math.round(temp)}°</div>
            <img src="https://openweathermap.org/img/wn/${weather.icon}.png" alt="${weather.description}" class="hour-icon">
        `;

        hourlyForecast.appendChild(hourItem);
    });
}

function updateDailyForecast() {
    if (!forecastData) return;

    dailyForecastBody.innerHTML = '';

    // Group forecast by day
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyForecasts = {};
    
    // Group forecasts by day
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyForecasts[dayKey]) {
            dailyForecasts[dayKey] = {
                date: date,
                temps: [],
                weather: [],
                icons: []
            };
        }
        
        dailyForecasts[dayKey].temps.push(item.main.temp);
        dailyForecasts[dayKey].weather.push(item.weather[0]);
        dailyForecasts[dayKey].icons.push(item.weather[0].icon);
    });

    // Get the next 7 days
    const forecastDays = Object.values(dailyForecasts).slice(0, 7);

    forecastDays.forEach(dayData => {
        const date = dayData.date;
        const dayName = days[date.getDay()];
        
        // Find max and min temps for the day
        const maxTemp = Math.max(...dayData.temps);
        const minTemp = Math.min(...dayData.temps);
        
        // Find most common weather condition for the day
        const weatherCounts = {};
        dayData.weather.forEach(w => {
            const key = w.description;
            weatherCounts[key] = (weatherCounts[key] || 0) + 1;
        });
        
        const mostCommonWeather = Object.entries(weatherCounts).reduce((a, b) => 
            a[1] > b[1] ? a : b
        )[0];
        
        // Find most common weather icon
        const iconCounts = {};
        dayData.icons.forEach(icon => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
        });
        
        const mostCommonIcon = Object.entries(iconCounts).reduce((a, b) => 
            a[1] > b[1] ? a : b
        )[0];
        
        // Get weather ID for icon selection
        const weatherId = dayData.weather.find(w => 
            w.description === mostCommonWeather
        ).id;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dayName}</td>
            <td class="daily-high">${
                isCelsius ? Math.round(maxTemp) : Math.round(celsiusToFahrenheit(maxTemp))
            }°</td>
            <td>${
                isCelsius ? Math.round(minTemp) : Math.round(celsiusToFahrenheit(minTemp))
            }°</td>
            <td><i class="fas fa-${
                getWeatherIcon(
                    weatherId, 
                    date.getTime() / 1000, 
                    currentWeatherData.sys.sunrise, 
                    currentWeatherData.sys.sunset
                )
            }"></i> ${mostCommonWeather}</td>
        `;

        dailyForecastBody.appendChild(row);
    });
}

function updateWeatherGraphs() {
    if (!forecastData) return;

    // Temperature graph
    const tempGraphValues = document.querySelector('#temperature-graph .graph-values');
    const tempGraphBars = document.querySelector('#temperature-graph .graph-bars');
    const tempGraphLabels = document.querySelector('#temperature-graph .graph-labels');

    tempGraphValues.innerHTML = '';
    tempGraphBars.innerHTML = '';
    tempGraphLabels.innerHTML = '';

    // Get data for the next 24 hours (8 data points)
    const hourlyData = forecastData.list.slice(0, 8);

    // Find min and max temps for scaling
    const temps = hourlyData.map(item => item.main.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp;

    hourlyData.forEach((item, index) => {
        const time = new Date(item.dt * 1000);
        const hour = time.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12; // Convert to 12-hour format
        const timeString = `${hour12}${ampm}`;
        const temp = item.main.temp;

        // Scale the temperature to fit the graph (0-100%)
        const scaledTemp = ((temp - minTemp) / tempRange) * 100;

        // Create value label
        const valueElement = document.createElement('div');
        valueElement.className = 'graph-value';
        valueElement.textContent = isCelsius ? Math.round(temp) : Math.round(celsiusToFahrenheit(temp));
        tempGraphValues.appendChild(valueElement);

        // Create bar
        const barElement = document.createElement('div');
        barElement.className = 'graph-bar';
        barElement.style.height = `${scaledTemp}%`;
        barElement.style.background = getTemperatureColor(temp);
        tempGraphBars.appendChild(barElement);

        // Create time label
        const labelElement = document.createElement('div');
        labelElement.className = 'graph-label';
        labelElement.textContent = timeString;
        tempGraphLabels.appendChild(labelElement);
    });

    // Precipitation graph
    const precipGraphValues = document.querySelector('#precipitation-graph .graph-values');
    const precipGraphBars = document.querySelector('#precipitation-graph .graph-bars');
    const precipGraphLabels = document.querySelector('#precipitation-graph .graph-labels');

    precipGraphValues.innerHTML = '';
    precipGraphBars.innerHTML = '';
    precipGraphLabels.innerHTML = '';

    hourlyData.forEach((item, index) => {
        const time = new Date(item.dt * 1000);
        const hour = time.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const timeString = `${hour12}${ampm}`;
        const pop = item.pop ? item.pop * 100 : 0; // Probability of precipitation

        // Create value label
        const valueElement = document.createElement('div');
        valueElement.className = 'graph-value';
        valueElement.textContent = `${Math.round(pop)}%`;
        precipGraphValues.appendChild(valueElement);

        // Create bar
        const barElement = document.createElement('div');
        barElement.className = 'graph-bar';
        barElement.style.height = `${pop}%`;
        barElement.style.background = 'var(--primary-color)';
        precipGraphBars.appendChild(barElement);

        // Create time label
        const labelElement = document.createElement('div');
        labelElement.className = 'graph-label';
        labelElement.textContent = timeString;
        precipGraphLabels.appendChild(labelElement);
    });

    // Wind graph
    const windGraphValues = document.querySelector('#wind-graph .graph-values');
    const windGraphBars = document.querySelector('#wind-graph .graph-bars');
    const windGraphLabels = document.querySelector('#wind-graph .graph-labels');

    windGraphValues.innerHTML = '';
    windGraphBars.innerHTML = '';
    windGraphLabels.innerHTML = '';

    // Find max wind speed for scaling
    const winds = hourlyData.map(item => item.wind.speed * 3.6); // Convert m/s to km/h
    const maxWind = Math.max(...winds);

    hourlyData.forEach((item, index) => {
        const time = new Date(item.dt * 1000);
        const hour = time.getHours();
        const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
        const hour12 = hour % 12 || 12;
        const timeString = `${hour12}${ampm}`;
        const windSpeed = item.wind.speed * 3.6; // Convert m/s to km/h

        // Scale the wind speed to fit the graph (0-100%)
        const scaledWind = (windSpeed / maxWind) * 100;

        // Create value label
        const valueElement = document.createElement('div');
        valueElement.className = 'graph-value';
        valueElement.textContent = `${Math.round(windSpeed)}`;
        windGraphValues.appendChild(valueElement);

        // Create bar
        const barElement = document.createElement('div');
        barElement.className = 'graph-bar';
        barElement.style.height = `${scaledWind}%`;
        barElement.style.background = 'var(--accent-color)';
        windGraphBars.appendChild(barElement);

        // Create time label
        const labelElement = document.createElement('div');
        labelElement.className = 'graph-label';
        labelElement.textContent = timeString;
        windGraphLabels.appendChild(labelElement);
    });
}

function switchGraphTab(type) {
    // Hide all graphs
    document.querySelectorAll('.graph').forEach(graph => {
        graph.classList.remove('active');
    });

    // Deactivate all tabs
    document.querySelectorAll('.graph-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected graph and activate its tab
    document.getElementById(`${type}-graph`).classList.add('active');
    document.querySelector(`.graph-tab[data-type="${type}"]`).classList.add('active');
}

function updateLifestyleTips(weatherId, temp, humidity) {
    const tips = [];

    // Temperature-based tips
    if (temp < 5) {
        tips.push("Very cold! Wear multiple layers, gloves, and a warm hat.");
    } else if (temp < 15) {
        tips.push("Chilly weather. A jacket or sweater would be good.");
    } else if (temp < 25) {
        tips.push("Pleasant temperatures. Light clothing recommended.");
    } else {
        tips.push("Hot weather. Stay hydrated and wear light, breathable clothing.");
    }

    // Weather condition tips
    if (weatherId >= 200 && weatherId < 300) {
        tips.push("Thunderstorm expected. Stay indoors if possible.");
    } else if (weatherId >= 300 && weatherId < 600) {
        tips.push("Rain expected. Carry an umbrella or wear a waterproof jacket.");
    } else if (weatherId >= 600 && weatherId < 700) {
        tips.push("Snow expected. Wear warm, waterproof boots.");
    } else if (weatherId === 800) {
        tips.push("Clear skies. Perfect for outdoor activities!");
    } else if (weatherId > 800) {
        tips.push("Cloudy skies. Might be a good day for indoor activities.");
    }

    // Humidity tips
    if (humidity > 70) {
        tips.push("High humidity. It might feel warmer than it actually is.");
    } else if (humidity < 30) {
        tips.push("Low humidity. Stay hydrated as moisture evaporates quickly.");
    }

    // UV index tips (if available)
    if (currentWeatherData.uvi >= 6) {
        tips.push("High UV index. Wear sunscreen and protect your skin.");
    }

    // Update tips list
    tipsList.innerHTML = '';
    tips.forEach(tip => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-lightbulb"></i> ${tip}`;
        tipsList.appendChild(li);
    });
}

function getWeatherIcon(weatherId, currentTime, sunrise, sunset) {
    // Convert Unix timestamps to JavaScript Date objects
    const currentDate = new Date(currentTime * 1000);
    const sunriseDate = new Date(sunrise * 1000);
    const sunsetDate = new Date(sunset * 1000);

    const isDaytime = currentDate > sunriseDate && currentDate < sunsetDate;

    // Thunderstorm
    if (weatherId >= 200 && weatherId < 300) {
        return 'bolt';
    }
    // Drizzle
    else if (weatherId >= 300 && weatherId < 400) {
        return 'cloud-rain';
    }
    // Rain
    else if (weatherId >= 500 && weatherId < 600) {
        return isDaytime ? 'cloud-sun-rain' : 'cloud-moon-rain';
    }
    // Snow
    else if (weatherId >= 600 && weatherId < 700) {
        return 'snowflake';
    }
    // Atmosphere (fog, mist, etc.)
    else if (weatherId >= 700 && weatherId < 800) {
        return 'smog';
    }
    // Clear
    else if (weatherId === 800) {
        return isDaytime ? 'sun' : 'moon';
    }
    // Clouds
    else if (weatherId > 800) {
        if (weatherId === 801) {
            return isDaytime ? 'cloud-sun' : 'cloud-moon';
        } else if (weatherId === 802) {
            return 'cloud';
        } else {
            return 'clouds';
        }
    }

    // Default icon
    return 'cloud';
}

function getTemperatureColor(temp) {
    if (temp <= 0) {
        return '#4cc9f0'; // Very cold - light blue
    } else if (temp <= 10) {
        return '#4895ef'; // Cold - blue
    } else if (temp <= 20) {
        return '#4361ee'; // Cool - purple-blue
    } else if (temp <= 30) {
        return '#f72585'; // Warm - pink
    } else {
        return '#b5179e'; // Hot - purple
    }
}

function getWindDirection(degrees) {
    if (degrees >= 337.5 || degrees < 22.5) return 'N';
    if (degrees >= 22.5 && degrees < 67.5) return 'NE';
    if (degrees >= 67.5 && degrees < 112.5) return 'E';
    if (degrees >= 112.5 && degrees < 157.5) return 'SE';
    if (degrees >= 157.5 && degrees < 202.5) return 'S';
    if (degrees >= 202.5 && degrees < 247.5) return 'SW';
    if (degrees >= 247.5 && degrees < 292.5) return 'W';
    if (degrees >= 292.5 && degrees < 337.5) return 'NW';
    return '--';
}

function getMoonTimes(date) {
    // Simplified moon times for demo
    // In a real app, you would calculate these based on location and date
    const hour = date.getHours();

    // These are just approximations for demo
    return {
        rise: hour < 12 ? '06:45 AM' : '07:30 PM',
        set: hour < 12 ? '08:15 PM' : '08:45 AM'
    };
}

function getMoonPhase(date) {
    // Simplified moon phase calculation for demo
    const day = date.getDate();
    const phases = [
        'New Moon',
        'Waxing Crescent',
        'First Quarter',
        'Waxing Gibbous',
        'Full Moon',
        'Waning Gibbous',
        'Last Quarter',
        'Waning Crescent'
    ];

    const phaseIndex = Math.floor((day % 29.53) / (29.53 / 8));
    return phases[phaseIndex];
}

function getMoonPhaseIcon(date) {
    // Simplified moon phase icons for demo
    const day = date.getDate();
    const phaseIndex = Math.floor((day % 29.53) / (29.53 / 8));

    const icons = [
        'fa-moon', // New Moon
        'fa-moon', // Waxing Crescent
        'fa-moon', // First Quarter
        'fa-moon', // Waxing Gibbous
        'fa-moon', // Full Moon
        'fa-moon', // Waning Gibbous
        'fa-moon', // Last Quarter
        'fa-moon'  // Waning Crescent
    ];

    return icons[phaseIndex];
}

function showError(message) {
    errorMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    errorMessage.classList.add('show');

    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);