/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Replaced incorrect `FunctionDeclarationTool` with `Tool` and added `Type` for schema definitions.
import { GoogleGenAI, Tool, Type, GenerateContentResponse } from "@google/genai";

// Fix: To resolve "Cannot find namespace 'L'", declare the namespace for Leaflet types.
// `declare var L: any` is not enough as it only declares the global variable, not the types.
declare namespace L {
    type Map = any;
    type GeoJSON = any;
    type FeatureGroup = any;
    type Marker = any;
    type Polyline = any;
    type LatLng = any;
    type LatLngBounds = any;
}
declare var L: any;
// Web Speech API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// Since this is a demo, we will use mock data.
// In a real application, this would come from an API.

// Mock GeoJSON for roads
const dorGeoJson: any = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "name": "Araniko Highway", "status": "good" },
            "geometry": {
                "type": "LineString",
                "coordinates": [[85.3, 27.7], [85.4, 27.75], [85.5, 27.7]]
            }
        },
        {
            "type": "Feature",
            "properties": { "name": "Prithvi Highway", "status": "fair" },
            "geometry": {
                "type": "LineString",
                "coordinates": [[84.4, 27.7], [84.8, 27.65], [85.3, 27.7]]
            }
        },
        {
            "type": "Feature",
            "properties": { "name": "Local Road", "status": "poor" },
            "geometry": {
                "type": "LineString",
                "coordinates": [[85.32, 27.68], [85.35, 27.69], [85.34, 27.66]]
            }
        },
        {
            "type": "Feature",
            "properties": { "name": "Congested Inner Road", "status": "good" },
            "geometry": {
                "type": "LineString",
                "coordinates": [[85.322, 27.693], [85.324, 27.691], [85.318, 27.689], [85.316, 27.691]]
            }
        }
    ]
};

// Mock POIs (from "Google Sheets")
let pois = [
    { id: 1, name: "Maitighar Mandala", lat: 27.693, lng: 85.322, type: 'poi', status: 'Good condition', category: 'landmark' },
    { id: 2, name: "Thapathali Bridge", lat: 27.691, lng: 85.316, type: 'bridge', status: 'Under maintenance', category: 'bridge' },
    { id: 5, name: "Patan Hospital", lat: 27.671, lng: 85.318, type: 'poi', status: 'Open 24/7', category: 'hospital' },
    { id: 6, name: "Himalayan Java Coffee", lat: 27.695, lng: 85.320, type: 'poi', status: 'Open', category: 'coffee shop' },
    { id: 7, name: "Nabil Bank ATM", lat: 27.690, lng: 85.318, type: 'poi', status: 'In Service', category: 'atm' },
    { id: 8, name: "The Old House Restaurant", lat: 27.705, lng: 85.319, type: 'poi', status: 'Open', category: 'restaurant' },
    { id: 9, name: "Civil Mall", lat: 27.698, lng: 85.311, type: 'poi', status: 'Open', category: 'shopping' },
    { id: 10, name: "Everest Bank ATM", lat: 27.685, lng: 85.325, type: 'poi', status: 'In Service', category: 'atm' },
    { id: 11, name: "Bhatbhateni Supermarket", lat: 27.688, lng: 85.333, type: "poi", status: "Open", category: "shopping" },
];

// Mock Incidents (from "Waze")
let wazeIncidents = [
    { id: 3, name: "Heavy Traffic", lat: 27.717, lng: 85.323, type: 'traffic', status: 'Active' },
    { id: 4, name: "Road Closure", lat: 27.70, lng: 85.4, type: 'closure', status: 'Active' },
];

// Mock Traffic Data - this will be mutated to simulate live traffic
let mockTrafficData = [
    { roadName: "Araniko Highway", traffic: "heavy" },
    { roadName: "Prithvi Highway", traffic: "moderate" },
    { roadName: "Local Road", traffic: "clear" },
    { roadName: "Congested Inner Road", traffic: "heavy" },
];

// Translations
const translations: { [key: string]: any } = {
    en: {
        layers: 'Layers',
        roads: 'Roads',
        pois: 'Points of Interest',
        incidents: 'Incidents',
        display_panel_title: 'Nearby Information',
        route_finder: 'Route Finder',
        find_route_btn: 'Find Optimal Route',
        clear_route_btn: 'Clear Route',
        share_route: 'Share Route',
        link_copied: 'Link Copied!',
        route_finder_error: 'Could not find start or end location. Please use valid POI names.',
        route_finder_error_no_start: 'Your current location is not available. Cannot plan route.',
        menu_map: 'Map',
        menu_alerts: 'Alerts',
        menu_driver: 'Driver',
        menu_passenger: 'Passenger',
        menu_settings: 'Settings',
        menu_profile: 'Profile',
        ai_chat_title: 'AI Assistant',
        ai_chat_placeholder: 'Ask to find a place or report an incident...',
        ai_chat_placeholder_passenger: 'Ask about nearby places or plan a trip...',
        ai_chat_placeholder_listening: 'Listening...',
        report_incident_prompt: 'I want to report an incident here: ',
        share_location: 'Share Live Location',
        nearby_pois: 'Nearby POIs',
        voice_error_no_speech: "I didn't catch that. Please try tapping the mic again.",
        voice_error_mic_problem: "There seems to be an issue with your microphone.",
        route_preferences: 'Route Preferences',
        prefer_highways: 'Prefer Highways',
        avoid_tolls: 'Avoid Tolls',
        prefer_scenic_route: 'Prefer Scenic Route',
        route_pref_scenic: 'Found a scenic route.',
        route_pref_highways: 'Found a route preferring highways.',
        route_pref_fastest: 'Fastest route found.',
        route_pref_avoid_tolls: 'Avoiding tolls.',
    },
    np: {
        layers: 'तहहरू',
        roads: 'सडकहरू',
        pois: 'रुचिका ठाउँहरू',
        incidents: 'घटनाहरू',
        display_panel_title: 'नजिकैको जानकारी',
        route_finder: 'मार्ग खोज्नुहोस्',
        find_route_btn: 'उत्तम मार्ग खोज्नुहोस्',
        clear_route_btn: 'मार्ग हटाउनुहोस्',
        share_route: 'मार्ग साझा गर्नुहोस्',
        link_copied: 'लिङ्क प्रतिलिपि भयो!',
        route_finder_error: 'सुरु वा अन्त्य स्थान फेला पार्न सकिएन। कृपया मान्य POI नामहरू प्रयोग गर्नुहोस्।',
        route_finder_error_no_start: 'तपाईंको हालको स्थान उपलब्ध छैन। मार्ग योजना गर्न सकिँदैन।',
        menu_map: 'नक्सा',
        menu_alerts: 'सतर्कता',
        menu_driver: 'चालक',
        menu_passenger: 'यात्री',
        menu_settings: 'सेटिङहरू',
        menu_profile: 'प्रोफाइल',
        ai_chat_title: 'एआई सहायक',
        ai_chat_placeholder: 'ठाउँ खोज्न वा घटना रिपोर्ट गर्न सोध्नुहोस्...',
        ai_chat_placeholder_passenger: 'नजिकैका ठाउँहरूको बारेमा सोध्नुहोस् वा यात्राको योजना बनाउनुहोस्...',
        ai_chat_placeholder_listening: 'सुन्दै...',
        report_incident_prompt: 'म यहाँ एक घटना रिपोर्ट गर्न चाहन्छु: ',
        share_location: 'लाइभ स्थान साझा गर्नुहोस्',
        nearby_pois: 'नजिकैको POIs',
        voice_error_no_speech: 'मैले बुझिनँ। कृपया माइक फेरि ट्याप गर्नुहोस्।',
        voice_error_mic_problem: 'तपाईंको माइक्रोफोनमा समस्या देखिन्छ।',
        route_preferences: 'मार्ग प्राथमिकताहरू',
        prefer_highways: 'राजमार्गहरू प्राथमिकता दिनुहोस्',
        avoid_tolls: 'टोलबाट बच्नुहोस्',
        prefer_scenic_route: 'रमणीय मार्ग प्राथमिकता दिनुहोस्',
        route_pref_scenic: 'एक रमणीय मार्ग फेला पर्यो।',
        route_pref_highways: 'राजमार्गहरूलाई प्राथमिकता दिने मार्ग फेला पर्यो।',
        route_pref_fastest: 'सबैभन्दा छिटो मार्ग फेला पर्यो।',
        route_pref_avoid_tolls: 'टोलबाट बच्दै।',
    },
    hi: {
        layers: 'परतें',
        roads: 'सड़कें',
        pois: 'रुचि के स्थान',
        incidents: 'घटनाएं',
        display_panel_title: 'आस-पास की जानकारी',
        route_finder: 'मार्ग खोजें',
        find_route_btn: 'इष्टतम मार्ग खोजें',
        clear_route_btn: 'मार्ग साफ़ करें',
        share_route: 'मार्ग साझा करें',
        link_copied: 'लिंक कॉपी किया गया!',
        route_finder_error: 'प्रारंभ या अंत स्थान नहीं मिला। कृपया मान्य POI नामों का उपयोग करें।',
        route_finder_error_no_start: 'आपका वर्तमान स्थान उपलब्ध नहीं है। मार्ग की योजना नहीं बनाई जा सकती।',
        menu_map: 'नक्शा',
        menu_alerts: 'चेतावनी',
        menu_driver: 'चालक',
        menu_passenger: 'यात्री',
        menu_settings: 'सेटिंग्स',
        menu_profile: 'प्रोफ़ाइल',
        ai_chat_title: 'एआई सहायक',
        ai_chat_placeholder: 'कोई स्थान खोजने या घटना की रिपोर्ट करने के लिए कहें...',
        ai_chat_placeholder_passenger: 'आस-पास के स्थानों के बारे में पूछें या यात्रा की योजना बनाएं...',
        ai_chat_placeholder_listening: 'सुन रहा है...',
        report_incident_prompt: 'मैं यहां एक घटना की रिपोर्ट करना चाहता हूं: ',
        share_location: 'लाइव स्थान साझा करें',
        nearby_pois: 'आस-पास के POI',
        voice_error_no_speech: 'मैंने सुना नहीं। कृपया माइक को फिर से टैप करें।',
        voice_error_mic_problem: 'आपके माइक्रोफ़ोन में कोई समस्या है।',
        route_preferences: 'मार्ग प्राथमिकताएं',
        prefer_highways: 'राजमार्गों को प्राथमिकता दें',
        avoid_tolls: 'टोल से बचें',
        prefer_scenic_route: 'दर्शनीय मार्ग को प्राथमिकता दें',
        route_pref_scenic: 'एक सुंदर मार्ग मिला।',
        route_pref_highways: 'राजमार्गों को प्राथमिकता देने वाला मार्ग मिला।',
        route_pref_fastest: 'सबसे तेज़ मार्ग मिला।',
        route_pref_avoid_tolls: 'टोल से बचते हुए।',
    }
};

let map: L.Map;
let roadLayer: L.GeoJSON;
let trafficLayer: L.GeoJSON; // Layer for traffic color casing
let poiLayer: L.FeatureGroup;
let incidentLayer: L.FeatureGroup;
let routeLayer: L.FeatureGroup;
let userLocationMarker: L.Marker | null = null;
let currentUserPosition: { lat: number, lng: number, heading: number | null } | null = null;
let currentLang = 'en';
let currentRouteCoords: [number, number][] | null = null;
let currentRouteInfo: { from: string, to: string } | null = null;
let chatHistory: any[] = []; // Store chat history for context
let highAccuracyWatchId: number | null = null;
let lowAccuracyWatchId: number | null = null;
let recognition: any | null = null;
let routePreferences = {
    preferHighways: false,
    avoidTolls: false,
    preferScenic: false,
};

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initUI();
    initSpeechRecognition();
    handleUrlParameters();
    populateDisplayPanel();
    updateLanguage();
    initGeolocation();
});

function initMap() {
    map = L.map('map', {
        zoomControl: false // Disable default zoom control position
    }).setView([27.7172, 85.3240], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });

    lightTiles.addTo(map); // Default theme

    // Store tile layers to switch them later
    (map as any).tileLayers = {
        light: lightTiles,
        dark: darkTiles
    };

    // Initialize layers
    trafficLayer = L.geoJSON(undefined).addTo(map);
    roadLayer = L.geoJSON(undefined, { onEachFeature: onEachRoad }).addTo(map);
    poiLayer = L.featureGroup().addTo(map);
    incidentLayer = L.featureGroup().addTo(map);
    routeLayer = L.featureGroup().addTo(map);

    // Add initial data to layers
    addRoadLayers();
    addPoiLayer(pois);
    addIncidentLayer(wazeIncidents);
    
    // Start live traffic simulation
    setInterval(updateAndRefreshTraffic, 5000); // Update every 5 seconds
}

function initUI() {
    const themeToggle = document.getElementById('theme-toggle')!;
    const languageSelect = document.getElementById('language-select')!;
    const displayPanelHeader = document.getElementById('display-panel-header')!;
    const displayPanel = document.getElementById('display-panel')!;
    const hamburgerMenu = document.getElementById('hamburger-menu')!;
    const settingsPanel = document.getElementById('settings-panel')!;
    const routeFinderTrigger = document.getElementById('route-finder-trigger')!;
    const routeFinderPanel = document.getElementById('route-finder-panel')!;
    const routeFinderClose = document.getElementById('route-finder-close')!;
    const findRouteBtn = document.getElementById('find-route-btn')!;
    const clearRouteBtn = document.getElementById('clear-route-btn')!;
    const shareRouteBtn = document.getElementById('share-route-btn')!;
    const aiAssistantBtn = document.getElementById('ai-assistant')!;
    const aiChatModal = document.getElementById('ai-chat-modal')!;
    const aiChatCloseBtn = document.getElementById('ai-chat-close')!;
    const chatForm = document.getElementById('chat-form')!;
    const centerLocationBtn = document.getElementById('center-location-btn')!;
    const reportIncidentBtn = document.getElementById('report-incident-btn')!;
    const driverModeBtn = document.getElementById('driver-mode-btn')!;
    const passengerModeBtn = document.getElementById('passenger-mode-btn')!;
    const shareLocationBtn = document.getElementById('share-location-btn')!;
    const nearbyPoisBtn = document.getElementById('nearby-pois-btn')!;
    const prefHighways = document.getElementById('pref-highways') as HTMLInputElement;
    const prefNoTolls = document.getElementById('pref-no-tolls') as HTMLInputElement;
    const prefScenic = document.getElementById('pref-scenic') as HTMLInputElement;


    // Theme switcher
    themeToggle.addEventListener('click', () => {
        const container = document.getElementById('app-container')!;
        const currentTheme = container.dataset.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        container.dataset.theme = newTheme;
        themeToggle.querySelector('.material-icons')!.textContent = newTheme === 'light' ? 'light_mode' : 'dark_mode';
        (map as any).removeLayer((map as any).tileLayers[currentTheme!]);
        (map as any).addLayer((map as any).tileLayers[newTheme]);
    });

    // Language switcher
    languageSelect.addEventListener('change', (e) => {
        currentLang = (e.target as HTMLSelectElement).value;
        updateLanguage();
        // Update speech recognition language
        if (recognition) {
            const langMap: { [key: string]: string } = {
                en: 'en-US',
                np: 'ne-NP',
                hi: 'hi-IN'
            };
            recognition.lang = langMap[currentLang] || 'en-US';
        }
    });

    // Display panel toggle
    displayPanelHeader.addEventListener('click', () => {
        displayPanel.classList.toggle('collapsed');
        // Invalidate map size after animation to ensure it renders correctly
        setTimeout(() => map.invalidateSize(), 400);
    });

    // Settings panel toggle
    hamburgerMenu.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
        const dot = hamburgerMenu.querySelector('.blinking-dot');
        if (dot) dot.classList.add('hide');
    });

    // Route finder modal
    routeFinderTrigger.addEventListener('click', () => routeFinderPanel.classList.remove('hidden'));
    routeFinderClose.addEventListener('click', () => routeFinderPanel.classList.add('hidden'));
    findRouteBtn.addEventListener('click', () => findOptimalRoute());
    clearRouteBtn.addEventListener('click', clearRoute);
    shareRouteBtn.addEventListener('click', shareRoute);

    // Layer toggles
    document.getElementById('toggle-roads')!.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        if (checked) {
            map.addLayer(trafficLayer);
            map.addLayer(roadLayer);
        } else {
            map.removeLayer(trafficLayer);
            map.removeLayer(roadLayer);
        }
    });
    document.getElementById('toggle-pois')!.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) map.addLayer(poiLayer);
        else map.removeLayer(poiLayer);
    });
    document.getElementById('toggle-incidents')!.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) map.addLayer(incidentLayer);
        else map.removeLayer(incidentLayer);
    });

    // AI Assistant
    const { onMouseDown } = makeDraggable(aiAssistantBtn, aiAssistantBtn);
    aiAssistantBtn.addEventListener('mousedown', onMouseDown);
    aiAssistantBtn.addEventListener('click', (e) => {
        // Only open modal if it wasn't a drag
        if (aiAssistantBtn.dataset.dragged !== 'true') {
            const currentMode = document.getElementById('app-container')!.dataset.mode;
            if (currentMode === 'driver' && recognition) {
                try {
                    recognition.start();
                } catch (err) {
                    console.error("Speech recognition start error:", err);
                    // Handle cases where recognition is already running
                }
            } else {
                aiChatModal.classList.remove('hidden');
            }
        }
        aiAssistantBtn.dataset.dragged = 'false';
    });
    aiChatCloseBtn.addEventListener('click', () => {
        aiChatModal.classList.add('hidden');
        // Ensure map interaction is re-enabled when modal is closed
        map.dragging.enable();
        map.scrollWheelZoom.enable();
    });
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleChatMessage();
    });
    // Make chat panel draggable
    const chatPanel = document.querySelector('.chat-panel') as HTMLElement;
    const chatHeader = document.getElementById('ai-chat-header') as HTMLElement;
    const { onMouseDown: onPanelMouseDown } = makeDraggable(chatHeader, chatPanel);
    chatHeader.addEventListener('mousedown', onPanelMouseDown);
    
    // Center on location
    centerLocationBtn.addEventListener('click', () => {
        if (currentUserPosition) {
            map.flyTo([currentUserPosition.lat, currentUserPosition.lng], 16);
        }
    });

    // Report Incident Button
    reportIncidentBtn.addEventListener('click', () => {
        const chatInput = document.getElementById('chat-input') as HTMLInputElement;
        aiChatModal.classList.remove('hidden');
        chatInput.value = translations[currentLang].report_incident_prompt;
        chatInput.focus();
    });

    // Mode Switching
    driverModeBtn.addEventListener('click', () => switchMode('driver'));
    passengerModeBtn.addEventListener('click', () => switchMode('passenger'));

    // Passenger Mode Widgets
    shareLocationBtn.addEventListener('click', shareLiveLocation);
    nearbyPoisBtn.addEventListener('click', () => {
        displayPanel.classList.remove('collapsed');
        setTimeout(() => map.invalidateSize(), 400);
    });

    // Route Preferences
    prefHighways.addEventListener('change', (e) => {
        routePreferences.preferHighways = (e.target as HTMLInputElement).checked;
        if (routePreferences.preferHighways) {
            // Uncheck scenic if highways is checked
            routePreferences.preferScenic = false;
            prefScenic.checked = false;
        }
    });
    prefNoTolls.addEventListener('change', (e) => {
        routePreferences.avoidTolls = (e.target as HTMLInputElement).checked;
    });
    prefScenic.addEventListener('change', (e) => {
        routePreferences.preferScenic = (e.target as HTMLInputElement).checked;
        if (routePreferences.preferScenic) {
            // Uncheck highways if scenic is checked
            routePreferences.preferHighways = false;
            prefHighways.checked = false;
        }
    });
}

function switchMode(newMode: 'driver' | 'passenger') {
    const appContainer = document.getElementById('app-container')!;
    if (appContainer.dataset.mode === newMode) return; // No change

    appContainer.dataset.mode = newMode;

    // Update active button
    document.querySelector('#bottom-menu .menu-item.active')?.classList.remove('active');
    document.getElementById(`${newMode}-mode-btn`)!.classList.add('active');
    
    // Update AI Assistant
    const aiIcon = document.querySelector('#ai-assistant .material-icons') as HTMLElement;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;

    if (newMode === 'passenger') {
        aiIcon.textContent = 'smart_toy';
        chatInput.setAttribute('data-lang-key-placeholder', 'ai_chat_placeholder_passenger');
    } else { // driver
        aiIcon.textContent = 'mic';
        chatInput.setAttribute('data-lang-key-placeholder', 'ai_chat_placeholder');
    }
    updateLanguage(); // Refresh placeholders
}

function updateLanguage() {
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang-key') as keyof typeof translations.en;
        el.textContent = translations[currentLang][key] || translations.en[key];
    });
    const placeholderElements = document.querySelectorAll('[data-lang-key-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-lang-key-placeholder') as keyof typeof translations.en;
        (el as HTMLInputElement).placeholder = translations[currentLang][key] || translations.en[key];
    });
}

// --- Map Layer Functions ---

function addRoadLayers() {
    trafficLayer.clearLayers();
    roadLayer.clearLayers();
    trafficLayer.addData(dorGeoJson);
    roadLayer.addData(dorGeoJson);
    trafficLayer.setStyle(getTrafficStyle);
    roadLayer.setStyle(getRoadStyle);
}

function getTrafficStyle(feature: any) {
    const roadName = feature.properties.name;
    const trafficInfo = mockTrafficData.find(d => d.roadName === roadName);
    const color = trafficInfo?.traffic === 'heavy' ? '#e74c3c' :
                  trafficInfo?.traffic === 'moderate' ? '#f39c12' : '#2ecc71';
    return {
        color: color,
        weight: 10,
        opacity: 0.7
    };
}

function getRoadStyle(feature: any) {
    const status = feature.properties.status;
    return {
        color: 'white',
        weight: 4,
        opacity: 0.8,
        dashArray: status === 'poor' ? '5, 10' : status === 'fair' ? '10, 5' : ''
    };
}

function onEachRoad(feature: any, layer: any) {
    const trafficInfo = mockTrafficData.find(d => d.roadName === feature.properties.name);
    layer.bindPopup(`
        <h3>${feature.properties.name}</h3>
        <p>Status: ${feature.properties.status}</p>
        <p>Traffic: ${trafficInfo ? trafficInfo.traffic : 'N/A'}</p>
    `);
}

function addPoiLayer(items: any[]) {
    poiLayer.clearLayers();
    items.forEach(poi => {
        const iconHtml = `<span class="material-icons" style="color: #3498db;">${poi.type === 'bridge' ? 'location_city' : 'place'}</span>`;
        const marker = L.marker([poi.lat, poi.lng], {
            icon: L.divIcon({
                html: iconHtml,
                className: 'custom-poi-icon',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).bindPopup(`<h3>${poi.name}</h3><p>${poi.status}</p>`);
        (marker as any).poiId = poi.id;
        poiLayer.addLayer(marker);
    });
}

function addIncidentLayer(incidents: any[]) {
    incidentLayer.clearLayers();
    incidents.forEach(incident => {
        const color = incident.type === 'closure' ? '#e74c3c' : '#f39c12';
        const icon = incident.type === 'closure' ? 'block' : 'warning';
        const marker = L.marker([incident.lat, incident.lng], {
            icon: L.divIcon({
                html: `<span class="material-icons" style="color: ${color};">${icon}</span>`,
                className: 'custom-incident-icon',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).bindPopup(`<h3>${incident.name}</h3><p>${incident.status}</p>`);
        (marker as any).incidentId = incident.id;
        incidentLayer.addLayer(marker);
    });
}

// --- UI Panel Functions ---

function populateDisplayPanel() {
    const content = document.getElementById('display-panel-content')!;
    content.innerHTML = '';
    const allItems = [...pois, ...wazeIncidents];

    allItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'info-card';
        card.dataset.id = String(item.id);
        
        let icon, statusClass, typeText;
        if (item.type === 'bridge' || item.type === 'poi') {
            icon = item.type === 'bridge' ? 'location_city' : 'place';
            statusClass = item.status.includes('Good') ? 'good' : 'fair';
            typeText = item.status;
        } else {
            icon = item.type === 'closure' ? 'block' : 'warning';
            statusClass = 'incident';
            typeText = item.status;
        }

        card.innerHTML = `
            <h3><span class="material-icons">${icon}</span> ${item.name}</h3>
            <p>${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
            <span class="card-status ${statusClass}">${typeText}</span>
        `;
        card.addEventListener('click', () => {
            let targetLayer = item.type === 'bridge' || item.type === 'poi' ? poiLayer : incidentLayer;
            let targetIdKey = item.type === 'bridge' || item.type === 'poi' ? 'poiId' : 'incidentId';
            
            targetLayer.eachLayer((layer: any) => {
                if (layer[targetIdKey] === item.id) {
                    map.flyTo(layer.getLatLng(), 15);
                    layer.openPopup();
                }
            });
        });
        content.appendChild(card);
    });
}

// --- Draggable Element Logic ---

function makeDraggable(handleElement: HTMLElement, dragTarget: HTMLElement) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;

    const onMouseDown = (e: MouseEvent) => {
        // Prevent drag on right-click
        if (e.button !== 0) return;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = dragTarget.offsetLeft;
        initialY = dragTarget.offsetTop;

        // Prevent map interaction while dragging the modal
        if (handleElement.id === 'ai-chat-header') {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
        }

        handleElement.style.cursor = 'grabbing';
        dragTarget.style.cursor = 'grabbing';
        // Use a data attribute to distinguish click from drag
        dragTarget.dataset.dragged = 'false';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp, { once: true });
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent text selection

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Set dragged to true only if mouse has moved a certain threshold
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            dragTarget.dataset.dragged = 'true';
        }

        // Calculate new position
        dragTarget.style.left = `${initialX + dx}px`;
        dragTarget.style.top = `${initialY + dy}px`;
    };

    const onMouseUp = () => {
        isDragging = false;

        // Re-enable map interaction
        if (handleElement.id === 'ai-chat-header') {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
        }

        handleElement.style.cursor = 'grab';
        dragTarget.style.cursor = 'default'; // Reset target cursor
        if (dragTarget.id === 'ai-assistant') {
            dragTarget.style.cursor = 'grab'; // Keep FAB cursor as grab
        }

        document.removeEventListener('mousemove', onMouseMove);
    };

    // This function returns the onMouseDown handler to be attached externally
    return { onMouseDown };
}

// --- Geolocation ---

function initGeolocation() {
    const options = {
        enableHighAccuracy: true,
        timeout: 30000, // Increased timeout
        maximumAge: 5000 // Allow using a cached position up to 5s old
    };

    const error = (err: GeolocationPositionError) => {
        console.warn(`Could not get location: ${err.message}`);
        // If high accuracy fails, try low accuracy
        if (highAccuracyWatchId !== null) {
            navigator.geolocation.clearWatch(highAccuracyWatchId);
            highAccuracyWatchId = null;
            lowAccuracyWatchId = navigator.geolocation.watchPosition(updateUserLocation, () => {
                 console.error("Low accuracy location also failed.");
            }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 });
        }
    };

    highAccuracyWatchId = navigator.geolocation.watchPosition(updateUserLocation, error, options);
}

function updateUserLocation(pos: GeolocationPosition) {
    const { latitude, longitude, heading } = pos.coords;
    currentUserPosition = { lat: latitude, lng: longitude, heading: heading };

    const iconHtml = `
        <div class="user-location-icon">
            <div class="pulse"></div>
            <div class="dot"></div>
            ${heading !== null ? `<div class="heading" style="transform: translate(-50%, -100%) rotate(${heading}deg);"></div>` : ''}
        </div>`;

    if (!userLocationMarker) {
        userLocationMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
                html: iconHtml,
                className: '', // No default class
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            })
        }).addTo(map);
        map.flyTo([latitude, longitude], 15);
        // Add "My Location" to POIs
        pois.push({ id: 0, name: "My Location", lat: latitude, lng: longitude, type: 'poi', status: 'You are here', category: 'current_location' });

    } else {
        userLocationMarker.setLatLng([latitude, longitude]);
        userLocationMarker.setIcon(L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        }));
        const myLocationPoi = pois.find(p => p.id === 0);
        if (myLocationPoi) {
            myLocationPoi.lat = latitude;
            myLocationPoi.lng = longitude;
        }
    }
}


// --- Routing ---

function findOptimalRoute() {
    const fromInput = document.getElementById('from-input') as HTMLInputElement;
    const toInput = document.getElementById('to-input') as HTMLInputElement;
    const fromLocationName = fromInput.value.trim();
    const toLocationName = toInput.value.trim();
    const routeDetailsPanel = document.getElementById('route-details')!;

    const fromLocation = pois.find(p => p.name.toLowerCase() === fromLocationName.toLowerCase());
    const toLocation = pois.find(p => p.name.toLowerCase() === toLocationName.toLowerCase());

    if (fromLocationName.toLowerCase() === 'my location' && !currentUserPosition) {
         routeDetailsPanel.innerHTML = `<p style="color: var(--danger-color);">${translations[currentLang].route_finder_error_no_start}</p>`;
         return;
    }
    
    if (!fromLocation || !toLocation) {
        routeDetailsPanel.innerHTML = `<p style="color: var(--danger-color);">${translations[currentLang].route_finder_error}</p>`;
        return;
    }

    // --- Mock route finding logic ---
    const startPoint = L.latLng(fromLocation.lat, fromLocation.lng);
    const endPoint = L.latLng(toLocation.lat, toLocation.lng);

    let latlngs: L.LatLng[];
    let preferenceMessage = '';

    if (routePreferences.preferScenic) {
        // Create a winding path for a scenic route, using a "Local Road" as a waypoint.
        const scenicRoad = dorGeoJson.features.find(f => f.properties.name === "Local Road");
        const scenicMidpoint = scenicRoad 
            ? L.latLng(scenicRoad.geometry.coordinates[1][1], scenicRoad.geometry.coordinates[1][0])
            : L.latLng((startPoint.lat + endPoint.lat) / 2 + 0.015, (startPoint.lng + endPoint.lng) / 2 - 0.01); // fallback
        latlngs = [ startPoint, scenicMidpoint, endPoint ];
        preferenceMessage = translations[currentLang].route_pref_scenic;

    } else if (routePreferences.preferHighways) {
        // Try to snap to the "Prithvi Highway"
        const highway = dorGeoJson.features.find(f => f.properties.name === "Prithvi Highway");
        const highwayMidpoint = highway 
            ? L.latLng(highway.geometry.coordinates[1][1], highway.geometry.coordinates[1][0]) // Note: GeoJSON is [lng, lat]
            : endPoint; // fallback
        latlngs = [ startPoint, highwayMidpoint, endPoint ];
        preferenceMessage = translations[currentLang].route_pref_highways;

    } else {
        // Default "fastest" route is a more direct path (mocked as a straight line)
        latlngs = [ startPoint, endPoint ];
        preferenceMessage = translations[currentLang].route_pref_fastest;
    }
    
    if (routePreferences.avoidTolls) {
        // In a real app, this would influence the pathfinding algorithm.
        // Here, we just add a message and slightly alter the path for visual feedback.
        preferenceMessage += ` ${translations[currentLang].route_pref_avoid_tolls}`;
        if(latlngs.length <= 2) { // If it's a direct route
            // Add a slight deviation to simulate avoiding a toll booth
            const midLat = (startPoint.lat + endPoint.lat) / 2 + 0.005;
            const midLng = (startPoint.lng + endPoint.lng) / 2 + 0.005;
            latlngs.splice(1, 0, L.latLng(midLat, midLng));
        }
    }
    // --- End Mock Logic ---

    clearRoute(); // Clear previous route
    
    const polyline = L.polyline(latlngs, { color: '#3498db', weight: 6, opacity: 0.8 }).addTo(routeLayer);
    map.fitBounds(polyline.getBounds().pad(0.1));

    document.getElementById('route-finder-panel')!.classList.add('hidden');
    document.getElementById('share-route-btn')!.classList.remove('hidden');

    currentRouteCoords = latlngs.map(p => [p.lat, p.lng]);
    currentRouteInfo = { from: fromLocationName, to: toLocationName };

    const { summaryMessage, incidentsOnRoute } = getRouteSummary(polyline);
    routeDetailsPanel.innerHTML = `<p><em>${preferenceMessage}</em></p>` + summaryMessage;

    // Highlight incidents on the route
    if (incidentsOnRoute.length > 0) {
        incidentLayer.eachLayer((layer: any) => {
            if (incidentsOnRoute.some(inc => inc.id === layer.incidentId)) {
                // You could add a special icon or animation here
                layer.openPopup();
            }
        });
    }
}

function getRouteSummary(routeLine: L.Polyline): { summaryMessage: string, incidentsOnRoute: any[], trafficOnRoute: string } {
    // Check for incidents along the route (simple proximity check for demo)
    const routeBounds = routeLine.getBounds();
    const incidentsOnRoute = wazeIncidents.filter(incident => {
        const incidentLatLng = L.latLng(incident.lat, incident.lng);
        // A more complex check like point-to-line distance would be better in a real app
        return routeBounds.contains(incidentLatLng);
    });

    // Check for traffic on roads intersected by the route
    const intersectedRoads = dorGeoJson.features.filter((road: any) => {
        const roadLine = L.geoJSON(road);
        return routeBounds.intersects(roadLine.getBounds());
    });
    const trafficLevels = intersectedRoads.map((road: any) => mockTrafficData.find(t => t.roadName === road.properties.name)?.traffic);
    let overallTraffic = "clear";
    if (trafficLevels.includes("heavy")) overallTraffic = "heavy";
    else if (trafficLevels.includes("moderate")) overallTraffic = "moderate";


    let summaryMessage = `<p>Optimal route found. Traffic is currently <strong>${overallTraffic}</strong>.</p>`;
    if (incidentsOnRoute.length > 0) {
        summaryMessage = `
            <div class="route-warning">
                <span class="material-icons">warning</span>
                <div>
                    Heads up! Traffic is <strong>${overallTraffic}</strong>.
                    There ${incidentsOnRoute.length === 1 ? 'is' : 'are'} <strong>${incidentsOnRoute.length}</strong> incident(s) reported along your route.
                </div>
            </div>`;
    }

    return { summaryMessage, incidentsOnRoute, trafficOnRoute: overallTraffic };
}

function clearRoute() {
    routeLayer.clearLayers();
    document.getElementById('share-route-btn')!.classList.add('hidden');
    document.getElementById('route-details')!.innerHTML = '';
    const fromInput = document.getElementById('from-input') as HTMLInputElement;
    const toInput = document.getElementById('to-input') as HTMLInputElement;
    fromInput.value = '';
    toInput.value = '';
    currentRouteCoords = null;
    currentRouteInfo = null;
}

function shareRoute() {
    if (!currentRouteCoords || !currentRouteInfo) return;

    // Get summary again to ensure it's up to date
    const routeLine = L.polyline(currentRouteCoords as L.LatLng[]);
    const { incidentsOnRoute, trafficOnRoute } = getRouteSummary(routeLine);
    const incidentIds = incidentsOnRoute.map(i => i.id).join(',');

    const routeString = `${currentRouteInfo.from};${currentRouteInfo.to}`;
    const url = new URL(window.location.href);
    url.searchParams.set('route', routeString);
    if (incidentIds) url.searchParams.set('incidents', incidentIds);
    if (trafficOnRoute) url.searchParams.set('traffic', trafficOnRoute);

    let incidentText = '';
    if (incidentsOnRoute.length > 0) {
        incidentText = ` Heads up, there ${incidentsOnRoute.length === 1 ? 'is 1 incident' : `are ${incidentsOnRoute.length} incidents`} reported along the way.`;
    }

    const shareText = `Check out my route on Sadak Sathi from ${currentRouteInfo.from} to ${currentRouteInfo.to}! Traffic is currently ${trafficOnRoute}.${incidentText}`;

    if (navigator.share) {
        navigator.share({
            title: 'My Sadak Sathi Route',
            text: shareText,
            url: url.toString()
        }).catch(console.error);
    } else {
        const clipboardText = `${shareText} ${url.toString()}`;
        navigator.clipboard.writeText(clipboardText).then(() => {
            showToast(translations[currentLang].link_copied);
        });
    }
}

function showToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// --- AI Assistant ---

const tools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "add_incident",
                description: "Reports a traffic incident at the user's current location. Use this for commands like 'Report traffic ahead', 'There's an accident', or 'Road is blocked'. The description should summarize the user's report (e.g., 'heavy traffic', 'accident').",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING,
                            description: "A description of the incident (e.g., 'heavy traffic', 'accident', 'pothole')."
                        },
                        location: {
                            type: Type.STRING,
                            description: "Optional location of the incident if not the user's current location."
                        }
                    },
                    required: ["description"]
                }
            },
            {
                name: "start_navigation",
                description: "Initiates turn-by-turn navigation from the user's current GPS location to a specified destination. Use this for commands like 'Navigate to [destination]', 'Get directions to [destination]', or 'Take me to [destination]'.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        destination_name: {
                            type: Type.STRING,
                            description: "The name of the destination point of interest (POI)."
                        }
                    },
                    required: ["destination_name"]
                }
            },
            {
                name: "find_nearby_pois",
                description: "Finds points of interest (POIs) of a specific category near the user's current location.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        category: {
                            type: Type.STRING,
                            description: "The category of POI to search for (e.g., 'coffee shop', 'atm', 'hospital')."
                        }
                    },
                    required: ["category"]
                }
            }
        ]
    }
];

async function handleChatMessage(userMessageOverride?: string) {
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const userMessage = userMessageOverride || chatInput.value;
    if (!userMessage.trim()) return;

    addMessageToChat('user', userMessage);
    chatInput.value = '';
    document.getElementById('typing-indicator')!.classList.remove('hidden');

    const visiblePois = getVisibleFeatures(poiLayer, 'poiId', pois);
    const visibleIncidents = getVisibleFeatures(incidentLayer, 'incidentId', wazeIncidents);
    const currentMode = document.getElementById('app-container')!.dataset.mode;
    
    const activeRoute = currentRouteInfo ? `An active route is set from ${currentRouteInfo.from} to ${currentRouteInfo.to}.` : "No active route.";

    const context = `
        The user is currently in "${currentMode}" mode.
        ${activeRoute}
        User's routing preferences: ${JSON.stringify(routePreferences)}.
        Current traffic on major roads: ${JSON.stringify(mockTrafficData)}.
        Visible points of interest on the map: ${JSON.stringify(visiblePois.map(p => ({ name: p.name, category: p.category, status: p.status })))}.
        Visible incidents on the map: ${JSON.stringify(visibleIncidents.map(i => ({ name: i.name, type: i.type, status: i.status })))}.
    `;
    
    const driverPersona = `You are a voice-first, hands-free AI co-pilot for a driver. Be concise. Your primary functions are navigation and reporting incidents.`;
    const passengerPersona = `You are a helpful AI tour guide for a passenger. Your primary functions are finding interesting places and providing information about the surroundings.`;
    const systemInstruction = (currentMode === 'driver' ? driverPersona : passengerPersona) + context;


    try {
        // Fix: `tools` and `systemInstruction` must be in a `config` object.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [...chatHistory, { role: "user", parts: [{ text: userMessage }] }],
            config: {
                tools: tools,
                systemInstruction: systemInstruction,
            },
        });

        document.getElementById('typing-indicator')!.classList.add('hidden');

        const call = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
        if (call) {
            const { name, args } = call;
            let functionResponse = '';

            if (name === 'add_incident') {
                if (!currentUserPosition) {
                    functionResponse = "Sorry, I can't determine your location to add an incident.";
                } else {
                    // Fix: Cast `args.description` from `unknown` to `string` to satisfy type requirements.
                    const description = String(args.description);
                    const newIncident = {
                        id: wazeIncidents.length + pois.length + 1,
                        name: description,
                        lat: currentUserPosition.lat,
                        lng: currentUserPosition.lng,
                        type: 'user_report',
                        status: 'Just reported'
                    };
                    wazeIncidents.push(newIncident);
                    addIncidentLayer(wazeIncidents);
                    populateDisplayPanel();
                    functionResponse = `OK, I've reported "${description}" at your current location.`;
                    showToast(`Reported: ${description}`);
                }
            } else if (name === 'start_navigation') {
                // Fix: Cast `args.destination_name` from `unknown` to `string` before calling `.toLowerCase()`.
                const destinationName = String(args.destination_name);
                const destination = pois.find(p => p.name.toLowerCase() === destinationName.toLowerCase());
                if (destination && currentUserPosition) {
                    (document.getElementById('from-input') as HTMLInputElement).value = 'My Location';
                    (document.getElementById('to-input') as HTMLInputElement).value = destination.name;
                    findOptimalRoute();
                    functionResponse = `Starting navigation to ${destination.name}.`;
                } else {
                    functionResponse = `Sorry, I couldn't find a destination named "${destinationName}".`;
                }
            } else if (name === 'find_nearby_pois') {
                 if (!currentUserPosition) {
                    functionResponse = "Sorry, I can't determine your location to find nearby places.";
                } else {
                    // Fix: Cast `args.category` from `unknown` to `string` before calling `.toLowerCase()`.
                    const categoryArg = String(args.category);
                    const category = categoryArg.toLowerCase().replace(/s$/, ''); // singularize
                    const nearby = pois
                        .filter(p => p.category.includes(category))
                        .map(p => ({...p, distance: getDistance(currentUserPosition!, { lat: p.lat, lng: p.lng }) }))
                        .filter(p => p.distance < 2) // within 2km
                        .sort((a,b) => a.distance - b.distance)
                        .slice(0, 5);
                    
                    if (nearby.length > 0) {
                        functionResponse = `Here are some nearby ${categoryArg}:`;
                        addMessageToChat('ai', functionResponse, nearby);
                        return; // Exit here as we've added a custom message
                    } else {
                        functionResponse = `Sorry, I couldn't find any ${categoryArg} nearby.`;
                    }
                }
            } else {
                functionResponse = `Unknown tool: ${name}`;
            }

            addMessageToChat('ai', functionResponse);

        } else {
            // Handle text response
            const text = response.text.trim();
            addMessageToChat('ai', text);
        }

    } catch (error) {
        console.error("AI chat error:", error);
        addMessageToChat('ai', "Sorry, I'm having trouble connecting right now.");
        document.getElementById('typing-indicator')!.classList.add('hidden');
    }
}

function addMessageToChat(sender: 'user' | 'ai', text: string, poiSuggestions: any[] = []) {
    const chatMessages = document.getElementById('chat-messages')!;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const p = document.createElement('p');
    p.textContent = text;
    messageDiv.appendChild(p);
    
    // Add POI suggestion buttons if any
    if (poiSuggestions.length > 0) {
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'poi-suggestions';
        poiSuggestions.forEach(poi => {
            const btn = document.createElement('button');
            btn.className = 'poi-suggestion-btn';
            btn.textContent = `${poi.name} (${poi.distance.toFixed(1)} km)`;
            btn.onclick = () => {
                (document.getElementById('from-input') as HTMLInputElement).value = 'My Location';
                (document.getElementById('to-input') as HTMLInputElement).value = poi.name;
                findOptimalRoute();
                document.getElementById('ai-chat-modal')!.classList.add('hidden');
            };
            suggestionsContainer.appendChild(btn);
        });
        messageDiv.appendChild(suggestionsContainer);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Update history, keeping it to a reasonable size
    chatHistory.push({ role: sender, parts: [{ text }] });
    if (chatHistory.length > 10) {
        chatHistory.splice(0, 2); // Remove oldest user/ai pair
    }
}

function getVisibleFeatures(layerGroup: L.FeatureGroup, idKey: string, sourceArray: any[]): any[] {
    const visible: any[] = [];
    const mapBounds = map.getBounds();
    layerGroup.eachLayer((layer: any) => {
        if (mapBounds.contains(layer.getLatLng())) {
            const feature = sourceArray.find(item => item.id === layer[idKey]);
            if (feature) {
                visible.push(feature);
            }
        }
    });
    return visible;
}


// --- Speech Recognition ---
function initSpeechRecognition() {
    if (!SpeechRecognition) {
        console.warn("Speech Recognition not supported in this browser.");
        return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const aiBtn = document.getElementById('ai-assistant')!;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;

    recognition.onstart = () => {
        aiBtn.classList.add('listening');
        chatInput.setAttribute('data-lang-key-placeholder', 'ai_chat_placeholder_listening');
        updateLanguage();
        document.getElementById('ai-chat-modal')!.classList.remove('hidden');
        addMessageToChat('ai', translations[currentLang].ai_chat_placeholder_listening);
    };

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Remove the "Listening..." message before showing the user's message
        const messages = document.getElementById('chat-messages')!;
        if (messages.lastChild) messages.removeChild(messages.lastChild);
        
        handleChatMessage(transcript);
    };

    recognition.onspeechend = () => {
        recognition.stop();
    };

    recognition.onend = () => {
        aiBtn.classList.remove('listening');
        const currentMode = document.getElementById('app-container')!.dataset.mode;
        const placeholderKey = currentMode === 'passenger' ? 'ai_chat_placeholder_passenger' : 'ai_chat_placeholder';
        chatInput.setAttribute('data-lang-key-placeholder', placeholderKey);
        updateLanguage();
    };

    recognition.onerror = (event: any) => {
        let errorMessage = translations[currentLang].voice_error_no_speech;
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
             errorMessage = translations[currentLang].voice_error_mic_problem;
        }
        addMessageToChat('ai', errorMessage);
        console.error("Speech recognition error:", event.error);
    };
}

// --- URL Handling & Simulation ---

function handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const routeParam = params.get('route');
    const incidentsParam = params.get('incidents');
    const trafficParam = params.get('traffic');

    if (routeParam) {
        const [from, to] = routeParam.split(';');
        if (from && to) {
            (document.getElementById('from-input') as HTMLInputElement).value = from;
            (document.getElementById('to-input') as HTMLInputElement).value = to;
            findOptimalRoute();
            
            if (incidentsParam || trafficParam) {
                let details = `Shared route loaded. Traffic is reportedly <strong>${trafficParam || 'unknown'}</strong>.`;
                if (incidentsParam) {
                    const incidentIds = incidentsParam.split(',').map(Number);
                    details += ` Highlighting ${incidentIds.length} shared incident(s).`;
                     incidentLayer.eachLayer((layer: any) => {
                        if (incidentIds.includes(layer.incidentId)) {
                            layer.openPopup();
                        }
                    });
                }
                 document.getElementById('route-details')!.innerHTML = `<p>${details}</p>`;
            }
        }
    }
}

function updateAndRefreshTraffic() {
    // Simulate traffic changes
    mockTrafficData.forEach(road => {
        const rand = Math.random();
        if (rand < 0.1) road.traffic = "heavy";
        else if (rand < 0.4) road.traffic = "moderate";
        else road.traffic = "clear";
    });
    // Refresh traffic layer style
    trafficLayer.setStyle(getTrafficStyle);
}

// --- Helpers ---
function getDistance(pos1: { lat: number, lng: number }, pos2: { lat: number, lng: number }) {
    const R = 6371; // Radius of the earth in km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function shareLiveLocation() {
    if (!currentUserPosition) {
        alert("Current location not available.");
        return;
    }
    const url = new URL(window.location.href);
    url.search = ''; // Clear other params
    url.searchParams.set('lat', String(currentUserPosition.lat));
    url.searchParams.set('lng', String(currentUserPosition.lng));
    
    const shareText = `I'm here! Check out my live location on Sadak Sathi: ${url.toString()}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Live Location',
            text: shareText,
            url: url.toString()
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url.toString()).then(() => {
            showToast(translations[currentLang].link_copied);
        });
    }
}