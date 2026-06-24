// Initialisation de la carte
const map = L.map('map').setView([48.8566, 2.3522], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker = null;
let currentCity = "Paris";
let currentLat = 48.8566;
let currentLon = 2.3522;

// Fonction pour mettre à jour la météo
async function updateWeather(lat, lon, city) {
    currentLat = lat;
    currentLon = lon;
    currentCity = city;

    // Mise à jour de la carte
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${city}</b><br>Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`)
        .openPopup();
    map.setView([lat, lon], 10);

    // Appel API Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,snow_depth_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=7`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayCurrentWeather(data.current, data.daily, city);
        displayForecast(data.daily);
    } catch (error) {
        document.getElementById('current-weather-grid').innerHTML = `<div class="loading">❌ Erreur de chargement</div>`;
        document.getElementById('forecast-grid').innerHTML = `<div class="loading">❌ Erreur de chargement</div>`;
    }
}

// Affichage de la météo actuelle
function displayCurrentWeather(current, daily, city) {
    const grid = document.getElementById('current-weather-grid');
    const now = new Date();
    const isDay = now.getHours() >= 6 && now.getHours() < 18;

    // Icône météo principale
    const weatherCode = daily.weather_code[0];
    const weatherIcon = getWeatherIcon(weatherCode, isDay);

    // Données à afficher
    const weatherData = [
        { emoji: "🌡️", label: "Température", value: `${Math.round(current.temperature_2m)}°C`, unit: "" },
        { emoji: "💧", label: "Humidité", value: `${current.relative_humidity_2m}%`, unit: "" },
        { emoji: "🌫️", label: "Point de rosée", value: `${Math.round(current.dew_point_2m)}°C`, unit: "" },
        { emoji: "🥵", label: "Ressentie", value: `${Math.round(current.apparent_temperature)}°C`, unit: "" },
        { emoji: "☔", label: "Probabilité pluie", value: `${current.precipitation_probability}%`, unit: "" },
        { emoji: "🌧️", label: "Précipitations", value: `${current.precipitation || 0}`, unit: "mm" },
        { emoji: "🌦️", label: "Pluie", value: `${current.rain || 0}`, unit: "mm" },
        { emoji: "⛈️", label: "Averses", value: `${current.showers || 0}`, unit: "mm" },
        { emoji: "❄️", label: "Neige", value: `${current.snowfall || 0}`, unit: "cm" },
        { emoji: "🏔️", label: "Neige au sol", value: `${current.snow_depth || 0}`, unit: "cm" },
        { emoji: "🌬️", label: "Vent", value: `${Math.round(current.wind_speed_10m)}`, unit: "km/h" },
        { emoji: "🧭", label: "Direction vent", value: `${Math.round(current.wind_direction_10m)}°`, unit: "" },
        { emoji: getUVIcon(current.uv_index), label: "Indice UV", value: `${current.uv_index}`, unit: "" },
        { emoji: "🌅", label: "Lever soleil", value: new Date(daily.sunrise[0]).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), unit: "" },
        { emoji: "🌇", label: "Coucher soleil", value: new Date(daily.sunset[0]).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), unit: "" }
    ];

    // Génération des cartes
    grid.innerHTML = `
        <div class="weather-card" style="grid-column: 1 / -1; background: rgba(74, 144, 226, 0.3);">
            <div class="weather-icon">${weatherIcon}</div>
            <div class="value" style="font-size: 2.5rem;">${city}</div>
            <div class="label" style="font-size: 1.2rem;">${getWeatherDescription(weatherCode, isDay)}</div>
        </div>
        ${weatherData.map(item => `
            <div class="weather-card">
                <div class="emoji">${item.emoji}</div>
                <div class="value">${item.value}</div>
                <div class="label">${item.label}</div>
            </div>
        `).join('')}
    `;

    // Ajout des animations
    if (weatherCode >= 61 && weatherCode <= 65) {
        addAnimation('rain');
    } else if (weatherCode >= 71 && weatherCode <= 77) {
        addAnimation('snow');
    }
}

// Affichage des prévisions
function displayForecast(daily) {
    const grid = document.getElementById('forecast-grid');
    let html = '';
    for (let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' }).slice(0, 3);
        const weatherCode = daily.weather_code[i];
        const isDay = true;
        const weatherIcon = getWeatherIcon(weatherCode, isDay);

        html += `
            <div class="forecast-card">
                <div class="day">${dayName}</div>
                <div class="emoji">${weatherIcon}</div>
                <div class="temp">
                    ${Math.round(daily.temperature_2m_min[i])}° / ${Math.round(daily.temperature_2m_max[i])}°
                </div>
                <div style="font-size: 0.9rem; margin-top: 5px;">
                    ${getWeatherDescription(weatherCode, isDay)}
                </div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

// Fonction pour obtenir l'icône météo
function getWeatherIcon(code, isDay) {
    const icons = {
        0: isDay ? '☀️' : '🌙',
        1: isDay ? '⛅' : '🌤️',
        2: isDay ? '⛅' : '🌤️',
        3: '☁️',
        45: '🌫️',
        48: '🌫️',
        51: '🌧️',
        53: '🌧️',
        55: '🌧️',
        56: '🌧️',
        57: '🌧️',
        61: '🌧️',
        63: '🌧️',
        65: '🌧️',
        66: '❄️',
        67: '❄️',
        71: '❄️',
        73: '❄️',
        75: '❄️',
        77: '❄️',
        80: '🌧️',
        81: '🌧️',
        82: '🌧️',
        85: '❄️',
        86: '❄️',
        95: '⛈️',
        96: '⛈️',
        99: '⛈️'
    };
    return icons[code] || '🌦️';
}

// Fonction pour obtenir la description météo
function getWeatherDescription(code, isDay) {
    const descriptions = {
        0: isDay ? 'Ciel dégagé' : 'Ciel dégagé',
        1: isDay ? 'Principalement dégagé' : 'Principalement dégagé',
        2: isDay ? 'Partiellement nuageux' : 'Partiellement nuageux',
        3: 'Nuageux',
        45: 'Brouillard',
        48: 'Brouillard givrant',
        51: 'Bruine légère',
        53: 'Bruine modérée',
        55: 'Bruine dense',
        56: 'Bruine verglaçante légère',
        57: 'Bruine verglaçante dense',
        61: 'Pluie légère',
        63: 'Pluie modérée',
        65: 'Pluie forte',
        66: 'Pluie verglaçante légère',
        67: 'Pluie verglaçante forte',
        71: 'Chute de neige légère',
        73: 'Chute de neige modérée',
        75: 'Chute de neige forte',
        77: 'Grains de neige',
        80: 'Averses de pluie légères',
        81: 'Averses de pluie modérées',
        82: 'Averses de pluie violentes',
        85: 'Averses de neige légères',
        86: 'Averses de neige fortes',
        95: 'Orage léger',
        96: 'Orage avec grêle légère',
        99: 'Orage avec grêle forte'
    };
    return descriptions[code] || 'Météo variable';
}

// Fonction pour obtenir l'icône UV
function getUVIcon(index) {
    if (index < 3) return '🟢';
    if (index < 6) return '🟡';
    if (index < 8) return '🟠';
    if (index < 11) return '🔴';
    return '🟣';
}

// Ajout d'animations
function addAnimation(type) {
    const icon = document.querySelector('.weather-icon');
    icon.innerHTML = '';
    if (type === 'rain') {
        for (let i = 0; i < 5; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${i * 20}px`;
            drop.style.animationDelay = `${i * 0.2}s`;
            drop.textContent = '💧';
            icon.appendChild(drop);
        }
    } else if (type === 'snow') {
        for (let i = 0; i < 5; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.style.left = `${i * 20}px`;
            flake.style.animationDelay = `${i * 0.2}s`;
            flake.textContent = '❄️';
            icon.appendChild(flake);
        }
    }
}

// Recherche par ville
async function searchCity() {
    const city = document.getElementById('city-input').value.trim();
    if (!city) return;

    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=fr`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name } = data.results[0];
            updateWeather(latitude, longitude, name);
        } else {
            alert("❌ Ville non trouvée !");
        }
    } catch (error) {
        alert("❌ Erreur de recherche !");
    }
}

// Géolocalisation
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                updateWeather(position.coords.latitude, position.coords.longitude, "Ma position");
            },
            error => {
                alert("❌ Impossible de récupérer votre position !");
            }
        );
    } else {
        alert("❌ La géolocalisation n'est pas supportée par votre navigateur !");
    }
}

// Chargement initial (Paris)
window.onload = () => {
    updateWeather(48.8566, 2.3522, "Paris");
};