require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

//import dependencies
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const UV_KEY = process.env.OPENUV_API_KEY;

// render home
app.get('/', (req, res) => {
  res.render('index', { error: null });
});

// weather + uv results
app.get('/weather', async (req, res) => {
  const { location } = req.query;

  if (!location) {
    return res.render('index', { error: 'Please enter a location.' });
  }

  try {
    //conert city to lat/long
    const geoRes = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct`,
      { params: { q: location, limit: 1, appid: OWM_KEY } }
    );

    if (!geoRes.data.length) {
      return res.render('index', {
        error: `Could not find "${location}". Try a different city name.`
      });
    }

    // extract and display name from result
    const { lat, lon, name, country } = geoRes.data[0];

    // fetch current weather and diplay
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      { params: { lat, lon, appid: OWM_KEY, units: 'imperial' } }
    );

    const weather = weatherRes.data;

    // fech uv index
    let uvData = null;
    try {
      const uvRes = await axios.get(
        `https://api.openuv.io/api/v1/uv`,
        {
          params: { lat, lng: lon },
          headers: { 'x-access-token': UV_KEY }
        }
      );
      uvData = uvRes.data.result;
    } catch (uvErr) {
      console.warn('OpenUV request failed:', uvErr.message);
      //if uv false jsut show weather
    }

    // render and combine
    res.render('result', {
      city: `${name}, ${country}`,
      weather,
      uv: uvData,
      error: null
    });

  } catch (err) {
    console.error(err.message);
    res.render('index', {
      error: 'Something went wrong fetching the data. Please try again.'
    });
  }
});

//start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));