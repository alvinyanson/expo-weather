const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

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
          hourly: 'precipitation_probability',
          forecast_hours: 2,
        },
      });

      // precipitation_probability is an array: index 0 is current hour, index 1 is next hour
      const nextHourRainProb = weatherResponse.data?.hourly?.precipitation_probability?.[1] || 0;

      // 2. Force send push notification for testing (normally: nextHourRainProb >= 30)
      await axios.post('https://exp.host/--/api/v2/push/send', {
        to: pushToken,
        title: 'Rain Alert (Test) 🌧️',
        body: `This is a test notification. Next hour rain probability is ${nextHourRainProb}%.`,
        sound: 'default',
      });
      console.log(`Sent test rain alert to user ${doc.id}`);
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
