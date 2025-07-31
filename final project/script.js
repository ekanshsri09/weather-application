const API_KEY = '124242d25402dc5ba3bfc678d7de979d';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM elements
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    weatherCard: document.getElementById('weatherCard'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('errorMessage')
};

// API calls
async function fetchWeather(city) {
    const response = await fetch(`${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Weather data unavailable');
    }
    const data = await response.json();

    return {
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
        pressure: Math.round(data.main.pressure),
        visibility: data.visibility ? (data.visibility / 1000) : 'N/A', // meters to km
        feelsLike: Math.round(data.main.feels_like)
    };
}

async function fetchForecast(city) {
    const response = await fetch(`${API_BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
    if (!response.ok) throw new Error('Forecast unavailable');
    const data = await response.json();

    // Group forecasts by date
    const daily = {};
    data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!daily[date]) {
            daily[date] = {
                minTemp: item.main.temp_min,
                maxTemp: item.main.temp_max,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            };
        } else {
            daily[date].minTemp = Math.min(daily[date].minTemp, item.main.temp_min);
            daily[date].maxTemp = Math.max(daily[date].maxTemp, item.main.temp_max);
        }
    });

    // Only next 5 days
    const forecast = Object.entries(daily).slice(0, 5).map(([date, info]) => ({
        date,
        maxTemp: Math.round(info.maxTemp),
        minTemp: Math.round(info.minTemp),
        icon: `https://openweathermap.org/img/wn/${info.icon}@2x.png`,
        description: info.description
    }));

    return { forecast };
}

async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    if (!response.ok) {
        throw new Error('Weather data unavailable');
    }
    const data = await response.json();

    return {
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        pressure: Math.round(data.main.pressure),
        visibility: data.visibility ? (data.visibility / 1000) : 'N/A',
        feelsLike: Math.round(data.main.feels_like)
    };
}

// Display functions (keep your existing ones)
function displayWeather(data) {
    document.getElementById('cityName').textContent = `${data.city}, ${data.country}`;
    document.getElementById('temp').textContent = `${data.temperature}°C`;
    document.getElementById('description').textContent = data.description;
    document.getElementById('weatherIcon').src = data.icon;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.windSpeed} km/h`;
    document.getElementById('pressure').textContent = `${data.pressure} hPa`;
    document.getElementById('visibility').textContent = `${data.visibility} km`;
    document.getElementById('feelsLike').textContent = `Feels like ${data.feelsLike}°C`;
    
    updateCurrentDate();
}

function displayForecast(data) {
    console.log('Forecast data:', data); // <-- Add this line
    const container = document.getElementById('forecastCards');
    container.innerHTML = data.forecast.map(f => `
        <div class="text-center p-4 bg-white bg-opacity-5 rounded-xl">
            <div class="text-sm text-white opacity-90 mb-2">
                ${new Date(f.date).toLocaleDateString('en-US', {weekday: 'short'})}
            </div>
            <img src="${f.icon}" alt="${f.description}" class="w-12 h-12 mx-auto mb-2">
            <div class="text-white font-bold">${f.maxTemp}°/${f.minTemp}°</div>
        </div>
    `).join('');
}

function updateCurrentDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
}

function showLoading() {
    elements.loading.classList.remove('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function showError(message) {
    elements.errorMessage.querySelector('p').textContent = message;
    elements.errorMessage.classList.remove('hidden');
    setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
    }, 5000);
}

async function getWeather(city) {
    try {
        showLoading();
        elements.errorMessage.classList.add('hidden');
        
        const [weather, forecast] = await Promise.all([
            fetchWeather(city),
            fetchForecast(city).catch(() => null)
        ]);
        
        displayWeather(weather);
        if (forecast) displayForecast(forecast);
        
    } catch (error) {
        console.error('Weather fetch error:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Event listeners
elements.searchBtn.addEventListener('click', () => {
    const city = elements.cityInput.value.trim();
    if (city) {
        getWeather(city);
        elements.cityInput.value = '';
    }
});

elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') elements.searchBtn.click();
});

// Initialize
getWeather('Allahabad'); // Default city
