const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

function weatherCodeToCondition(code) {
  switch (code) {
    case 0:
      return 'Clear Sky ☀️';
    case 1:
    case 2:
    case 3:
      return 'Partly Cloudy ⛅';
    case 45:
    case 48:
      return 'Foggy 🌫️';
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return 'Light Drizzle 🌧️';
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return 'Rainy 🌧️';
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return 'Snowy ❄️';
    case 80:
    case 81:
    case 82:
      return 'Rain Showers 🌦️';
    case 95:
    case 96:
    case 99:
      return 'Thunderstorm ⛈️';
    default:
      return 'Cloudy ☁️';
  }
}

async function checkWeatherAndNotify() {
  const usersSnapshot = await db.collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const { pushToken, latitude, longitude } = userData;

    if (!pushToken || !latitude || !longitude) continue;

    try {
      // 1. Fetch next hour weather forecast from Open-Meteo
      const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude,
          longitude,
          hourly: 'precipitation_probability,temperature_2m,weather_code',
          forecast_hours: 2,
        },
      });

      const nextHourRainProb = weatherResponse.data?.hourly?.precipitation_probability?.[1] || 0;
      const nextHourTemp = Math.round(weatherResponse.data?.hourly?.temperature_2m?.[1] || 0);
      const nextHourCode = weatherResponse.data?.hourly?.weather_code?.[1] || 0;
      const nextHourCondition = weatherCodeToCondition(nextHourCode);

      let title, body;

      // 2. Decide notification text based on rain probability
      if (nextHourRainProb >= 30) {
        title = 'Rain Alert 🌧️';
        body = `It is likely to rain in the next hour (${nextHourRainProb}% chance). Expect ${nextHourTemp}°C and ${nextHourCondition}. Don't forget your umbrella!`;
      } else {
        title = 'Daily Weather Update ☀️';
        body = `Weather for the next hour: ${nextHourTemp}°C and ${nextHourCondition}. Rain probability: ${nextHourRainProb}%. Have a great day!`;
      }

      await axios.post('https://exp.host/--/api/v2/push/send', {
        to: pushToken,
        title,
        body,
        sound: 'default',
      });
      console.log(`Sent weather update to user ${doc.id}`);
    } catch (err) {
      console.error(`Failed to process user ${doc.id}:`, err.message);
    }
  }
}

checkWeatherAndNotify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
