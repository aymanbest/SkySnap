import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { geocode } from 'opencage-api-client';




const openWeatherMapApiKey = process.env.REACT_APP_OPENWEATHERMAP_API_KEY;
const openCageApiKey = process.env.REACT_APP_OPENCAGE_API_KEY;
const userSKY = process.env.REACT_APP_USERNAME;




const App = () => {
  const [position, setPosition] = useState({ lat: 0, lon: 0 });
  const [weather, setWeather] = useState('');
  const [code, setCode] = useState(0);
  const [temp, setTemp] = useState({ kelvin: 0.0, degrees: 0.0, unit: 'ºC' });
  const [cityName, setCityName] = useState('');
  const [country, setCountry] = useState('');
  const [show, setShow] = useState(true);
  const [display, setDisplay] = useState('content');
  const [tempSwitchAnimation, setTempSwitchAnimation] = useState('');
  const [customLocation, setCustomLocation] = useState({ city: '', country: '' });
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);


  useEffect(() => {
    const success = (position) => {
      setPosition({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
      getWeather(position.coords.latitude, position.coords.longitude);
    };

    const error = (e) => {
      if (e.code === 1) console.error('PERMISSION DENIED');
      if (e.code === 2) console.error('POSITION UNAVAILABLE');
      if (e.code === 3) console.error('TIME OUT');
      if (e.code === 0) console.error('UNKNOWN ERROR');

      axios
        .get('https://ipapi.co/json')
        .then((results) => {
          setPosition({
            lat: results.data.latitude,
            lon: results.data.longitude,
          });
          getWeather(results.data.latitude, results.data.longitude);
        })
        .catch((err) => console.error(err))
        .finally(() => setShow(false));
    };

    const OPTIONS = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(success, error, OPTIONS);
  }, []);

  const getWeather = async (latitude, longitude) => {
    try {
      const URL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherMapApiKey}`;

      const results = await axios.get(URL);
      setWeather(
        results.data.weather[0].main +
        ' (' +
        results.data.weather[0].description +
        ')'
      );
      setCode(results.data.weather[0].id);
      setTemp({
        kelvin: results.data.main.temp.toFixed(1),
        degrees: (results.data.main.temp - 273.15).toFixed(1),
        unit: 'ºC',
      });
      setCityName(results.data.name);
      setCountry(results.data.sys.country);
      setDisplay(display + ' rotate');
    } catch (err) {
      console.error(err);
    } finally {
      setShow(false);
    }
  };

  const handleCustomLocationChange = async (e) => {
    const { name, value } = e.target;
    setCustomLocation((prev) => ({ ...prev, [name]: value }));

    if (value.length >= 3) {
      try {
        const response = await axios.get(
          `https://secure.geonames.org/searchJSON?name_startsWith=${value}&maxRows=5&username=${userSKY}`
        );

        const suggestions = response.data.geonames.map((item) => ({
          city: item.name,
          country: item.countryName,
        }));

        setCitySuggestions(suggestions);
      } catch (error) {
        console.error(error);
      }
    } else {
      setCitySuggestions([]);
    }
  };


  const handleCustomLocationSubmit = async (e) => {
    e.preventDefault();
  
    const locationToUse = selectedSuggestion || customLocation;
  
    if (locationToUse.city && locationToUse.country) {
      try {
        const response = await geocode({
          q: `${locationToUse.city}, ${locationToUse.country}`,
          key: openCageApiKey,
        });
  
        const { results } = response;
  
        if (results && results.length > 0) {
          const { geometry } = results[0];
          const { lat, lng } = geometry;
          getWeather(lat, lng);
        } else {
          alert('Could not find coordinates for the specified location.');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      alert('Please enter both city and country.');
    }
  };
  

  const C2F = () => {
    if (temp.unit === 'ºC') {
      const celsius = (temp.kelvin * 9 / 5 - 459.67).toFixed(1);
      setTemp({
        kelvin: temp.kelvin,
        degrees: celsius,
        unit: 'ºF',
      });
      setTempSwitchAnimation(' animate-switch-f-to-c');
    } else {
      const fahrenheit = (temp.kelvin - 273.15).toFixed(1);
      setTemp({
        kelvin: temp.kelvin,
        degrees: fahrenheit,
        unit: 'ºC',
      });
      setTempSwitchAnimation(' animate-switch-c-to-f');
    }
  };

  const animateTemp = () => {
    return Number(temp.degrees).toFixed(1);
  };
  const classtmp = () => {
    return tempSwitchAnimation;
  };

  const weatherIcons = () => {
    if (code >= 200 && code <= 232) return 'wi wi-thunderstorm';
    else if (code >= 300 && code <= 321) return 'wi wi-rain-mix';
    else if (code >= 500 && code <= 531) return 'wi wi-rain';
    else if (code >= 600 && code <= 622) return 'wi wi-snowflake-cold';
    else if (code >= 701 && code <= 781) return 'wi wi-fog';
    else if (code >= 801 && code <= 804) return 'wi wi-cloudy';
    else if (code === 800) return 'wi wi-day-sunny';
  };

  const handleSuggestionClick = (suggestion) => {
    setCustomLocation({ city: suggestion.city, country: suggestion.country });
    setSelectedSuggestion(suggestion);
    setCitySuggestions([]);
  };
  

  return (
    <div className={display}>
      <div className="frontFace">
        <h1 style={{ display: show ? 'block' : 'none' }}>
          Trying to get your location...
        </h1>
      </div>
      <div className="backFace">
        <i className={weatherIcons()}></i>
        <h1>{weather}</h1>
        <h2 className={classtmp()}>{animateTemp() + temp.unit}</h2>
        <small className="neon-switch" onClick={C2F}>
          Deg. F <span>&harr;</span> Deg. C
        </small>

        <form className='custom-location-form' onSubmit={handleCustomLocationSubmit} autocomplete="off">
          <label>
            Enter Custom Location:
            <input
              type="text"
              placeholder="City"
              name="city"
              value={customLocation.city}
              onChange={handleCustomLocationChange}
            />
            <input
              type="text"
              placeholder="Country"
              name="country"
              value={customLocation.country}
              onChange={handleCustomLocationChange}
            />
          </label>
          {/* Display autocomplete suggestions */}
          {citySuggestions.length > 0 && (
            <ul>
              {citySuggestions.map((suggestion, index) => (
                <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion.city}, {suggestion.country}
                </li>
              ))}
            </ul>
          )}
          <button type="submit">Get Weather</button>
        </form>
        <h4>
          Location: <strong>{cityName}, {country}</strong>.
        </h4>
        <footer>
          <a href="https://github.com/aymanbest" className="link">
            Coded with <span className="love">&#9825;</span> by Ayman Faik
          </a>
        </footer>
      </div>
    </div>
  );
};

export default App;
