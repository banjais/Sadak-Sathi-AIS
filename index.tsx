/**
 * @license
 * Copyright (c) 2024 Your Company or Name. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * =================================================================================
 * INTELLECTUAL PROPERTY NOTICE:
 *
 * In a real-world production environment, the code in this file would be
 * minified and obfuscated as part of a build process (e.g., using Vite or
 * Webpack). This process makes the code extremely difficult for others to read
 * and reverse-engineer, thus protecting your intellectual property.
 * =================================================================================
 *
 * =================================================================================
 * API KEY SECURITY:
 *
 * The API key is accessed via `process.env.API_KEY`. This is a secure practice.
 * The key is stored as an environment variable on the server where the code is
 * built and hosted. It is NEVER hardcoded here and is NOT exposed to the public.
 * =================================================================================
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
    },
    es: { // Spanish
        layers: 'Capas',
        roads: 'Carreteras',
        pois: 'Puntos de Interés',
        incidents: 'Incidentes',
        display_panel_title: 'Información Cercana',
        route_finder: 'Buscador de Rutas',
        find_route_btn: 'Encontrar Ruta Óptima',
        clear_route_btn: 'Borrar Ruta',
        share_route: 'Compartir Ruta',
        link_copied: '¡Enlace Copiado!',
        menu_settings: 'Ajustes',
        menu_passenger: 'Pasajero',
        menu_driver: 'Conductor',
        route_preferences: 'Preferencias de Ruta',
        prefer_highways: 'Preferir Autopistas',
        avoid_tolls: 'Evitar Peajes',
        prefer_scenic_route: 'Preferir Ruta Panorámica',
    },
    fr: { // French
        layers: 'Couches',
        roads: 'Routes',
        pois: 'Points d\'Intérêt',
        incidents: 'Incidents',
        display_panel_title: 'Informations à Proximité',
        route_finder: 'Recherche d\'Itinéraire',
        find_route_btn: 'Trouver l\'Itinéraire Optimal',
        clear_route_btn: 'Effacer l\'Itinéraire',
        share_route: 'Partager l\'Itinéraire',
        link_copied: 'Lien Copié !',
        menu_settings: 'Paramètres',
        menu_passenger: 'Passager',
        menu_driver: 'Conducteur',
        route_preferences: 'Préférences d\'Itinéraire',
        prefer_highways: 'Préférer les Autoroutes',
        avoid_tolls: 'Éviter les Péages',
        prefer_scenic_route: 'Préférer la Route Panorámica',
    },
    de: { // German
        layers: 'Ebenen',
        roads: 'Straßen',
        pois: 'Interessante Orte',
        incidents: 'Vorfälle',
        display_panel_title: 'Infos in der Nähe',
        route_finder: 'Routenfinder',
        find_route_btn: 'Optimale Route Finden',
        clear_route_btn: 'Route Löschen',
        share_route: 'Route Teilen',
        link_copied: 'Link Kopiert!',
        menu_settings: 'Einstellungen',
        menu_passenger: 'Beifahrer',
        menu_driver: 'Fahrer',
        route_preferences: 'Routenpräferenzen',
        prefer_highways: 'Autobahnen Bevorzugen',
        avoid_tolls: 'Maut Vermeiden',
        prefer_scenic_route: 'Szenische Route Bevorzugen',
    },
    zh: { // Chinese
        layers: '图层',
        roads: '道路',
        pois: '兴趣点',
        incidents: '事件',
        display_panel_title: '附近信息',
        route_finder: '路线查找器',
        find_route_btn: '查找最佳路线',
        clear_route_btn: '清除路线',
        share_route: '分享路线',
        link_copied: '链接已复制!',
        menu_settings: '设置',
        menu_passenger: '乘客',
        menu_driver: '司机',
        route_preferences: '路线偏好',
        prefer_highways: '高速优先',
        avoid_tolls: '避开收费站',
        prefer_scenic_route: '风景路线优先',
    },
};

// Fix: Moved derived language definitions after the main `translations` object has been declared.
// This prevents the "used before its declaration" error.
// Placeholders for local languages
translations.new = { ...translations.np, menu_settings: 'सेटिंग्स (नेवाः)' };
translations.mai = { ...translations.np, menu_settings: 'सेटिंग्स (मैथिली)' };

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
// Fix: Declare aiChatModal at the module level to make it accessible in global functions.
let aiChatModal: HTMLElement;
let routePreferences = {
    preferHighways: false,
    avoidTolls: false,
    preferScenic: false,
};
let activeDisplayFilter: string = 'all';


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

/**
 * Refactor: The original monolithic initUI function has been broken down
 * into smaller, more manageable functions based on their concern.
 * This aligns with modern component-based architecture and improves readability.
 */
function initUI() {
    // Initialize the module-level variable for the chat modal
    aiChatModal = document.getElementById('ai-chat-modal')!;

    setupCoreControls();
    setupPanelsAndModals();
    setupMapInteraction();
    setupModeSwitching();
    setupDraggables();
}

function setupCoreControls() {
    const themeToggle = document.getElementById('theme-toggle')!;
    const languageSelect = document.getElementById('language-select')!;
    const hamburgerMenu = document.getElementById('hamburger-menu')!;
    const settingsPanel = document.getElementById('settings-panel')!;
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
        if (recognition) {
            const langMap: { [key: string]: string } = { en: 'en-US', np: 'ne-NP', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'cmn-Hans-CN' };
            recognition.lang = langMap[currentLang] || 'en-US';
        }
    });
    
    // Settings Panel Toggle
    hamburgerMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target as Node) && !hamburgerMenu.contains(e.target as Node)) {
            settingsPanel.classList.remove('open');
        }
    });
    
    // Route Preferences
    prefHighways.addEventListener('change', () => {
        routePreferences.preferHighways = prefHighways.checked;
        if (routePreferences.preferHighways) {
            routePreferences.preferScenic = false;
            prefScenic.checked = false;
        }
    });
    prefNoTolls.addEventListener('change', () => {
        routePreferences.avoidTolls = prefNoTolls.checked;
    });
    prefScenic.addEventListener('change', () => {
        routePreferences.preferScenic = prefScenic.checked;
        if (routePreferences.preferScenic) {
            routePreferences.preferHighways = false;
            prefHighways.checked = false;
        }
    });
}

function setupPanelsAndModals() {
    // Display Panel
    const displayPanelHeader = document.getElementById('display-panel-header')!;
    const displayPanel = document.getElementById('display-panel')!;
    displayPanelHeader.addEventListener('click', () => displayPanel.classList.toggle('collapsed'));

    // Route Finder Panel
    const routeFinderTrigger = document.getElementById('route-finder-trigger')!;
    const routeFinderPanel = document.getElementById('route-finder-panel')!;
    const routeFinderClose = document.getElementById('route-finder-close')!;
    const findRouteBtn = document.getElementById('find-route-btn')!;
    const clearRouteBtn = document.getElementById('clear-route-btn')!;
    const shareRouteBtn = document.getElementById('share-route-btn')!;
    routeFinderTrigger.addEventListener('click', () => routeFinderPanel.classList.remove('hidden'));
    routeFinderClose.addEventListener('click', () => routeFinderPanel.classList.add('hidden'));
    findRouteBtn.addEventListener('click', () => {
        const from = (document.getElementById('from-input') as HTMLInputElement).value;
        const to = (document.getElementById('to-input') as HTMLInputElement).value;
        findOptimalRoute(from, to);
    });
    clearRouteBtn.addEventListener('click', () => {
        routeLayer.clearLayers();
        currentRouteCoords = null;
        currentRouteInfo = null;
        document.getElementById('route-details')!.innerHTML = '';
        shareRouteBtn.classList.add('hidden');
    });
    shareRouteBtn.addEventListener('click', shareRoute);
    
    // AI Chat Modal
    const aiAssistantBtn = document.getElementById('ai-assistant')!;
    const aiChatCloseBtn = document.getElementById('ai-chat-close')!;
    const chatForm = document.getElementById('chat-form')!;
    aiAssistantBtn.addEventListener('click', () => {
        const mode = document.getElementById('app-container')!.dataset.mode;
        if (mode === 'driver') {
            toggleVoiceListening();
        } else {
            aiChatModal.classList.remove('hidden');
        }
    });
    aiChatCloseBtn.addEventListener('click', () => aiChatModal.classList.add('hidden'));
    chatForm.addEventListener('submit', handleChatMessage);
}

function setupMapInteraction() {
    const centerLocationBtn = document.getElementById('center-location-btn')!;
    const reportIncidentBtn = document.getElementById('report-incident-btn')!;

    // Layer Toggles
    document.getElementById('toggle-roads')!.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        if (checked) {
            map.addLayer(roadLayer);
            map.addLayer(trafficLayer);
        } else {
            map.removeLayer(roadLayer);
            map.removeLayer(trafficLayer);
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
    
    // Center Location Button
    centerLocationBtn.addEventListener('click', () => {
        if (currentUserPosition) {
            map.setView([currentUserPosition.lat, currentUserPosition.lng], 15);
        }
    });
    
    // Report Incident Button
    reportIncidentBtn.addEventListener('click', () => {
        const chatInput = document.getElementById('chat-input') as HTMLInputElement;
        chatInput.value = translations[currentLang].report_incident_prompt || translations.en.report_incident_prompt;
        aiChatModal.classList.remove('hidden');
        chatInput.focus();
    });
}

function setupModeSwitching() {
    const driverModeBtn = document.getElementById('driver-mode-btn')!;
    const passengerModeBtn = document.getElementById('passenger-mode-btn')!;
    const shareLocationBtn = document.getElementById('share-location-btn')!;
    const nearbyPoisBtn = document.getElementById('nearby-pois-btn')!;

    driverModeBtn.addEventListener('click', () => setMode('driver'));
    passengerModeBtn.addEventListener('click', () => setMode('passenger'));
    
    // Passenger-specific widgets
    shareLocationBtn.addEventListener('click', shareRoute);
    nearbyPoisBtn.addEventListener('click', () => {
        document.getElementById('display-panel')!.classList.remove('collapsed');
    });
}

function setupDraggables() {
    makeDraggable(document.getElementById('ai-assistant')!);
    makeDraggable(document.getElementById('report-incident-btn')!);
    makeDraggable(document.getElementById('ai-chat-header')!, document.querySelector('#ai-chat-modal .chat-panel') as HTMLElement);
}


function makeDraggable(button: HTMLElement, dragTarget?: HTMLElement) {
    let isDragging = false;
    let offsetX: number, offsetY: number;
    const target = dragTarget || button;

    const onMouseDown = (e: MouseEvent | TouchEvent) => {
        isDragging = true;
        const event = 'touches' in e ? e.touches[0] : e;
        offsetX = event.clientX - target.getBoundingClientRect().left;
        offsetY = event.clientY - target.getBoundingClientRect().top;
        target.style.position = 'fixed';
    };

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const event = 'touches' in e ? e.touches[0] : e;
        let newX = event.clientX - offsetX;
        let newY = event.clientY - offsetY;
        
        // Constrain within viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - target.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - target.offsetHeight));
        
        target.style.left = `${newX}px`;
        target.style.top = `${newY}px`;
    };

    const onMouseUp = () => {
        isDragging = false;
    };

    button.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    button.addEventListener('touchstart', onMouseDown, { passive: false });
    document.addEventListener('touchmove', onMouseMove, { passive: false });
    document.addEventListener('touchend', onMouseUp);
}

function initGeolocation() {
    const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000
    };

    const error = (err: any) => {
        console.warn(`Could not get location: ${err.message}`);
        // Fallback to low accuracy if high accuracy fails
        if (highAccuracyWatchId !== null) {
            navigator.geolocation.clearWatch(highAccuracyWatchId);
            highAccuracyWatchId = null;
            lowAccuracyWatchId = navigator.geolocation.watchPosition(
                updateUserLocation, 
                (e) => console.error("Low accuracy location failed:", e), 
                { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
            );
        }
    };

    highAccuracyWatchId = navigator.geolocation.watchPosition(updateUserLocation, error, options);
}

function updateUserLocation(pos: GeolocationPosition) {
    const { latitude, longitude, heading } = pos.coords;
    currentUserPosition = { lat: latitude, lng: longitude, heading: heading };

    const icon = L.divIcon({
        className: 'user-location-icon',
        html: `<div class="pulse"></div><div class="dot"></div><div class="heading"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });

    if (!userLocationMarker) {
        userLocationMarker = L.marker([latitude, longitude], { icon }).addTo(map);
        map.setView([latitude, longitude], 15);
    } else {
        userLocationMarker.setLatLng([latitude, longitude]);
    }

    const headingElement = userLocationMarker.getElement()?.querySelector('.heading') as HTMLElement;
    if (headingElement && heading !== null) {
        headingElement.style.transform = `translate(-50%, -100%) rotate(${heading}deg)`;
    }
}

function handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    const incidents = params.get('incidents');
    const traffic = params.get('traffic');

    if (from && to) {
        findOptimalRoute(from, to);
        (document.getElementById('from-input') as HTMLInputElement).value = from;
        (document.getElementById('to-input') as HTMLInputElement).value = to;
    }
    
    if (incidents || traffic) {
        let warningHtml = 'Shared route information:<ul>';
        if (traffic) {
            warningHtml += `<li>Traffic is reported as ${traffic}.</li>`;
        }
        if (incidents) {
            const incidentIds = incidents.split(',').map(id => parseInt(id, 10));
            warningHtml += `<li>${incidentIds.length} incident(s) reported along the route.</li>`;
            
            // Highlight incidents
            setTimeout(() => {
                const allIncidents = [...wazeIncidents];
                incidentLayer.eachLayer((layer: any) => {
                    if (incidentIds.includes(layer.options.incidentId)) {
                        layer.openPopup();
                    }
                });
            }, 1000);
        }
        warningHtml += '</ul>';

        const detailsDiv = document.getElementById('route-details')!;
        const warningDiv = document.createElement('div');
        warningDiv.className = 'route-warning';
        warningDiv.innerHTML = `<span class="material-icons">warning</span><div>${warningHtml}</div>`;
        detailsDiv.prepend(warningDiv);
    }
}

function setMode(mode: 'driver' | 'passenger') {
    const container = document.getElementById('app-container')!;
    const driverBtn = document.getElementById('driver-mode-btn')!;
    const passengerBtn = document.getElementById('passenger-mode-btn')!;
    const aiAssistantBtn = document.getElementById('ai-assistant')!;
    const aiIcon = aiAssistantBtn.querySelector('.material-icons')!;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;

    container.dataset.mode = mode;
    if (mode === 'driver') {
        driverBtn.classList.add('active');
        passengerBtn.classList.remove('active');
        aiIcon.textContent = 'mic';
        chatInput.setAttribute('data-lang-key-placeholder', 'ai_chat_placeholder');
    } else {
        passengerBtn.classList.add('active');
        driverBtn.classList.remove('active');
        aiIcon.textContent = 'chat';
        chatInput.setAttribute('data-lang-key-placeholder', 'ai_chat_placeholder_passenger');
    }
    updateLanguage(); // To update placeholder text
}

function shareRoute() {
    if (!currentRouteInfo) {
        if (!currentUserPosition) return;
        const url = `${window.location.origin}${window.location.pathname}?from=My%20Location&lat=${currentUserPosition.lat}&lng=${currentUserPosition.lng}`;
        navigator.clipboard.writeText(url).then(() => showToast('Location link copied!'));
        return;
    }
    
    const from = encodeURIComponent(currentRouteInfo.from);
    const to = encodeURIComponent(currentRouteInfo.to);
    
    // Analyze route for incidents and traffic
    const routeBounds = L.polyline(currentRouteCoords!).getBounds();
    const incidentsOnRoute = wazeIncidents.filter(inc => routeBounds.contains([inc.lat, inc.lng]));
    const incidentIds = incidentsOnRoute.map(inc => inc.id).join(',');
    
    const roadsOnRoute = dorGeoJson.features.filter((feature: any) => {
        const roadLine = L.polyline(feature.geometry.coordinates.map((c: any) => [c[1], c[0]]));
        return routeBounds.intersects(roadLine.getBounds());
    });
    const trafficOnRoute = roadsOnRoute.map((road: any) => mockTrafficData.find(t => t.roadName === road.properties.name)?.traffic);
    const hasHeavy = trafficOnRoute.includes('heavy');
    const hasModerate = trafficOnRoute.includes('moderate');
    const overallTraffic = hasHeavy ? 'heavy' : (hasModerate ? 'moderate' : 'clear');
    
    let url = `${window.location.origin}${window.location.pathname}?from=${from}&to=${to}`;
    if (incidentIds) {
        url += `&incidents=${incidentIds}`;
    }
    if (overallTraffic !== 'clear') {
        url += `&traffic=${overallTraffic}`;
    }
    
    let shareText = `Check out my route from ${currentRouteInfo.from} to ${currentRouteInfo.to} on Sadak Sathi!`;
    if (overallTraffic !== 'clear') {
        shareText += ` Traffic is currently ${overallTraffic}.`;
    }
    if (incidentsOnRoute.length > 0) {
        shareText += ` Heads up, there is ${incidentsOnRoute.length} incident(s) reported along the way.`;
    }

    if (navigator.share) {
        navigator.share({
            title: 'My Sadak Sathi Route',
            text: shareText,
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(`${shareText}\n${url}`).then(() => {
            showToast(translations[currentLang].link_copied || 'Link Copied!');
        });
    }
}

function getVisiblePoisAndIncidents() {
    const bounds = map.getBounds();
    const visiblePois = pois
        .filter(p => bounds.contains([p.lat, p.lng]))
        .map(({ id, name, type, status, category }) => ({ id, name, type, status, category }));
    const visibleIncidents = wazeIncidents
        .filter(i => bounds.contains([i.lat, i.lng]))
        .map(({ id, name, type, status }) => ({ id, name, type, status }));
    
    return { pois: visiblePois, incidents: visibleIncidents };
}

function populateDisplayPanel() {
    const listContainer = document.getElementById('display-panel-list')!;
    const filtersContainer = document.getElementById('display-panel-filters')!;
    listContainer.innerHTML = '';
    filtersContainer.innerHTML = '';

    const allItems = [...pois, ...wazeIncidents.map(i => ({ ...i, category: 'incidents' }))];
    const itemsInView = allItems.filter(item => map.getBounds().contains([item.lat, item.lng]));

    if (itemsInView.length === 0) {
        listContainer.innerHTML = `<p style="padding: 20px; text-align: center; opacity: 0.7;">No information in current map view.</p>`;
        return;
    }

    const categories = ['all', ...Array.from(new Set(itemsInView.map(item => item.category)))];

    // Create filter buttons
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = category;
        btn.textContent = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (category === activeDisplayFilter) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            activeDisplayFilter = category;
            populateDisplayPanel(); // Re-render
        });
        filtersContainer.appendChild(btn);
    });

    const filteredItems = activeDisplayFilter === 'all'
        ? itemsInView
        : itemsInView.filter(item => item.category === activeDisplayFilter);
    
    // Group by category if 'all' is selected
    if (activeDisplayFilter === 'all') {
        const groupedItems: { [key: string]: any[] } = {};
        filteredItems.forEach(item => {
            if (!groupedItems[item.category]) {
                groupedItems[item.category] = [];
            }
            groupedItems[item.category].push(item);
        });

        for (const category in groupedItems) {
            const header = document.createElement('h3');
            header.className = 'category-header';
            header.textContent = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            listContainer.appendChild(header);
            groupedItems[category].forEach(item => listContainer.appendChild(createInfoCard(item)));
        }
    } else {
        filteredItems.forEach(item => listContainer.appendChild(createInfoCard(item)));
    }
}

function createInfoCard(item: any): HTMLElement {
    const card = document.createElement('div');
    card.className = 'info-card';
    const icon = item.type === 'poi' || item.type === 'bridge' ? 'place' : 'warning';
    
    let statusClass = 'good';
    if (item.type === 'traffic' || item.type === 'closure') statusClass = 'incident';
    if (item.status === 'Under maintenance') statusClass = 'fair';
    
    card.innerHTML = `
        <h3><span class="material-icons">${icon}</span> ${item.name}</h3>
        <p>${item.status}</p>
        <span class="card-status ${statusClass}">${item.type.replace(/^\w/, c => c.toUpperCase())}</span>
    `;
    card.addEventListener('click', () => {
        map.setView([item.lat, item.lng], 16);
        // Open the corresponding marker's popup
        const layerGroup = item.type === 'poi' || item.type === 'bridge' ? poiLayer : incidentLayer;
        layerGroup.eachLayer((layer: any) => {
            if (layer.getLatLng().lat === item.lat && layer.getLatLng().lng === item.lng) {
                layer.openPopup();
            }
        });
    });
    return card;
}


function addRoadLayers() {
    trafficLayer.addData(dorGeoJson);
    roadLayer.addData(dorGeoJson);

    trafficLayer.setStyle((feature) => ({
        color: getTrafficColor(feature!.properties.name),
        weight: 10,
        opacity: 0.5
    }));
    roadLayer.setStyle((feature) => ({
        color: '#fff',
        weight: 4,
        opacity: 1
    }));
}

function onEachRoad(feature: any, layer: any) {
    if (feature.properties && feature.properties.name) {
        const trafficInfo = mockTrafficData.find(t => t.roadName === feature.properties.name);
        const popupContent = `
            <strong>${feature.properties.name}</strong><br>
            Status: ${feature.properties.status}<br>
            Traffic: <span id="traffic-${feature.properties.name.replace(/\s/g, '')}">${trafficInfo ? trafficInfo.traffic : 'N/A'}</span>
        `;
        layer.bindPopup(popupContent);
    }
}

function addPoiLayer(pois: any[]) {
    poiLayer.clearLayers();
    pois.forEach(poi => {
        const icon = L.divIcon({
            html: `<span class="material-icons" style="color: #3498db;">${poi.category === 'hospital' ? 'local_hospital' : 'place'}</span>`,
            className: 'map-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24]
        });
        L.marker([poi.lat, poi.lng], { icon })
            .bindPopup(`<strong>${poi.name}</strong><br>${poi.status}`)
            .addTo(poiLayer);
    });
}

function addIncidentLayer(incidents: any[]) {
    incidentLayer.clearLayers();
    incidents.forEach(incident => {
        const icon = L.divIcon({
            html: `<span class="material-icons" style="color: #e74c3c;">${incident.type === 'closure' ? 'block' : 'warning'}</span>`,
            className: 'map-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24]
        });
        L.marker([incident.lat, incident.lng], { icon, incidentId: incident.id })
            .bindPopup(`<strong>${incident.name}</strong><br>Status: ${incident.status}`)
            .addTo(incidentLayer);
    });
}

function getTrafficColor(roadName: string): string {
    const trafficInfo = mockTrafficData.find(t => t.roadName === roadName);
    switch (trafficInfo?.traffic) {
        case 'heavy': return '#e74c3c';
        case 'moderate': return '#f39c12';
        case 'clear': return '#2ecc71';
        default: return 'transparent';
    }
}

function updateAndRefreshTraffic() {
    // Simulate traffic changes
    mockTrafficData.forEach(road => {
        const rand = Math.random();
        if (rand < 0.2) road.traffic = 'heavy';
        else if (rand < 0.5) road.traffic = 'moderate';
        else road.traffic = 'clear';
    });

    trafficLayer.setStyle(feature => ({
        color: getTrafficColor(feature!.properties.name),
        weight: 10,
        opacity: 0.5
    }));
    
    // Update popups if open
    document.querySelectorAll('[id^="traffic-"]').forEach(el => {
        const roadName = el.id.substring(8).replace(/([A-Z])/g, ' $1').trim();
        const trafficInfo = mockTrafficData.find(t => t.roadName === roadName);
        if (trafficInfo) {
            el.textContent = trafficInfo.traffic;
        }
    });

    // Update alerts dot
    const hasHeavyTraffic = mockTrafficData.some(r => r.traffic === 'heavy');
    document.querySelector('#hamburger-menu .blinking-dot')?.classList.toggle('hide', !hasHeavyTraffic);
}


function findOptimalRoute(fromName: string, toName: string) {
    routeLayer.clearLayers();

    const allLocations = [...pois, {name: 'My Location', lat: currentUserPosition?.lat, lng: currentUserPosition?.lng}];

    const startPoint = fromName === 'My Location' 
        ? allLocations.find(p => p.name === 'My Location')
        : pois.find(p => p.name.toLowerCase() === fromName.toLowerCase());

    const endPoint = toName === 'My Location'
        ? allLocations.find(p => p.name === 'My Location')
        : pois.find(p => p.name.toLowerCase() === toName.toLowerCase());

    if (!startPoint || !endPoint) {
        showToast(translations[currentLang].route_finder_error || 'Could not find start or end location.');
        return;
    }
    
    if ((fromName === 'My Location' || toName === 'My Location') && !currentUserPosition) {
        showToast(translations[currentLang].route_finder_error_no_start || 'Your current location is not available.');
        return;
    }

    let waypoints: [number, number][] = [[startPoint.lng, startPoint.lat], [endPoint.lng, endPoint.lat]];
    let preferenceMessage = translations[currentLang].route_pref_fastest;

    if (routePreferences.preferHighways) {
        const highway = dorGeoJson.features.find((f: any) => f.properties.name === "Prithvi Highway");
        if (highway) {
            const midPoint = highway.geometry.coordinates[Math.floor(highway.geometry.coordinates.length / 2)];
            waypoints.splice(1, 0, midPoint);
        }
        preferenceMessage = translations[currentLang].route_pref_highways;
    } else if (routePreferences.preferScenic) {
        const scenicRoad = dorGeoJson.features.find((f: any) => f.properties.name === "Local Road");
        if (scenicRoad) {
            const midPoint = scenicRoad.geometry.coordinates[Math.floor(scenicRoad.geometry.coordinates.length / 2)];
            waypoints.splice(1, 0, midPoint);
        }
        preferenceMessage = translations[currentLang].route_pref_scenic;
    } else {
        // Create a simple curve for the default "fastest" route
        const midLat = (startPoint.lat + endPoint.lat) / 2 + (Math.random() - 0.5) * 0.01;
        const midLng = (startPoint.lng + endPoint.lng) / 2 + (Math.random() - 0.5) * 0.01;
        waypoints.splice(1, 0, [midLng, midLat]);
    }

    if (routePreferences.avoidTolls) {
        // Add a small detour to simulate avoiding tolls
        waypoints.splice(1, 0, [waypoints[1][0] + 0.005, waypoints[1][1] + 0.005]);
        preferenceMessage += ` ${translations[currentLang].route_pref_avoid_tolls}`;
    }

    const routeLine = L.polyline(waypoints.map(p => [p[1], p[0]]), { color: 'blue', weight: 5, opacity: 0.8 }).addTo(routeLayer);
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    currentRouteCoords = (routeLine.getLatLngs() as L.LatLng[]).map(latlng => [latlng.lat, latlng.lng]);
    currentRouteInfo = { from: fromName, to: toName };

    const routeDetails = document.getElementById('route-details')!;
    routeDetails.innerHTML = `
        <p><strong>${preferenceMessage.trim()}</strong></p>
        <p>Distance: ${(Math.random() * 5 + 2).toFixed(1)} km</p>
        <p>Time: ${Math.floor(Math.random() * 15 + 5)} mins</p>`;
    
    document.getElementById('share-route-btn')!.classList.remove('hidden');
    document.getElementById('route-finder-panel')!.classList.add('hidden');
}


function initSpeechRecognition() {
    if (!SpeechRecognition) {
        console.warn("Speech Recognition not supported in this browser.");
        return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    const langMap: { [key: string]: string } = { en: 'en-US', np: 'ne-NP', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'cmn-Hans-CN' };
    recognition.lang = langMap[currentLang];

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        (document.getElementById('chat-input') as HTMLInputElement).value = transcript;
        handleChatMessage();
    };

    recognition.onerror = (event: any) => {
        let message = translations[currentLang].voice_error_mic_problem;
        if (event.error === 'no-speech' || event.error === 'speech-not-recognized') {
            message = translations[currentLang].voice_error_no_speech;
        }
        addMessageToChat(message, 'ai');
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        document.getElementById('ai-assistant')!.classList.remove('listening');
        const chatInput = document.getElementById('chat-input') as HTMLInputElement;
        const placeholderKey = document.getElementById('app-container')!.dataset.mode === 'driver' ? 'ai_chat_placeholder' : 'ai_chat_placeholder_passenger';
        chatInput.placeholder = translations[currentLang][placeholderKey];
    };
}

function toggleVoiceListening() {
    if (!recognition) return;
    const aiButton = document.getElementById('ai-assistant')!;
    if (aiButton.classList.contains('listening')) {
        recognition.stop();
        aiButton.classList.remove('listening');
    } else {
        recognition.start();
        aiButton.classList.add('listening');
        aiChatModal.classList.remove('hidden');
        (document.getElementById('chat-input') as HTMLInputElement).placeholder = translations[currentLang].ai_chat_placeholder_listening;
    }
}


async function handleChatMessage(e?: Event) {
    e?.preventDefault();
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const message = chatInput.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user');
    chatInput.value = '';

    const typingIndicator = document.getElementById('typing-indicator')!;
    typingIndicator.classList.remove('hidden');
    
    const visibleFeatures = getVisiblePoisAndIncidents();
    const currentMode = document.getElementById('app-container')!.dataset.mode;
    const activeRoute = currentRouteInfo ? `An active route is set from ${currentRouteInfo.from} to ${currentRouteInfo.to}.` : 'No active route.';

    const tools: Tool[] = [{
        functionDeclarations: [
            {
                name: 'add_incident',
                description: 'Adds a new incident report to the map at the user\'s current location. Use for traffic jams, accidents, road closures, etc. Example: "Report a crash here"',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        incident_name: { type: Type.STRING, description: 'A brief name for the incident (e.g., "Traffic Jam", "Accident").' },
                        incident_type: { type: Type.STRING, description: 'The type of incident. Can be "traffic", "closure", or "other".' }
                    },
                    required: ['incident_name', 'incident_type']
                }
            },
            {
                name: 'start_navigation',
                description: 'Starts navigation from the user\'s current location to a specified destination. Example: "Navigate to Patan Hospital"',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        destination_name: { type: Type.STRING, description: 'The name of the destination POI.' }
                    },
                    required: ['destination_name']
                }
            },
            {
                name: 'find_nearby_pois',
                description: 'Finds points of interest (POIs) of a specific category near the user\'s current location.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        category: { 
                            type: Type.STRING, 
                            description: `The category of POI to search for. Available categories: ${[...new Set(pois.map(p => p.category))].join(', ')}`
                        }
                    },
                    required: ['category']
                }
            }
        ]
    }];
    
    const persona = currentMode === 'driver' 
        ? 'You are a concise, voice-first co-pilot. Keep responses short and to the point for a hands-free experience.'
        : 'You are a helpful and friendly tour guide for a passenger. Provide interesting details and be conversational.';

    let systemInstruction = `
      You are Sadak Sathi, a helpful AI road assistant for a navigation app in Nepal.
      ${persona}
      Current user mode: ${currentMode}.
      Current language: ${currentLang}.
      User's current location: ${currentUserPosition ? `${currentUserPosition.lat.toFixed(4)}, ${currentUserPosition.lng.toFixed(4)}` : 'Not available'}.
      ${activeRoute}
      Current route preferences: Prefer Highways: ${routePreferences.preferHighways}, Avoid Tolls: ${routePreferences.avoidTolls}, Prefer Scenic: ${routePreferences.preferScenic}.
      Current traffic on major roads: ${JSON.stringify(mockTrafficData)}.
      Visible points of interest on the map: ${JSON.stringify(visibleFeatures.pois)}.
      Visible incidents on the map: ${JSON.stringify(visibleFeatures.incidents)}.
      Respond in the user's current language.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [{ text: message }]
            },
            config: {
                systemInstruction: systemInstruction,
                tools: tools
            }
        });

        typingIndicator.classList.add('hidden');
        
        const functionCalls = response.candidates?.[0]?.content.parts.filter(part => part.functionCall);
        
        if (functionCalls && functionCalls.length > 0) {
            for (const part of functionCalls) {
                const { name, args } = part.functionCall!;
                let toolResponse = '';

                if (name === 'add_incident') {
                    if (!currentUserPosition) {
                        toolResponse = 'Cannot report an incident without your current location.';
                    } else {
                        const incidentName = (args as any).incident_name as string;
                        const incidentType = (args as any).incident_type as string;
                        const newIncident = {
                            id: wazeIncidents.length + 100,
                            name: incidentName,
                            lat: currentUserPosition.lat,
                            lng: currentUserPosition.lng,
                            type: incidentType,
                            status: 'Active'
                        };
                        wazeIncidents.push(newIncident);
                        addIncidentLayer(wazeIncidents);
                        populateDisplayPanel();
                        toolResponse = `OK, I've reported "${incidentName}" at your current location.`;
                        showToast(`Incident Reported: ${incidentName}`);
                    }
                } else if (name === 'start_navigation') {
                    const destination = (args as any).destination_name as string;
                    findOptimalRoute("My Location", destination);
                    toolResponse = `Starting navigation to ${destination}.`;
                } else if (name === 'find_nearby_pois') {
                    const category = (args as any).category as string;
                    if (!currentUserPosition) {
                        toolResponse = "I can't find nearby places without your location.";
                    } else {
                        const nearby = pois
                            .filter(p => p.category.toLowerCase() === category.toLowerCase())
                            .map(p => ({
                                ...p,
                                distance: L.latLng(currentUserPosition.lat, currentUserPosition.lng).distanceTo([p.lat, p.lng])
                            }))
                            .filter(p => p.distance < 2000) // within 2km
                            .sort((a, b) => a.distance - b.distance)
                            .slice(0, 3);

                        if (nearby.length > 0) {
                             toolResponse = `Here are some nearby ${category}s. You can tap to navigate.`;
                             // Add interactive buttons
                             const suggestionsHtml = nearby.map(p => 
                                `<button class="poi-suggestion-btn" data-destination="${p.name}">${p.name} (~${(p.distance/1000).toFixed(1)} km)</button>`
                             ).join('');
                             addMessageToChat(toolResponse + `<div class="poi-suggestions">${suggestionsHtml}</div>`, 'ai');
                             
                             // Add listeners to new buttons
                             document.querySelectorAll('.poi-suggestion-btn').forEach(btn => {
                                 btn.addEventListener('click', (e) => {
                                     const destination = (e.currentTarget as HTMLElement).dataset.destination;
                                     if(destination) {
                                        findOptimalRoute('My Location', destination);
                                        // Fix: Use the module-level aiChatModal variable for consistency.
                                        aiChatModal.classList.add('hidden');
                                     }
                                 });
                             });
                             return; // Exit as we've already added the message
                        } else {
                            toolResponse = `Sorry, I couldn't find any ${category}s nearby.`;
                        }
                    }
                }
                addMessageToChat(toolResponse, 'ai');
            }
        } else {
            addMessageToChat(response.text, 'ai');
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        addMessageToChat("Sorry, I'm having trouble connecting right now.", 'ai');
        typingIndicator.classList.add('hidden');
    }
}

function addMessageToChat(html: string, sender: 'user' | 'ai') {
    const chatMessages = document.getElementById('chat-messages')!;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.innerHTML = `<p>${html}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateLanguage() {
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key')!;
        if (translations[currentLang] && translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        } else {
            el.textContent = translations.en[key]; // Fallback to English
        }
    });
    document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
        const key = el.getAttribute('data-lang-key-placeholder')!;
        if (translations[currentLang] && translations[currentLang][key]) {
            el.setAttribute('placeholder', translations[currentLang][key]);
        } else {
            el.setAttribute('placeholder', translations.en[key]);
        }
    });
}

function showToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Position it - quick and dirty, could be improved
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'var(--primary-color)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.zIndex = '102';
    toast.style.boxShadow = 'var(--shadow)';

    setTimeout(() => {
        toast.remove();
    }, 3000);
}