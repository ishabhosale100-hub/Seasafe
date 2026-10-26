/**
 * SeaSafe — Maritime Risk & Offline Safety Application Logic
 * Pure Vanilla JavaScript — Zero External Dependencies
 * Enhanced with Open-Meteo Real-Time Weather API Integration
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DATA STATE & PRESETS
  // =========================================================================

  const STORAGE_KEYS = {
    VESSEL: 'seasafe_vessel_profile_v1',
    ASSESSMENT: 'seasafe_last_assessment_v1',
    ALERTS: 'seasafe_alerts_history_v1',
    SCENARIO: 'seasafe_active_scenario_v1',
    LIVE_WEATHER: 'seasafe_live_weather_v1',
    LAST_LOCATION: 'seasafe_last_location_v1'
  };

  // Weather Scenarios (Simulated Demo Data)
  const SCENARIOS = {
    calm: {
      id: 'calm',
      name: 'Calm Conditions',
      shortDesc: 'Gentle breeze, low swell, clear sea lanes',
      locationName: 'Simulated Coastal Waters (Calm Demo)',
      windSpeed: 8.0,
      windGust: 11.0,
      windDir: 'NE (045°)',
      windAngle: 45,
      beaufort: 'Force 3 • Gentle Breeze',
      waveHeight: 1.5,
      wavePeriod: 7.0,
      waveSteepness: 'Low (Long Swell)',
      waveState: 'Smooth Swell (Simulated Model)',
      visibility: 10.0,
      visibilityRating: 'Unlimited',
      visibilityNotes: 'Horizon visible with clear sea lane recognition. Fog signals and radar not required.',
      weatherSummary: 'Fair Skies',
      skyCondition: 'Scattered Clouds',
      barometer: 1018,
      baroTrend: 'Barometer is steady. Low risk of convective storm development.',
      airTemp: '68°F (20°C)',
      waterTemp: '62°F (17°C)',
      forecastTimestamp: '2026-10-26 22:00 UTC (Simulated Demo)',
      lastUpdated: 'Simulated Baseline',
      isLive: false,
      isWaveSimulated: true
    },
    rough: {
      id: 'rough',
      name: 'Rough Conditions',
      shortDesc: 'Near gale, steep wind waves, restricted visibility',
      locationName: 'Simulated Coastal Waters (Rough Demo)',
      windSpeed: 26.0,
      windGust: 34.0,
      windDir: 'ENE (070°)',
      windAngle: 70,
      beaufort: 'Force 6/7 • Near Gale',
      waveHeight: 6.8,
      wavePeriod: 4.2,
      waveSteepness: 'High (Steep Wind Waves)',
      waveState: 'Rough / Heavy Chop (Simulated Model)',
      visibility: 2.5,
      visibilityRating: 'Restricted (Rain/Spray)',
      visibilityNotes: 'Squall line active with heavy spray. Small craft advisories in effect. Radar and sound signals recommended.',
      weatherSummary: 'Squall & Gale Chop',
      skyCondition: 'Overcast Squall Line',
      barometer: 998,
      baroTrend: 'Barometer falling rapidly (-3 hPa/hr). High risk of violent gusts and sudden wind shifts.',
      airTemp: '59°F (15°C)',
      waterTemp: '61°F (16°C)',
      forecastTimestamp: '2026-10-26 22:15 UTC (Simulated Demo)',
      lastUpdated: 'Simulated Baseline',
      isLive: false,
      isWaveSimulated: true
    }
  };

  // Default Vessel Configuration
  const DEFAULT_VESSEL = {
    boatName: 'Sea Sprite II',
    vesselType: 'Center Console (18-24ft)',
    maxWind: 20.0,
    maxWave: 4.0,
    lastUpdated: new Date().toLocaleString()
  };

  // Default Location
  const DEFAULT_LOCATION = {
    name: 'Miami, Florida',
    lat: 25.77,
    lon: -80.19
  };

  // Application State
  const state = {
    vessel: loadVesselProfile(),
    activeScenarioKey: loadActiveScenarioKey(),
    liveWeather: loadLiveWeather(),
    activeLocation: loadLastLocation(),
    lastAssessment: loadLastAssessment(),
    alerts: loadAlerts(),
    isOnline: navigator.onLine,
    simulatedOfflineMode: false,
    isLoadingWeather: false,
    weatherError: null
  };

  // =========================================================================
  // 2. STORAGE HELPERS
  // =========================================================================

  function loadVesselProfile() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VESSEL);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read vessel profile from localStorage', e);
    }
    return { ...DEFAULT_VESSEL };
  }

  function saveVesselProfile(vessel) {
    state.vessel = vessel;
    try {
      localStorage.setItem(STORAGE_KEYS.VESSEL, JSON.stringify(vessel));
    } catch (e) {
      console.error('Error saving vessel profile', e);
    }
  }

  function loadActiveScenarioKey() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCENARIO);
      if (saved && (saved === 'live' || SCENARIOS[saved])) return saved;
    } catch (e) {
      console.warn(e);
    }
    return 'live'; // Default to live Open-Meteo weather
  }

  function saveActiveScenarioKey(key) {
    state.activeScenarioKey = key;
    try {
      localStorage.setItem(STORAGE_KEYS.SCENARIO, key);
    } catch (e) {
      console.error(e);
    }
  }

  function loadLiveWeather() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIVE_WEATHER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load cached live weather', e);
    }
    // Return sensible fallback initial live weather until fetched
    return {
      id: 'live',
      name: 'Live: Miami, Florida',
      locationName: 'Miami, Florida (25.77°N, 80.19°W)',
      lat: 25.77,
      lon: -80.19,
      windSpeed: 14.5,
      windGust: 18.0,
      windDir: 'ENE (065°)',
      windAngle: 65,
      beaufort: 'Force 4 • Moderate Breeze',
      waveHeight: 2.8,
      wavePeriod: 5.5,
      waveSteepness: 'Moderate Swell',
      waveState: 'Moderate Sea (Simulated Model)',
      visibility: 10.0,
      visibilityRating: 'Unlimited',
      visibilityNotes: 'Horizon clear. Standard navigation watch recommended.',
      weatherSummary: 'Partly Cloudy',
      skyCondition: 'Scattered Marine Cumulus',
      barometer: 1014,
      baroTrend: 'Barometer steady. Normal coastal pressure pattern.',
      airTemp: '75°F (24°C)',
      waterTemp: '72°F (22°C) est.',
      forecastTimestamp: 'Baseline (Connecting to Open-Meteo API...)',
      lastUpdated: 'Initial Cache',
      isLive: true,
      isWaveSimulated: true
    };
  }

  function saveLiveWeather(weatherData) {
    state.liveWeather = weatherData;
    try {
      localStorage.setItem(STORAGE_KEYS.LIVE_WEATHER, JSON.stringify(weatherData));
    } catch (e) {
      console.error('Error saving live weather', e);
    }
  }

  function loadLastLocation() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return { ...DEFAULT_LOCATION };
  }

  function saveLastLocation(loc) {
    state.activeLocation = loc;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_LOCATION, JSON.stringify(loc));
    } catch (e) {
      console.error(e);
    }
  }

  function loadLastAssessment() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASSESSMENT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return {
      savedTime: new Date().toLocaleString(),
      forecastTime: 'Initial Baseline',
      scenarioName: 'Live Coastal Weather',
      vesselName: DEFAULT_VESSEL.boatName,
      vesselType: DEFAULT_VESSEL.vesselType,
      windSpeed: 14.5,
      maxWind: DEFAULT_VESSEL.maxWind,
      waveHeight: 2.8,
      maxWave: DEFAULT_VESSEL.maxWave,
      isExceeded: false,
      statusText: 'SAFE OPERATING MARGIN',
      summary: 'Initial baseline snapshot. All conditions within configured operational limits.'
    };
  }

  function saveLastAssessment(assessment) {
    state.lastAssessment = assessment;
    try {
      localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(assessment));
    } catch (e) {
      console.error('Error saving assessment', e);
    }
  }

  function loadAlerts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  }

  function saveAlerts(alerts) {
    state.alerts = alerts;
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.error('Error saving alerts', e);
    }
  }

  // =========================================================================
  // 3. METEOROLOGY & WAVE MODEL CALCULATION HELPERS
  // =========================================================================

  function degreesToCardinal(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((deg % 360) / 22.5) % 16;
    return `${directions[index]} (${Math.round(deg).toString().padStart(3, '0')}°)`;
  }

  function getBeaufortScale(knots) {
    if (knots < 1) return { bft: 0, desc: 'Force 0 • Calm' };
    if (knots <= 3) return { bft: 1, desc: 'Force 1 • Light Air' };
    if (knots <= 6) return { bft: 2, desc: 'Force 2 • Light Breeze' };
    if (knots <= 10) return { bft: 3, desc: 'Force 3 • Gentle Breeze' };
    if (knots <= 16) return { bft: 4, desc: 'Force 4 • Moderate Breeze' };
    if (knots <= 21) return { bft: 5, desc: 'Force 5 • Fresh Breeze' };
    if (knots <= 27) return { bft: 6, desc: 'Force 6 • Strong Breeze' };
    if (knots <= 33) return { bft: 7, desc: 'Force 7 • Near Gale' };
    if (knots <= 40) return { bft: 8, desc: 'Force 8 • Gale' };
    if (knots <= 47) return { bft: 9, desc: 'Force 9 • Strong Gale' };
    return { bft: 10, desc: 'Force 10+ • Storm' };
  }

  function getWmoWeatherDescription(code) {
    const codes = {
      0: { summary: 'Clear Skies', sky: 'Clear & Sunny' },
      1: { summary: 'Mainly Clear', sky: 'Scattered High Clouds' },
      2: { summary: 'Partly Cloudy', sky: 'Partly Cloudy Skies' },
      3: { summary: 'Overcast', sky: 'Overcast Clouds' },
      45: { summary: 'Fog', sky: 'Dense Coastal Fog' },
      48: { summary: 'Depositing Fog', sky: 'Freezing Fog Bank' },
      51: { summary: 'Light Drizzle', sky: 'Light Mist / Drizzle' },
      53: { summary: 'Moderate Drizzle', sky: 'Moderate Drizzle' },
      55: { summary: 'Dense Drizzle', sky: 'Dense Coastal Drizzle' },
      61: { summary: 'Slight Rain', sky: 'Scattered Showers' },
      63: { summary: 'Moderate Rain', sky: 'Steady Rain' },
      65: { summary: 'Heavy Rain', sky: 'Heavy Downpour' },
      71: { summary: 'Slight Snow', sky: 'Light Flurries' },
      80: { summary: 'Rain Showers', sky: 'Passing Coastal Showers' },
      81: { summary: 'Moderate Showers', sky: 'Moderate Showers' },
      82: { summary: 'Violent Showers', sky: 'Squall Line Showers' },
      95: { summary: 'Thunderstorm', sky: 'Thunderstorm Active' },
      96: { summary: 'Thunderstorm + Hail', sky: 'Severe Thunderstorm' }
    };
    return codes[code] || { summary: 'Variable Weather', sky: 'Variable Marine Conditions' };
  }

  /**
   * Calculate simulated wave height from wind speed
   * Crucial rule: Kept clearly labeled as simulated because not real measured marine data.
   */
  function calculateSimulatedWaveModel(windKnots) {
    const w = Math.max(windKnots, 2);
    // Significant wave height formula (wind-wave sea model)
    const waveHeight = Math.max(0.8, Math.round(0.018 * Math.pow(w, 1.62) * 10) / 10);
    const wavePeriod = Math.max(4.0, Math.round((4.0 + Math.sqrt(waveHeight) * 1.6) * 10) / 10);
    const waveSteepness = windKnots >= 24 ? 'High (Steep Wind Waves)' : windKnots >= 15 ? 'Moderate Swell' : 'Low (Long Swell)';
    const waveState = waveHeight >= 6.0 ? 'Rough / Heavy Chop (Simulated Model)' : waveHeight >= 3.0 ? 'Moderate Sea (Simulated Model)' : 'Smooth Swell (Simulated Model)';

    return {
      waveHeight,
      wavePeriod,
      waveSteepness,
      waveState
    };
  }

  // =========================================================================
  // 4. OPEN-METEO API INTEGRATION (FREE, NO API KEY)
  // =========================================================================

  /**
   * Fetch live weather from free Open-Meteo API
   * Supports city/port name or "lat, lon"
   */
  async function fetchOpenMeteoWeather(searchQuery, directLat, directLon) {
    state.isLoadingWeather = true;
    state.weatherError = null;
    renderAll();

    try {
      let lat = directLat;
      let lon = directLon;
      let resolvedName = searchQuery;

      // 1. Resolve coordinates if not provided directly
      if (lat === undefined || lon === undefined) {
        const query = searchQuery.trim();

        // Check if query is in "lat, lon" format
        const coordRegex = /^([-+]?[0-9]*\.?[0-9]+)\s*,\s*([-+]?[0-9]*\.?[0-9]+)$/;
        const match = query.match(coordRegex);

        if (match) {
          lat = parseFloat(match[1]);
          lon = parseFloat(match[2]);
          resolvedName = `Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
        } else {
          // Use Open-Meteo free geocoding API
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
          
          const geoRes = await fetchWithTimeout(geoUrl, 7000);
          if (!geoRes.ok) {
            throw new Error(`Geocoding failed with status ${geoRes.status}`);
          }
          const geoData = await geoRes.json();
          if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`Location "${query}" not found. Try a coastal city (e.g. Miami, Seattle) or "lat, lon".`);
          }

          const topResult = geoData.results[0];
          lat = topResult.latitude;
          lon = topResult.longitude;
          const adminPart = topResult.admin1 ? `, ${topResult.admin1}` : '';
          const countryPart = topResult.country ? `, ${topResult.country}` : '';
          resolvedName = `${topResult.name}${adminPart}${countryPart}`;
        }
      }

      // 2. Fetch current weather from Open-Meteo API with wind in knots
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility&wind_speed_unit=kn&timezone=auto`;

      const weatherRes = await fetchWithTimeout(weatherUrl, 8000);
      if (!weatherRes.ok) {
        throw new Error(`Open-Meteo API returned status ${weatherRes.status}`);
      }

      const weatherData = await weatherRes.json();
      if (!weatherData.current) {
        throw new Error('Incomplete weather payload returned by Open-Meteo.');
      }

      const current = weatherData.current;

      // Extract telemetry values
      const windSpeed = Math.round(current.wind_speed_10m * 10) / 10;
      const windGust = Math.round((current.wind_gusts_10m || (windSpeed * 1.3)) * 10) / 10;
      const windAngle = Math.round(current.wind_direction_10m || 0);
      const windDir = degreesToCardinal(windAngle);
      const beaufort = getBeaufortScale(windSpeed).desc;

      const tempC = Math.round(current.temperature_2m * 10) / 10;
      const tempF = Math.round((tempC * 9 / 5 + 32) * 10) / 10;
      const airTemp = `${tempF}°F (${tempC}°C)`;
      const waterTemp = `${Math.round(tempF - 4)}°F (${Math.round(tempC - 2)}°C) est.`;

      const barometer = Math.round(current.surface_pressure || 1013);
      const baroTrend = barometer < 1005 ? 'Low pressure trough. Unsettled weather likely.' : 'Barometer steady. Normal coastal pressure pattern.';

      // Visibility: Open-Meteo returns meters; convert to Nautical Miles
      const visMeters = current.visibility !== undefined ? current.visibility : 18520;
      const visibilityNM = Math.max(0.5, Math.round((visMeters / 1852) * 10) / 10);
      const visibilityRating = visibilityNM >= 10 ? 'Unlimited' : visibilityNM >= 5 ? 'Good' : visibilityNM >= 2 ? 'Moderate' : 'Restricted (Fog/Spray)';
      const visibilityNotes = visibilityNM >= 10
        ? 'Clear nautical horizon with optimal navigation visibility.'
        : `Atmospheric visibility is restricted to ${visibilityNM} NM. Maintain fog lookouts.`;

      const wmoInfo = getWmoWeatherDescription(current.weather_code);
      const weatherSummary = wmoInfo.summary;
      const skyCondition = wmoInfo.sky;

      // Calculate simulated wave model (clearly labeled as simulated!)
      const waveModel = calculateSimulatedWaveModel(windSpeed);

      const timestampStr = new Date().toLocaleString();
      const coordStr = `(${lat >= 0 ? lat.toFixed(2) + '°N' : Math.abs(lat).toFixed(2) + '°S'}, ${lon >= 0 ? lon.toFixed(2) + '°E' : Math.abs(lon).toFixed(2) + '°W'})`;

      const newLiveWeather = {
        id: 'live',
        name: `Live: ${resolvedName}`,
        locationName: `${resolvedName} ${coordStr}`,
        lat: lat,
        lon: lon,
        windSpeed: windSpeed,
        windGust: windGust,
        windDir: windDir,
        windAngle: windAngle,
        beaufort: beaufort,
        waveHeight: waveModel.waveHeight,
        wavePeriod: waveModel.wavePeriod,
        waveSteepness: waveModel.waveSteepness,
        waveState: waveModel.waveState,
        visibility: visibilityNM,
        visibilityRating: visibilityRating,
        visibilityNotes: visibilityNotes,
        weatherSummary: weatherSummary,
        skyCondition: skyCondition,
        barometer: barometer,
        baroTrend: baroTrend,
        airTemp: airTemp,
        waterTemp: waterTemp,
        forecastTimestamp: `${timestampStr} (Open-Meteo Live API)`,
        lastUpdated: timestampStr,
        isLive: true,
        isWaveSimulated: true
      };

      saveLiveWeather(newLiveWeather);
      saveLastLocation({ name: resolvedName, lat, lon });
      state.activeScenarioKey = 'live';
      saveActiveScenarioKey('live');
      state.weatherError = null;

    } catch (err) {
      console.warn('[SeaSafe] Open-Meteo Weather Fetch failed:', err);
      state.weatherError = err.message || 'Unable to fetch weather from Open-Meteo.';
      
      // Keep previous data if available
      if (!state.liveWeather) {
        state.activeScenarioKey = 'calm';
      }
    } finally {
      state.isLoadingWeather = false;
      renderAll();
    }
  }

  /**
   * Helper fetch with timeout
   */
  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  // =========================================================================
  // 5. RISK ASSESSMENT ENGINE
  // =========================================================================

  function getCurrentConditions() {
    if (state.activeScenarioKey === 'live' && state.liveWeather) {
      return state.liveWeather;
    }
    return SCENARIOS[state.activeScenarioKey] || SCENARIOS.calm;
  }

  /**
   * Compare active marine conditions against vessel configured thresholds
   */
  function evaluateRisk() {
    const currentScenario = getCurrentConditions();
    const vessel = state.vessel;

    const windExceeded = currentScenario.windSpeed > vessel.maxWind;
    const waveExceeded = currentScenario.waveHeight > vessel.maxWave;
    const isExceeded = windExceeded || waveExceeded;

    const windDiff = (currentScenario.windSpeed - vessel.maxWind).toFixed(1);
    const waveDiff = (currentScenario.waveHeight - vessel.maxWave).toFixed(1);

    const reasons = [];
    if (windExceeded) {
      reasons.push(`Wind speed (${currentScenario.windSpeed} kts) exceeds vessel limit (${vessel.maxWind} kts) by +${windDiff} kts`);
    }
    if (waveExceeded) {
      reasons.push(`Wave height (${currentScenario.waveHeight} ft) exceeds vessel limit (${vessel.maxWave} ft) by +${waveDiff} ft`);
    }

    let statusText = 'SAFE';
    let summaryText = `All conditions are within configured limits for ${vessel.boatName}. Operating margin is safe.`;

    if (isExceeded) {
      statusText = 'DANGER EXCEEDED';
      summaryText = `CRITICAL ALERT: ${reasons.join(' AND ')}. Extreme caution advised.`;
    }

    return {
      isExceeded,
      windExceeded,
      waveExceeded,
      windDiff,
      waveDiff,
      reasons,
      statusText,
      summaryText,
      scenario: currentScenario,
      vessel: vessel
    };
  }

  /**
   * Check if an active danger alert should be raised or logged
   */
  function syncAlertState(evaluation) {
    if (evaluation.isExceeded) {
      const reasonText = evaluation.reasons.join('; ');
      
      // Check if we already have an unacknowledged alert for this exact reason
      const existingUnacked = state.alerts.find(a => a.status === 'unacknowledged' && a.reason === reasonText);
      
      if (!existingUnacked) {
        // Add new alert entry to alerts list
        const newAlert = {
          id: 'alert_' + Date.now(),
          timestamp: new Date().toLocaleString(),
          reason: reasonText,
          vesselName: state.vessel.boatName,
          status: 'unacknowledged',
          acknowledgedAt: null
        };
        state.alerts.unshift(newAlert);
        if (state.alerts.length > 20) state.alerts.pop();
        saveAlerts(state.alerts);
      }
    }
  }

  // =========================================================================
  // 6. DOM REFERENCES
  // =========================================================================

  const DOM = {
    // Nav & Global
    brandLogo: document.getElementById('brand-logo'),
    navNetworkStatus: document.getElementById('nav-network-status'),
    navNetworkText: document.getElementById('nav-network-text'),
    navAlertIndicator: document.getElementById('nav-alert-indicator'),
    navScenarioName: document.getElementById('nav-scenario-name'),
    globalDangerBanner: document.getElementById('global-danger-banner'),
    bannerReason: document.getElementById('banner-reason'),
    bannerTime: document.getElementById('banner-time'),
    bannerAckBtn: document.getElementById('banner-ack-btn'),
    bannerViewBtn: document.getElementById('banner-view-btn'),

    // Views
    views: {
      home: document.getElementById('view-home'),
      vessel: document.getElementById('view-vessel'),
      conditions: document.getElementById('view-conditions'),
      offline: document.getElementById('view-offline')
    },

    // Homepage Cards & Strips
    cardVessel: document.getElementById('card-vessel'),
    cardConditions: document.getElementById('card-conditions'),
    cardOffline: document.getElementById('card-offline'),
    stripBoatName: document.getElementById('strip-boat-name'),
    stripBoatType: document.getElementById('strip-boat-type'),
    stripScenario: document.getElementById('strip-scenario'),
    stripWindWave: document.getElementById('strip-wind-wave'),
    stripRiskStatus: document.getElementById('strip-risk-status'),
    stripRiskSub: document.getElementById('strip-risk-sub'),
    homeCard1Limits: document.getElementById('home-card1-limits'),
    homeCard2Scenario: document.getElementById('home-card2-scenario'),

    // Back to Home buttons
    backBtns: document.querySelectorAll('.back-to-home-btn'),

    // Vessel Safety Screen
    vesselForm: document.getElementById('vessel-form'),
    boatNameInput: document.getElementById('boat-name-input'),
    vesselTypeSelect: document.getElementById('vessel-type-select'),
    maxWindSlider: document.getElementById('max-wind-slider'),
    maxWindInput: document.getElementById('max-wind-input'),
    maxWindVal: document.getElementById('max-wind-val'),
    maxWaveSlider: document.getElementById('max-wave-slider'),
    maxWaveInput: document.getElementById('max-wave-input'),
    maxWaveVal: document.getElementById('max-wave-val'),
    vesselSaveFeedback: document.getElementById('vessel-save-feedback'),
    vesselRiskSummaryBox: document.getElementById('vessel-risk-summary-box'),
    vesselRiskIcon: document.getElementById('vessel-risk-icon'),
    vesselRiskHeading: document.getElementById('vessel-risk-heading'),
    vesselRiskExplanation: document.getElementById('vessel-risk-explanation'),
    windCompRatio: document.getElementById('wind-comp-ratio'),
    windCompFill: document.getElementById('wind-comp-fill'),
    windCompDetail: document.getElementById('wind-comp-detail'),
    waveCompRatio: document.getElementById('wave-comp-ratio'),
    waveCompFill: document.getElementById('wave-comp-fill'),
    waveCompDetail: document.getElementById('wave-comp-detail'),
    comparisonActiveScenario: document.getElementById('comparison-active-scenario'),
    chipBoatName: document.getElementById('chip-boat-name'),
    chipVesselType: document.getElementById('chip-vessel-type'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    scenarioToggles: document.querySelectorAll('.btn-scenario-toggle'),

    // Marine Conditions Screen - Open-Meteo Elements
    weatherSearchForm: document.getElementById('weather-search-form'),
    locationSearchInput: document.getElementById('location-search-input'),
    btnFetchWeather: document.getElementById('btn-fetch-weather'),
    btnGpsWeather: document.getElementById('btn-gps-weather'),
    fetchBtnSpinner: document.getElementById('fetch-btn-spinner'),
    fetchBtnText: document.getElementById('fetch-btn-text'),
    presetLocBtns: document.querySelectorAll('.preset-loc-btn'),
    weatherLoadingBar: document.getElementById('weather-loading-bar'),
    weatherLoadingText: document.getElementById('weather-loading-text'),
    weatherErrorBanner: document.getElementById('weather-error-banner'),
    weatherErrorText: document.getElementById('weather-error-text'),
    btnRetryWeather: document.getElementById('btn-retry-weather'),
    teleLocationName: document.getElementById('tele-location-name'),
    teleUpdatedTime: document.getElementById('tele-updated-time'),

    // Scenario Cards
    scenarioCardLive: document.getElementById('scenario-card-live'),
    scenarioCardCalm: document.getElementById('scenario-card-calm'),
    scenarioCardRough: document.getElementById('scenario-card-rough'),
    radioCheckLive: document.getElementById('radio-check-live'),
    radioCheckCalm: document.getElementById('radio-check-calm'),
    radioCheckRough: document.getElementById('radio-check-rough'),
    cardLiveWind: document.getElementById('card-live-wind'),
    cardLiveWave: document.getElementById('card-live-wave'),
    cardLiveVis: document.getElementById('card-live-vis'),
    cardLiveTemp: document.getElementById('card-live-temp'),

    // Telemetry Gauges
    teleWindSpeed: document.getElementById('tele-wind-speed'),
    teleWindBeaufort: document.getElementById('tele-wind-beaufort'),
    teleCompassNeedle: document.getElementById('tele-compass-needle'),
    teleWindDir: document.getElementById('tele-wind-dir'),
    teleWindGust: document.getElementById('tele-wind-gust'),
    teleWindLimit: document.getElementById('tele-wind-limit'),
    teleWindStatusBadge: document.getElementById('tele-wind-status-badge'),
    teleWaveHeight: document.getElementById('tele-wave-height'),
    teleWaveState: document.getElementById('tele-wave-state'),
    teleWavePeriod: document.getElementById('tele-wave-period'),
    teleWaveSteepness: document.getElementById('tele-wave-steepness'),
    teleWaveLimit: document.getElementById('tele-wave-limit'),
    teleWaveStatusBadge: document.getElementById('tele-wave-status-badge'),
    teleVisDist: document.getElementById('tele-vis-dist'),
    teleVisRating: document.getElementById('tele-vis-rating'),
    teleVisBar: document.getElementById('tele-vis-bar'),
    teleVisNotes: document.getElementById('tele-vis-notes'),
    teleBaroPress: document.getElementById('tele-baro-press'),
    teleWeatherSummary: document.getElementById('tele-weather-summary'),
    teleSkyCondition: document.getElementById('tele-sky-condition'),
    teleTemp: document.getElementById('tele-temp'),
    teleWaterTemp: document.getElementById('tele-water-temp'),
    teleBaroTrend: document.getElementById('tele-baro-trend'),
    conditionsTargetVessel: document.getElementById('conditions-target-vessel'),
    conditionsImpactText: document.getElementById('conditions-impact-text'),
    btnSaveFromConditions: document.getElementById('btn-save-from-conditions'),

    // Offline Safety Screen
    offlinePulseDot: document.getElementById('offline-pulse-dot'),
    offlineConnTitle: document.getElementById('offline-conn-title'),
    offlineConnDesc: document.getElementById('offline-conn-desc'),
    offlineSWBadge: document.getElementById('offline-sw-badge'),
    simulateOfflineToggle: document.getElementById('simulate-offline-toggle'),
    saveCurrentAssessmentBtn: document.getElementById('save-current-assessment-btn'),
    offlineSaveFeedback: document.getElementById('offline-save-feedback'),
    offlineBoatName: document.getElementById('offline-boat-name'),
    offlineBoatType: document.getElementById('offline-boat-type'),
    offlineMaxWind: document.getElementById('offline-max-wind'),
    offlineMaxWave: document.getElementById('offline-max-wave'),
    offlineVesselTimestamp: document.getElementById('offline-vessel-timestamp'),
    snapSavedTime: document.getElementById('snap-saved-time'),
    snapRiskBadge: document.getElementById('snap-risk-badge'),
    snapForecastTime: document.getElementById('snap-forecast-time'),
    snapScenarioName: document.getElementById('snap-scenario-name'),
    snapWindSpeed: document.getElementById('snap-wind-speed'),
    snapWaveHeight: document.getElementById('snap-wave-height'),
    snapVerdictText: document.getElementById('snap-verdict-text'),
    activeAlertContainer: document.getElementById('active-alert-container'),
    activeAlertTitle: document.getElementById('active-alert-title'),
    activeAlertReason: document.getElementById('active-alert-reason'),
    activeAlertTime: document.getElementById('active-alert-time'),
    ackAlertBtn: document.getElementById('ack-alert-btn'),
    clearAlertsBtn: document.getElementById('clear-alerts-btn'),
    alertsTableBody: document.getElementById('alerts-table-body'),
    openVesselLinks: document.querySelectorAll('.open-vessel-link')
  };

  // =========================================================================
  // 7. VIEW ROUTING & NAVIGATION
  // =========================================================================

  function navigateToView(viewName) {
    if (!DOM.views[viewName]) {
      viewName = 'home';
    }

    Object.keys(DOM.views).forEach(name => {
      if (name === viewName) {
        DOM.views[name].classList.add('active-view');
      } else {
        DOM.views[name].classList.remove('active-view');
      }
    });

    if (window.location.hash !== `#${viewName}`) {
      window.history.pushState(null, '', `#${viewName}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderAll();
  }

  function handleHashChange() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && DOM.views[hash]) {
      navigateToView(hash);
    } else {
      navigateToView('home');
    }
  }

  // =========================================================================
  // 8. UI RENDER FUNCTIONS
  // =========================================================================

  function renderAll() {
    const evaluation = evaluateRisk();
    syncAlertState(evaluation);

    renderHeader(evaluation);
    renderHomeView(evaluation);
    renderVesselView(evaluation);
    renderConditionsView(evaluation);
    renderOfflineView(evaluation);
  }

  function renderHeader(evaluation) {
    const isOnline = state.isOnline && !state.simulatedOfflineMode;
    if (isOnline) {
      DOM.navNetworkStatus.className = 'status-pill pill-online';
      DOM.navNetworkText.textContent = 'ONLINE';
    } else {
      DOM.navNetworkStatus.className = 'status-pill pill-offline';
      DOM.navNetworkText.textContent = 'OFFLINE (CACHED)';
    }

    DOM.navScenarioName.textContent = evaluation.scenario.id === 'live' 
      ? 'Live: ' + (state.activeLocation.name || 'Coastal Weather')
      : evaluation.scenario.name;

    const unackedAlert = state.alerts.find(a => a.status === 'unacknowledged');
    if (evaluation.isExceeded || unackedAlert) {
      DOM.navAlertIndicator.classList.remove('hidden');
      DOM.globalDangerBanner.classList.remove('hidden');
      DOM.bannerReason.textContent = unackedAlert ? unackedAlert.reason : evaluation.reasons.join('; ');
      DOM.bannerTime.textContent = 'Recorded: ' + (unackedAlert ? unackedAlert.timestamp : new Date().toLocaleTimeString());
    } else {
      DOM.navAlertIndicator.classList.add('hidden');
      DOM.globalDangerBanner.classList.add('hidden');
    }
  }

  function renderHomeView(evaluation) {
    DOM.stripBoatName.textContent = state.vessel.boatName;
    DOM.stripBoatType.textContent = state.vessel.vesselType;
    DOM.stripScenario.textContent = evaluation.scenario.name;
    DOM.stripWindWave.textContent = `Wind: ${evaluation.scenario.windSpeed} kts • Wave: ${evaluation.scenario.waveHeight} ft (Sim)`;

    if (evaluation.isExceeded) {
      DOM.stripRiskStatus.innerHTML = '<span class="status-pill pill-danger">⚠️ LIMITS EXCEEDED</span>';
      DOM.stripRiskSub.textContent = evaluation.reasons[0] || 'Operational limit exceeded';
    } else {
      DOM.stripRiskStatus.innerHTML = '<span class="status-pill pill-safe">✓ SAFE OPERATING MARGIN</span>';
      DOM.stripRiskSub.textContent = 'Within all configured limits';
    }

    DOM.homeCard1Limits.textContent = `Max: ${state.vessel.maxWind} kts • ${state.vessel.maxWave} ft`;
    DOM.homeCard2Scenario.textContent = evaluation.scenario.id === 'live'
      ? `Live: ${state.activeLocation.name || 'Open-Meteo'}`
      : `Active: ${evaluation.scenario.name}`;
  }

  function renderVesselView(evaluation) {
    if (document.activeElement !== DOM.boatNameInput) {
      DOM.boatNameInput.value = state.vessel.boatName;
    }
    if (document.activeElement !== DOM.vesselTypeSelect) {
      DOM.vesselTypeSelect.value = state.vessel.vesselType;
    }
    if (document.activeElement !== DOM.maxWindSlider && document.activeElement !== DOM.maxWindInput) {
      DOM.maxWindSlider.value = state.vessel.maxWind;
      DOM.maxWindInput.value = state.vessel.maxWind;
      DOM.maxWindVal.textContent = `${state.vessel.maxWind} Knots`;
    }
    if (document.activeElement !== DOM.maxWaveSlider && document.activeElement !== DOM.maxWaveInput) {
      DOM.maxWaveSlider.value = state.vessel.maxWave;
      DOM.maxWaveInput.value = state.vessel.maxWave;
      DOM.maxWaveVal.textContent = `${state.vessel.maxWave} Feet`;
    }

    DOM.chipBoatName.textContent = state.vessel.boatName;
    DOM.chipVesselType.textContent = state.vessel.vesselType;
    DOM.comparisonActiveScenario.textContent = `Mode: ${evaluation.scenario.name}`;

    // Comparison Block 1: Wind
    const windRatio = Math.min((evaluation.scenario.windSpeed / state.vessel.maxWind) * 100, 150);
    DOM.windCompRatio.textContent = `${evaluation.scenario.windSpeed.toFixed(1)} kts / ${state.vessel.maxWind.toFixed(1)} kts`;
    DOM.windCompFill.style.width = `${Math.min(windRatio, 100)}%`;

    if (evaluation.windExceeded) {
      DOM.windCompFill.className = 'comp-bar-fill bar-danger';
      DOM.windCompDetail.innerHTML = `
        <span class="detail-tag tag-exceeded">LIMIT EXCEEDED</span>
        <span class="detail-text">Current wind (${evaluation.scenario.windSpeed} kts) exceeds your limit of ${state.vessel.maxWind} kts by +${evaluation.windDiff} kts! High capsizing risk for small craft.</span>
      `;
    } else {
      DOM.windCompFill.className = 'comp-bar-fill bar-cyan';
      const margin = (state.vessel.maxWind - evaluation.scenario.windSpeed).toFixed(1);
      DOM.windCompDetail.innerHTML = `
        <span class="detail-tag tag-ok">Safe Margin</span>
        <span class="detail-text">Current wind (${evaluation.scenario.windSpeed} kts) is ${margin} kts below your configured maximum limit (${state.vessel.maxWind} kts).</span>
      `;
    }

    // Comparison Block 2: Wave
    const waveRatio = Math.min((evaluation.scenario.waveHeight / state.vessel.maxWave) * 100, 150);
    DOM.waveCompRatio.textContent = `${evaluation.scenario.waveHeight.toFixed(1)} ft / ${state.vessel.maxWave.toFixed(1)} ft`;
    DOM.waveCompFill.style.width = `${Math.min(waveRatio, 100)}%`;

    if (evaluation.waveExceeded) {
      DOM.waveCompFill.className = 'comp-bar-fill bar-danger';
      DOM.waveCompDetail.innerHTML = `
        <span class="detail-tag tag-exceeded">LIMIT EXCEEDED</span>
        <span class="detail-text">Current wave height (${evaluation.scenario.waveHeight} ft) exceeds your limit of ${state.vessel.maxWave} ft by +${evaluation.waveDiff} ft! High swamping risk.</span>
      `;
    } else {
      DOM.waveCompFill.className = 'comp-bar-fill bar-cyan';
      const margin = (state.vessel.maxWave - evaluation.scenario.waveHeight).toFixed(1);
      DOM.waveCompDetail.innerHTML = `
        <span class="detail-tag tag-ok">Safe Margin</span>
        <span class="detail-text">Current wave height (${evaluation.scenario.waveHeight} ft) is ${margin} ft below your configured maximum limit (${state.vessel.maxWave} ft).</span>
      `;
    }

    // Overall Risk Evaluation Box
    if (evaluation.isExceeded) {
      DOM.vesselRiskSummaryBox.className = 'risk-summary-box state-danger';
      DOM.vesselRiskIcon.textContent = '⚠️';
      DOM.vesselRiskHeading.textContent = 'DANGER: CONFIGURED OPERATIONAL LIMIT EXCEEDED';
      DOM.vesselRiskExplanation.textContent = evaluation.summaryText;
    } else {
      DOM.vesselRiskSummaryBox.className = 'risk-summary-box state-safe';
      DOM.vesselRiskIcon.textContent = '✓';
      DOM.vesselRiskHeading.textContent = 'ALL CONDITIONS WITHIN CONFIGURED LIMITS';
      DOM.vesselRiskExplanation.textContent = `Current marine scenario complies with operational limits configured for ${state.vessel.boatName}. Maintain routine watch.`;
    }
  }

  function renderConditionsView(evaluation) {
    const s = evaluation.scenario;

    // 1. Loading & Error States
    if (state.isLoadingWeather) {
      DOM.weatherLoadingBar.classList.remove('hidden');
      DOM.fetchBtnSpinner.classList.remove('hidden');
      DOM.btnFetchWeather.disabled = true;
      DOM.fetchBtnText.textContent = 'Fetching...';
    } else {
      DOM.weatherLoadingBar.classList.add('hidden');
      DOM.fetchBtnSpinner.classList.add('hidden');
      DOM.btnFetchWeather.disabled = false;
      DOM.fetchBtnText.textContent = 'Fetch Current Weather';
    }

    if (state.weatherError) {
      DOM.weatherErrorBanner.classList.remove('hidden');
      DOM.weatherErrorText.textContent = state.weatherError;
    } else {
      DOM.weatherErrorBanner.classList.add('hidden');
    }

    // 2. Active Location & Timestamp
    DOM.teleLocationName.textContent = s.locationName || state.activeLocation.name || 'Coastal Waters';
    DOM.teleUpdatedTime.textContent = s.lastUpdated || s.forecastTimestamp || new Date().toLocaleString();

    // 3. Scenario Cards Active Highlight
    const activeKey = state.activeScenarioKey;
    if (DOM.scenarioCardLive) {
      if (activeKey === 'live') {
        DOM.scenarioCardLive.classList.add('active');
        DOM.radioCheckLive.textContent = '✓ Active';
      } else {
        DOM.scenarioCardLive.classList.remove('active');
        DOM.radioCheckLive.textContent = 'Select';
      }
    }

    if (DOM.scenarioCardCalm) {
      if (activeKey === 'calm') {
        DOM.scenarioCardCalm.classList.add('active');
        DOM.radioCheckCalm.textContent = '✓ Active';
      } else {
        DOM.scenarioCardCalm.classList.remove('active');
        DOM.radioCheckCalm.textContent = 'Select';
      }
    }

    if (DOM.scenarioCardRough) {
      if (activeKey === 'rough') {
        DOM.scenarioCardRough.classList.add('active');
        DOM.radioCheckRough.textContent = '✓ Active';
      } else {
        DOM.scenarioCardRough.classList.remove('active');
        DOM.radioCheckRough.textContent = 'Select';
      }
    }

    // Update Live Card quick pills
    if (DOM.cardLiveWind && state.liveWeather) {
      DOM.cardLiveWind.textContent = `${state.liveWeather.windSpeed} kts`;
      DOM.cardLiveWave.textContent = `${state.liveWeather.waveHeight} ft (Sim)`;
      DOM.cardLiveVis.textContent = `${state.liveWeather.visibility} NM`;
      DOM.cardLiveTemp.textContent = state.liveWeather.airTemp.split(' ')[0] || '--';
    }

    // 4. Metric 1: Wind
    DOM.teleWindSpeed.textContent = s.windSpeed.toFixed(1);
    DOM.teleWindBeaufort.textContent = s.beaufort;
    DOM.teleWindDir.textContent = s.windDir;
    DOM.teleCompassNeedle.style.transform = `rotate(${s.windAngle}deg)`;
    DOM.teleWindGust.textContent = `Gusts: ${s.windGust} kts`;
    DOM.teleWindLimit.textContent = `${state.vessel.maxWind.toFixed(1)} kts`;

    if (evaluation.windExceeded) {
      DOM.teleWindStatusBadge.className = 'badge-mini status-exceeded';
      DOM.teleWindStatusBadge.textContent = 'Exceeded';
    } else {
      DOM.teleWindStatusBadge.className = 'badge-mini status-ok';
      DOM.teleWindStatusBadge.textContent = 'Within Limit';
    }

    // 5. Metric 2: Wave (Clearly labeled as simulated)
    DOM.teleWaveHeight.textContent = s.waveHeight.toFixed(1);
    DOM.teleWaveState.textContent = s.waveState;
    DOM.teleWavePeriod.textContent = `${s.wavePeriod} seconds`;
    DOM.teleWaveSteepness.textContent = s.waveSteepness;
    DOM.teleWaveLimit.textContent = `${state.vessel.maxWave.toFixed(1)} ft`;

    if (evaluation.waveExceeded) {
      DOM.teleWaveStatusBadge.className = 'badge-mini status-exceeded';
      DOM.teleWaveStatusBadge.textContent = 'Exceeded';
    } else {
      DOM.teleWaveStatusBadge.className = 'badge-mini status-ok';
      DOM.teleWaveStatusBadge.textContent = 'Within Limit';
    }

    // 6. Metric 3: Visibility
    DOM.teleVisDist.textContent = s.visibility >= 10 ? '10+' : s.visibility.toFixed(1);
    DOM.teleVisRating.textContent = s.visibilityRating;
    DOM.teleVisNotes.textContent = s.visibilityNotes;
    const visPct = Math.min((s.visibility / 10) * 100, 100);
    DOM.teleVisBar.style.width = `${visPct}%`;

    // 7. Metric 4: Barometer & Weather
    DOM.teleBaroPress.textContent = s.barometer;
    DOM.teleWeatherSummary.textContent = s.weatherSummary;
    DOM.teleSkyCondition.textContent = s.skyCondition;
    DOM.teleTemp.textContent = s.airTemp;
    DOM.teleWaterTemp.textContent = s.waterTemp;
    DOM.teleBaroTrend.textContent = s.baroTrend;

    // 8. Bottom impact on saved vessel
    DOM.conditionsTargetVessel.textContent = state.vessel.boatName;
    if (evaluation.isExceeded) {
      DOM.conditionsImpactText.innerHTML = `<strong class="text-danger" style="color: #ff6b8b;">EXCEEDED:</strong> ${evaluation.reasons.join('. ')}. Small craft warning in effect for ${state.vessel.boatName}.`;
    } else {
      DOM.conditionsImpactText.innerHTML = `<strong class="text-cyan">COMPLIANT:</strong> Active weather telemetry complies with operational safety limits for ${state.vessel.boatName} (${state.vessel.vesselType}).`;
    }
  }

  function renderOfflineView(evaluation) {
    const isOnline = state.isOnline && !state.simulatedOfflineMode;

    if (isOnline) {
      DOM.offlinePulseDot.classList.remove('offline');
      DOM.offlineConnTitle.textContent = 'Device Connection: ONLINE';
      DOM.offlineConnDesc.textContent = 'Live weather and local safety storage are actively connected. Service worker ready.';
      DOM.simulateOfflineToggle.textContent = 'Simulate Going Offline';
    } else {
      DOM.offlinePulseDot.classList.add('offline');
      DOM.offlineConnTitle.textContent = 'Device Connection: OFFLINE (Local Mode)';
      DOM.offlineConnDesc.textContent = 'No cellular or internet connection detected. Running from cached marine assets & local storage.';
      DOM.simulateOfflineToggle.textContent = 'Simulate Going Online';
    }

    DOM.offlineBoatName.textContent = state.vessel.boatName;
    DOM.offlineBoatType.textContent = state.vessel.vesselType;
    DOM.offlineMaxWind.textContent = `${state.vessel.maxWind.toFixed(1)} Knots`;
    DOM.offlineMaxWave.textContent = `${state.vessel.maxWave.toFixed(1)} Feet`;
    DOM.offlineVesselTimestamp.textContent = state.vessel.lastUpdated || 'Initial';

    if (state.lastAssessment) {
      const snap = state.lastAssessment;
      DOM.snapSavedTime.textContent = snap.savedTime || 'Saved';
      DOM.snapForecastTime.textContent = snap.forecastTime || 'N/A';
      DOM.snapScenarioName.textContent = snap.scenarioName || 'Live Coastal Weather';
      DOM.snapWindSpeed.textContent = `${snap.windSpeed} kts (Config Max: ${snap.maxWind} kts)`;
      DOM.snapWaveHeight.textContent = `${snap.waveHeight} ft (Config Max: ${snap.maxWave} ft)`;
      DOM.snapVerdictText.textContent = snap.summary;

      if (snap.isExceeded) {
        DOM.snapRiskBadge.innerHTML = '<span class="status-pill pill-danger">LIMITS EXCEEDED</span>';
      } else {
        DOM.snapRiskBadge.innerHTML = '<span class="status-pill pill-safe">SAFE MARGIN</span>';
      }
    }

    const unackedAlert = state.alerts.find(a => a.status === 'unacknowledged');
    if (unackedAlert) {
      DOM.activeAlertContainer.classList.remove('hidden');
      DOM.activeAlertTitle.textContent = 'DANGER ALERT: CONFIGURED LIMIT EXCEEDED';
      DOM.activeAlertReason.textContent = unackedAlert.reason;
      DOM.activeAlertTime.textContent = `Triggered: ${unackedAlert.timestamp}`;
    } else {
      DOM.activeAlertContainer.classList.add('hidden');
    }

    renderAlertsTable();
  }

  function renderAlertsTable() {
    if (!state.alerts || state.alerts.length === 0) {
      DOM.alertsTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="5">No previous alerts logged. All conditions normal.</td>
        </tr>
      `;
      return;
    }

    DOM.alertsTableBody.innerHTML = state.alerts.map(alert => {
      const isUnacked = alert.status === 'unacknowledged';
      const statusBadge = isUnacked
        ? '<span class="badge-mini status-exceeded">UNACKNOWLEDGED</span>'
        : '<span class="badge-mini status-ok">ACKNOWLEDGED</span>';

      const actionBtn = isUnacked
        ? `<button class="btn btn-xs btn-warning table-ack-btn" data-id="${alert.id}">Acknowledge</button>`
        : `<span class="font-mono text-muted" style="font-size:0.75rem;">Ack: ${alert.acknowledgedAt || 'Logged'}</span>`;

      return `
        <tr>
          <td>${statusBadge}</td>
          <td class="font-mono" style="font-size:0.75rem;">${alert.timestamp}</td>
          <td>${escapeHtml(alert.reason)}</td>
          <td><strong>${escapeHtml(alert.vesselName)}</strong></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');

    DOM.alertsTableBody.querySelectorAll('.table-ack-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alertId = e.currentTarget.getAttribute('data-id');
        acknowledgeAlert(alertId);
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // 9. EVENT ACTIONS & HANDLERS
  // =========================================================================

  function captureAndSaveAssessment(feedbackElement) {
    const evaluation = evaluateRisk();
    const snapshot = {
      savedTime: new Date().toLocaleString(),
      forecastTime: evaluation.scenario.forecastTimestamp || new Date().toLocaleString(),
      scenarioName: evaluation.scenario.name,
      vesselName: state.vessel.boatName,
      vesselType: state.vessel.vesselType,
      windSpeed: evaluation.scenario.windSpeed,
      maxWind: state.vessel.maxWind,
      waveHeight: evaluation.scenario.waveHeight,
      maxWave: state.vessel.maxWave,
      isExceeded: evaluation.isExceeded,
      statusText: evaluation.statusText,
      summary: evaluation.isExceeded
        ? `Limit exceeded during snapshot: ${evaluation.reasons.join('; ')}. Vessel not advised to get underway.`
        : `Assessment confirmed safe for ${state.vessel.boatName}. Operating margin is within configured limits.`
    };

    saveLastAssessment(snapshot);
    renderAll();

    if (feedbackElement) {
      feedbackElement.textContent = '✓ Assessment Snapshot Saved Locally!';
      setTimeout(() => {
        feedbackElement.textContent = '';
      }, 3500);
    }
  }

  function acknowledgeAlert(alertId) {
    let updated = false;
    state.alerts = state.alerts.map(a => {
      if (!alertId || a.id === alertId || (alertId === 'all' && a.status === 'unacknowledged')) {
        updated = true;
        return {
          ...a,
          status: 'acknowledged',
          acknowledgedAt: new Date().toLocaleTimeString()
        };
      }
      return a;
    });

    if (updated) {
      saveAlerts(state.alerts);
      renderAll();
    }
  }

  function setWeatherScenario(scenarioKey) {
    if (scenarioKey === 'live' || SCENARIOS[scenarioKey]) {
      saveActiveScenarioKey(scenarioKey);
      renderAll();
    }
  }

  // =========================================================================
  // 10. EVENT LISTENERS SETUP
  // =========================================================================

  function setupEventListeners() {
    // 1. Navigation & Routing
    DOM.brandLogo.addEventListener('click', () => navigateToView('home'));
    DOM.brandLogo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToView('home');
      }
    });

    DOM.cardVessel.addEventListener('click', () => navigateToView('vessel'));
    DOM.cardVessel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToView('vessel');
      }
    });

    DOM.cardConditions.addEventListener('click', () => navigateToView('conditions'));
    DOM.cardConditions.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToView('conditions');
      }
    });

    DOM.cardOffline.addEventListener('click', () => navigateToView('offline'));
    DOM.cardOffline.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToView('offline');
      }
    });

    DOM.backBtns.forEach(btn => {
      btn.addEventListener('click', () => navigateToView('home'));
    });

    DOM.openVesselLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToView('vessel');
      });
    });

    window.addEventListener('hashchange', handleHashChange);

    DOM.navAlertIndicator.addEventListener('click', () => navigateToView('offline'));
    DOM.bannerViewBtn.addEventListener('click', () => navigateToView('offline'));
    DOM.bannerAckBtn.addEventListener('click', () => acknowledgeAlert('all'));
    DOM.ackAlertBtn.addEventListener('click', () => acknowledgeAlert('all'));

    DOM.clearAlertsBtn.addEventListener('click', () => {
      if (confirm('Clear the marine alerts log history?')) {
        saveAlerts([]);
        renderAll();
      }
    });

    // 2. Vessel Profile Form & Inputs
    DOM.maxWindSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      DOM.maxWindInput.value = val;
      DOM.maxWindVal.textContent = `${val} Knots`;
      state.vessel.maxWind = val;
      renderAll();
    });

    DOM.maxWindInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 5;
      DOM.maxWindSlider.value = val;
      DOM.maxWindVal.textContent = `${val} Knots`;
      state.vessel.maxWind = val;
      renderAll();
    });

    DOM.maxWaveSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      DOM.maxWaveInput.value = val;
      DOM.maxWaveVal.textContent = `${val} Feet`;
      state.vessel.maxWave = val;
      renderAll();
    });

    DOM.maxWaveInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 1;
      DOM.maxWaveSlider.value = val;
      DOM.maxWaveVal.textContent = `${val} Feet`;
      state.vessel.maxWave = val;
      renderAll();
    });

    DOM.boatNameInput.addEventListener('input', (e) => {
      state.vessel.boatName = e.target.value.trim() || 'My Vessel';
      renderAll();
    });

    DOM.vesselTypeSelect.addEventListener('change', (e) => {
      state.vessel.vesselType = e.target.value;
      renderAll();
    });

    DOM.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const wind = parseFloat(btn.getAttribute('data-wind'));
        const wave = parseFloat(btn.getAttribute('data-wave'));
        const type = btn.getAttribute('data-type');

        state.vessel.maxWind = wind;
        state.vessel.maxWave = wave;
        state.vessel.vesselType = type;

        DOM.vesselTypeSelect.value = type;
        DOM.maxWindSlider.value = wind;
        DOM.maxWindInput.value = wind;
        DOM.maxWindVal.textContent = `${wind} Knots`;

        DOM.maxWaveSlider.value = wave;
        DOM.maxWaveInput.value = wave;
        DOM.maxWaveVal.textContent = `${wave} Feet`;

        saveVesselProfile(state.vessel);
        renderAll();
      });
    });

    DOM.vesselForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedProfile = {
        boatName: DOM.boatNameInput.value.trim() || 'Sea Sprite II',
        vesselType: DOM.vesselTypeSelect.value,
        maxWind: parseFloat(DOM.maxWindInput.value) || 20,
        maxWave: parseFloat(DOM.maxWaveInput.value) || 4.0,
        lastUpdated: new Date().toLocaleString()
      };

      saveVesselProfile(updatedProfile);
      renderAll();

      DOM.vesselSaveFeedback.textContent = '✓ Saved to local storage!';
      setTimeout(() => {
        DOM.vesselSaveFeedback.textContent = '';
      }, 3500);
    });

    // 3. Open-Meteo Weather Search & Coastal Presets
    DOM.weatherSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = DOM.locationSearchInput.value.trim();
      if (query) {
        fetchOpenMeteoWeather(query);
      }
    });

    DOM.btnRetryWeather.addEventListener('click', () => {
      const query = DOM.locationSearchInput.value.trim() || state.activeLocation.name || 'Miami, Florida';
      fetchOpenMeteoWeather(query);
    });

    // Coastal Port Preset Buttons
    DOM.presetLocBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.presetLocBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const name = btn.getAttribute('data-name');
        const lat = parseFloat(btn.getAttribute('data-lat'));
        const lon = parseFloat(btn.getAttribute('data-lon'));

        DOM.locationSearchInput.value = name;
        fetchOpenMeteoWeather(name, lat, lon);
      });
    });

    // GPS Location button
    DOM.btnGpsWeather.addEventListener('click', () => {
      if (!navigator.geolocation) {
        state.weatherError = 'Geolocation is not supported by your browser.';
        renderAll();
        return;
      }

      state.isLoadingWeather = true;
      DOM.weatherLoadingText.textContent = 'Detecting current GPS coordinates...';
      renderAll();

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const name = `GPS Position (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
          DOM.locationSearchInput.value = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
          fetchOpenMeteoWeather(name, lat, lon);
        },
        (err) => {
          state.isLoadingWeather = false;
          state.weatherError = `GPS detection failed: ${err.message}. Please enter a coastal city manually.`;
          renderAll();
        },
        { timeout: 8000 }
      );
    });

    // 4. Scenario Selector (Live, Calm, Rough)
    if (DOM.scenarioCardLive) {
      DOM.scenarioCardLive.addEventListener('click', () => setWeatherScenario('live'));
      DOM.scenarioCardLive.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setWeatherScenario('live');
        }
      });
    }

    DOM.scenarioCardCalm.addEventListener('click', () => setWeatherScenario('calm'));
    DOM.scenarioCardCalm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setWeatherScenario('calm');
      }
    });

    DOM.scenarioCardRough.addEventListener('click', () => setWeatherScenario('rough'));
    DOM.scenarioCardRough.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setWeatherScenario('rough');
      }
    });

    // 5. Save Assessment Snapshots
    DOM.saveCurrentAssessmentBtn.addEventListener('click', () => {
      captureAndSaveAssessment(DOM.offlineSaveFeedback);
    });

    DOM.btnSaveFromConditions.addEventListener('click', () => {
      captureAndSaveAssessment(null);
      navigateToView('offline');
      DOM.offlineSaveFeedback.textContent = '✓ Snapshot Captured & Preserved!';
      setTimeout(() => {
        DOM.offlineSaveFeedback.textContent = '';
      }, 3500);
    });

    // 6. Network Connectivity Listeners & Simulation
    window.addEventListener('online', () => {
      state.isOnline = true;
      renderAll();
    });

    window.addEventListener('offline', () => {
      state.isOnline = false;
      renderAll();
    });

    DOM.simulateOfflineToggle.addEventListener('click', () => {
      state.simulatedOfflineMode = !state.simulatedOfflineMode;
      renderAll();
    });
  }

  // =========================================================================
  // 11. SERVICE WORKER REGISTRATION
  // =========================================================================

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((registration) => {
            console.log('[SeaSafe] Service Worker registered with scope:', registration.scope);
            if (DOM.offlineSWBadge) {
              DOM.offlineSWBadge.textContent = 'Service Worker: Active & Cached';
            }
          })
          .catch((error) => {
            console.warn('[SeaSafe] Service Worker registration failed:', error);
            if (DOM.offlineSWBadge) {
              DOM.offlineSWBadge.textContent = 'Service Worker: Standalone Mode';
            }
          });
      });
    } else {
      if (DOM.offlineSWBadge) {
        DOM.offlineSWBadge.textContent = 'Local Storage Cache: Active';
      }
    }
  }

  // =========================================================================
  // 12. INITIALIZATION
  // =========================================================================

  function init() {
    setupEventListeners();
    registerServiceWorker();

    // Check initial URL hash
    if (window.location.hash) {
      handleHashChange();
    } else {
      renderAll();
    }

    // If online, perform live weather fetch for active location on startup
    if (navigator.onLine && !state.simulatedOfflineMode) {
      const loc = state.activeLocation || DEFAULT_LOCATION;
      fetchOpenMeteoWeather(loc.name, loc.lat, loc.lon);
    }
  }

  // Launch app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
