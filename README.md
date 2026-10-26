# SeaSafe
### Offline-First Maritime Safety Support for Small-Boat Operators

## Overview
SeaSafe is a maritime safety support prototype designed to help small-boat operators understand weather-related risks, compare selected conditions with vessel-specific configured limits, and access previously saved safety information when internet connectivity is unavailable.

The project addresses a practical challenge: boat operators may have limited connectivity while on the water, yet still need clear information about weather conditions and previously recorded assessments. SeaSafe brings together accessible weather information, explainable threshold checks, and offline access to saved records in one lightweight interface.

SeaSafe is an educational prototype. It is not a certified navigation system, does not guarantee safe passage, and must not replace official marine forecasts, maritime authorities, emergency communications, or professional judgment.

## Problem Statement
Small-boat operators can face changing wind, waves, visibility, and weather while travelling in areas where internet connectivity is weak or unavailable. Many digital services depend on an active connection, while general weather information may not be easy to compare with the configured operating limits of a particular vessel.

There is a need for a lightweight tool that can:
- Present understandable weather information when an internet connection is available.
- Compare selected conditions with limits configured by the user for their vessel.
- Preserve previous assessments and alerts for later reference.
- Make saved information accessible when the website has no connection.
- Clearly communicate uncertainty, data age, and the limitations of automated risk checks.

## Proposed Solution
SeaSafe brings these capabilities together in a responsive web application with three main sections:

1. **Vessel Safety** — lets users enter and locally save a vessel profile, including vessel name, vessel type, and user-configured wind and wave thresholds. The application compares selected conditions against those thresholds and explains when a configured threshold is exceeded.
2. **Marine Conditions** — aims to display current weather information from a public weather data source when online. The planned integration uses the Open-Meteo API without a private API key. Available fields depend on the data source. Any wave-height values that are simulated must be clearly labelled as simulated rather than real marine observations.
3. **Offline Safety** — aims to provide access to locally saved vessel details, previous assessments, timestamps, and alerts when the site has been loaded and its files cached. It should indicate the device's connection status and warn when stored information may be outdated.

## Current Prototype Progress
SeaSafe is being developed as a lightweight website using HTML, CSS, and JavaScript, with deployment intended for GitHub Pages.

The current design and development direction includes:
- A dark navy and ocean-blue visual theme with cyan accents.
- A home page centred on exactly three feature cards: Vessel Safety, Marine Conditions, and Offline Safety.
- Full-screen feature views with a consistent layout and a Back to Home control.
- A focus on simple interactions, readable risk indicators, and responsive presentation.
- Local storage for saving user-entered vessel details and assessment information.
- A planned connection to public weather data without a private API key or paid backend.
- A planned service worker for caching website assets to support reopening the site offline after an initial successful load.

**Implementation status:** This README describes the project direction and intended functionality. A feature should be considered complete only after it has been implemented and tested in the current repository. Real weather fetching, local persistence, service-worker caching, offline behaviour, and alert handling must each be verified in the deployed build before being described as fully working.

## How the Risk Check Works
SeaSafe is intended to use a simple, explainable threshold comparison rather than a complex predictive model.

1. The user enters configured wind-speed and wave-height thresholds for their vessel.
2. The user selects available weather conditions or a clearly labelled demo scenario.
3. The application compares the selected values with the configured thresholds.
4. If a threshold is exceeded, the interface identifies which value exceeded the user's setting and displays a warning.
5. The user can save the assessment and review it later, if local saving has been implemented and tested.

These thresholds are entered by the user and are not certified safe operating limits. A result that does not exceed a configured threshold is not a declaration that conditions are safe. The comparison does not account for every factor affecting vessel safety, including vessel condition, loading, crew experience, route, currents, tides, local warnings, or rapidly changing conditions.

## Data and Offline Behaviour

### Online Weather Information
The planned Marine Conditions integration uses the public Open-Meteo service and does not require a private API key for the intended basic use. Availability, returned fields, and service terms should be checked against the provider's current documentation before release. A failed request must produce a clear error state rather than fabricated live data.

### Simulated Data
Demo scenarios such as Calm Conditions and Rough Conditions may be used to demonstrate the interface and risk-check workflow. Simulated values must remain visibly identified as demo data and must not be presented as current observations or forecasts.

### Offline Access
A service worker can cache the website's core files, while browser local storage can retain selected user data. Once cached, the interface may reopen without a network connection, depending on browser support and how the site was first loaded. Offline mode cannot fetch fresh weather data. It can only display previously saved information and must show the relevant timestamp or indicate when information is unavailable or outdated.

## Technology Stack
- **HTML5** — application structure.
- **CSS3** — responsive styling and visual design.
- **JavaScript** — user interactions, threshold comparisons, and data handling.
- **Open-Meteo API (planned integration)** — public weather data without a private API key.
- **Browser local storage (implementation to verify)** — saving vessel profiles and assessment records locally.
- **Service worker (implementation to verify)** — caching the web application for offline reopening.
- **GitHub Pages (intended deployment)** — static website hosting.

The project is designed to avoid a custom backend, paid API subscriptions, and secret credentials for its basic prototype.

## Running the Project
1. Clone or download this repository.
2. Open the project folder in a code editor.
3. Open `index.html` in a browser for a basic UI preview, or use a local static web server for testing.
4. For service-worker and offline testing, serve the site over `localhost` or HTTPS; service workers generally do not work reliably when opening an HTML file directly with a `file://` URL.
5. Test all three feature views, the weather request and error states, saving and restoring data, and offline reopening.
6. Deploy the static files to GitHub Pages after testing.

The exact startup process may change if the project structure changes. No API key should be required for the intended basic Open-Meteo integration.

## Intended Testing Checklist
- [ ] The home page displays the three expected feature cards.
- [ ] Each card opens the correct feature view and the Back to Home control works.
- [ ] Vessel details can be saved and restored after a page reload.
- [ ] Risk warnings update when conditions or configured thresholds change.
- [ ] Demo conditions are visibly labelled as simulated.
- [ ] Weather data shows its location and retrieval/update time where available.
- [ ] Network or API failures show a clear message and do not fabricate live data.
- [ ] Assessments and alerts persist if that functionality has been implemented.
- [ ] The online/offline indicator reflects the browser's connection state.
- [ ] Cached files allow the website to reopen offline after the first successful online load.
- [ ] Offline screens identify saved data and warn when it may be outdated.
- [ ] The website works on mobile and desktop screen sizes.
- [ ] The safety disclaimer is visible and understandable.

## Limitations
- SeaSafe is a prototype and has not been certified or validated for operational maritime use.
- Public weather data may be delayed, unavailable, incomplete, or not representative of conditions at the vessel's exact location.
- Basic weather fields do not necessarily provide authoritative marine forecasts, local marine warnings, tide or current information, or route-specific analysis.
- Wave-height values are not real marine measurements unless obtained from a suitable, clearly identified data source.
- Offline mode cannot provide new online weather data or guarantee that cached information remains current.
- User-configured thresholds are for demonstration and comparison only, not safety recommendations.
- The prototype does not replace radio, satellite, emergency, or other approved maritime communication systems.

## Future Scope
Potential future improvements include:
- Integrating a clearly identified marine forecast source for wave height and other relevant marine variables.
- Adding trusted local marine warnings and forecast issue times.
- Improving offline data freshness indicators and saved-assessment history.
- Adding configurable location selection and clearer data-source attribution.
- Conducting usability and reliability testing with appropriate maritime safety expertise before considering any real-world use.

## Project Goal
The goal of SeaSafe is to demonstrate how a lightweight, accessible, offline-first web application can help users review weather information, compare selected values against their own configured vessel thresholds, and retain important records when connectivity is limited—while communicating data limitations clearly.

## Disclaimer
SeaSafe is for educational and demonstration purposes only. It is not a certified navigation, forecasting, or emergency-response system. Always consult official marine forecasts, local maritime authorities, and appropriate professionals, and use approved navigation and emergency communication equipment. Never rely on SeaSafe alone to decide whether to depart, continue, or change a voyage.
