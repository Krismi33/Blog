// Initialisation de la carte (centrée sur la France par défaut, mais sans ville sélectionnée)
const map = L.map('map').setView([46.603354, 1.888334], 6); // Centre de la France
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Marqueur personnalisé (non placé au démarrage)
const customIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});
let marker = null;

// Variables globales
let currentLat = null;
let currentLon = null;
let currentCity = null;

// Fonction pour obtenir les données météo
async function fetchWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,wind_speed_10m,wind_direction_10m,uv_index&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des données météo:", error);
        return null;
    }
}

// Fonction pour obtenir le nom de la ville
async function fetchCityName(lat, lon) {
    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`
        );
        const data = await response.json();
        return data.locality || data.city || "Lieu inconnu";
    } catch (error) {
        console.error("Erreur lors de la récupération du nom de la ville:", error);
        return "Lieu inconnu";
    }
}

// Fonction pour mettre à jour l'interface
function updateUI(weatherData, city) {
    // Mise à jour du nom de la ville
    document.getElementById('location').textContent = `${city}`;

    // Mise à jour des données actuelles
    const current = weatherData.current;
    document.getElementById('temp').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('feels-like').textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(current.wind_speed_10m * 3.6)} km/h`;
    document.getElementById('wind-dir').textContent = `${getWindDirection(current.wind_direction_10m)}`;
    document.getElementById('uv-index').textContent = `${getUVIndex(current.uv_index)}`;
    document.getElementById('precipitation').textContent = `${current.precipitation || 0} mm`;
    document.getElementById('snow').textContent = `${current.snow_depth || 0} cm`;
    document.getElementById('sunrise').textContent = `${weatherData.daily.sunrise[0].split('T')[1].substring(0, 5)}`;
    document.getElementById('sunset').textContent = `${weatherData.daily.sunset[0].split('T')[1].substring(0, 5)}`;

    // Mise à jour de l'icône météo
    const weatherCode = getWeatherCode(current);
    document.getElementById('weather-icon').textContent = weatherCode.icon;
    document.getElementById('weather-desc').textContent = weatherCode.desc;

    // Mise à jour des prévisions
    updateForecast(weatherData);

    // Mise à jour de l'animation météo
    updateWeatherAnimation(weatherCode.type);
}

// Fonction pour obtenir la direction du vent
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Fonction pour obtenir l'indice UV
function getUVIndex(index) {
    if (index <= 2) return "Faible";
    if (index <= 5) return "Modéré";
    if (index <= 7) return "Élevé";
    if (index <= 10) return "Très élevé";
    return "Extrême";
}

// Fonction pour obtenir le code météo
function getWeatherCode(current) {
    if (current.snowfall > 0) return { icon: '❄️', desc: 'Neige', type: 'snow' };
    if (current.showers > 0) return { icon: '⛈️', desc: 'Averses', type: 'rain' };
    if (current.rain > 0) return { icon: '🌧️', desc: 'Pluie', type: 'rain' };
    if (current.precipitation_probability > 70) return { icon: '☔', desc: 'Risque de pluie', type: 'rain' };
    if (current.uv_index > 7) return { icon: '☀️', desc: 'Ensoleillé', type: 'sun' };
    if (current.uv_index > 4) return { icon: '⛅', desc: 'Partiellement nuageux', type: 'sun' };
    if (current.relative_humidity_2m > 80) return { icon: '🌫️', desc: 'Brouillard', type: 'fog' };
    return { icon: '☁️', desc: 'Nuageux', type: 'cloud' };
}

// Fonction pour mettre à jour les prévisions
function updateForecast(weatherData) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(weatherData.daily.time[i]);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        const day = date.getDate();
        const month = date.toLocaleDateString('fr-FR', { month: 'short' });

        const tempMax = Math.round(weatherData.daily.temperature_2m_max[i]);
        const tempMin = Math.round(weatherData.daily.temperature_2m_min[i]);

        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <h3>${dayName} ${day} ${month}</h3>
            <div class="forecast-icon">☁️</div>
            <div class="forecast-temp">${tempMin}° / ${tempMax}°</div>
        `;
        forecastContainer.appendChild(forecastDay);
    }
}

// Fonction pour mettre à jour l'animation météo
function updateWeatherAnimation(type) {
    const animationContainer = document.getElementById('weather-animation');
    animationContainer.innerHTML = '';

    if (type === 'rain') {
        for (let i = 0; i < 50; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            animationContainer.appendChild(drop);
        }
    } else if (type === 'snow') {
        for (let i = 0; i < 30; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.animationDuration = `${2 + Math.random() * 3}s`;
            flake.style.animationDelay = `${Math.random() * 3}s`;
            animationContainer.appendChild(flake);
        }
    } else if (type === 'sun') {
        const sun = document.createElement('div');
        sun.className = 'sun';
        sun.style.top = '20%';
        sun.style.left = '80%';
        animationContainer.appendChild(sun);
    }
}

// Ajout du marqueur au clic sur la carte
map.on('click', async (e) => {
    // Supprime l'ancien marqueur s'il existe
    if (marker) {
        map.removeLayer(marker);
    }

    // Ajoute le nouveau marqueur
    currentLat = e.latlng.lat;
    currentLon = e.latlng.lng;
    marker = L.marker([currentLat, currentLon], { icon: customIcon, draggable: true }).addTo(map);

    // Récupère le nom de la ville et les données météo
    const city = await fetchCityName(currentLat, currentLon);
    const weatherData = await fetchWeather(currentLat, currentLon);

    if (weatherData && city) {
        currentCity = city;
        updateUI(weatherData, city);
    }

    // Gestion du drag du marqueur
    marker.on('dragend', async (e) => {
        currentLat = e.target._latlng.lat;
        currentLon = e.target._latlng.lng;
        map.setView([currentLat, currentLon], 10);

        const city = await fetchCityName(currentLat, currentLon);
        const weatherData = await fetchWeather(currentLat, currentLon);

        if (weatherData && city) {
            currentCity = city;
            updateUI(weatherData, city);
        }
    });
});