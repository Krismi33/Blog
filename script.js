document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const cityName = document.getElementById('city-name');
    const temperature = document.getElementById('temperature');
    const weatherDescription = document.getElementById('weather-description');
    const wind = document.getElementById('wind');
    const humidity = document.getElementById('humidity');
    const weatherIcon = document.getElementById('weather-icon');

    // Fonction pour obtenir les coordonnées d'une ville (simplifiée)
    async function getCoordinates(city) {
        const apiKey = 'TON_API_KEY'; // Remplace par une clé API gratuite (ex: OpenCage, Nominatim)
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return {
                latitude: data.results[0].latitude,
                longitude: data.results[0].longitude
            };
        }
        throw new Error("Ville non trouvée");
    }

    // Fonction pour obtenir la météo
    async function fetchWeather(latitude, longitude) {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        );
        const data = await response.json();
        return data.current_weather;
    }

    // Mettre à jour l'interface
    function updateWeatherUI(weather, city) {
        cityName.textContent = city;
        temperature.textContent = `${Math.round(weather.temperature)}°C`;
        weatherDescription.textContent = getWeatherDescription(weather.weathercode);
        wind.textContent = `Vent: ${weather.windspeed} km/h`;
        humidity.textContent = `Humidité: ${Math.round(Math.random() * 100)}%`; // Exemple aléatoire
        weatherIcon.className = `wi ${getWeatherIcon(weather.weathercode)}`;
    }

    // Description météo en fonction du code
    function getWeatherDescription(code) {
        const descriptions = {
            0: "Ciel dégagé",
            1: "Principalement dégagé",
            2: "Partiellement nuageux",
            3: "Nuageux",
            45: "Brouillard",
            48: "Brouillard givrant",
            51: "Bruine légère",
            53: "Bruine modérée",
            55: "Bruine dense",
            61: "Pluie légère",
            63: "Pluie modérée",
            65: "Pluie forte",
            71: "Chute de neige légère",
            73: "Chute de neige modérée",
            75: "Chute de neige forte",
            80: "Averses légères",
            81: "Averses modérées",
            82: "Averses violentes",
            95: "Orage",
            96: "Orage avec grêle légère",
            99: "Orage avec grêle forte"
        };
        return descriptions[code] || "Météo inconnue";
    }

    // Icône météo en fonction du code
    function getWeatherIcon(code) {
        const icons = {
            0: "wi-day-sunny",
            1: "wi-day-sunny-overcast",
            2: "wi-day-cloudy",
            3: "wi-cloudy",
            45: "wi-fog",
            48: "wi-fog",
            51: "wi-sprinkle",
            53: "wi-sprinkle",
            55: "wi-rain",
            61: "wi-rain",
            63: "wi-rain",
            65: "wi-rain-wind",
            71: "wi-snow",
            73: "wi-snow",
            75: "wi-snow-wind",
            80: "wi-showers",
            81: "wi-showers",
            82: "wi-thunderstorm",
            95: "wi-thunderstorm",
            96: "wi-hail",
            99: "wi-hail"
        };
        return icons[code] || "wi-day-cloudy";
    }

    // Rechercher la météo
    async function searchWeather() {
        const city = cityInput.value.trim();
        if (!city) return;

        try {
            const coords = await getCoordinates(city);
            const weather = await fetchWeather(coords.latitude, coords.longitude);
            updateWeatherUI(weather, city);
        } catch (error) {
            alert("Ville non trouvée ou erreur de connexion.");
        }
    }

    // Événements
    searchBtn.addEventListener('click', searchWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });

    // Charger la météo par défaut (Paris)
    searchWeather();
});