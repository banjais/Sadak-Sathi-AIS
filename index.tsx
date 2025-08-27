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
let bridgePois = [
    { id: 1, name: "Maitighar Mandala", lat: 27.693, lng: 85.322, type: 'poi', status: 'Good condition' },
    { id: 2, name: "Thapathali Bridge", lat: 27.691, lng: 85.316, type: 'bridge', status: 'Under maintenance' },
    { id: 5, name: "Patan Hospital", lat: 27.671, lng: 85.318, type: 'poi', status: 'Open 24/7' },
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
        bridges: 'Bridges & POIs',
        incidents: 'Incidents',
        display_panel_title: 'Nearby Information',
        route_finder: 'Route Finder',
        find_route_btn: 'Find Optimal Route',
        clear_route_btn: 'Clear Route',
        share_route: 'Share Route',
        link_copied: 'Link Copied!',
        route_finder_error: 'Could not find start or end location. Please use valid POI names.',
        menu_map: 'Map',
        menu_alerts: 'Alerts',
        menu_driver: 'Driver',
        menu_profile: 'Profile',
        ai_chat_title: 'AI Assistant',
        ai_chat_placeholder: 'Ask to find a place or report an incident...',
        report_incident_prompt: 'I want to report an incident here: ',
    },
    np: {
        layers: 'तहहरू',
        roads: 'सडकहरू',
        bridges: 'पुल र POIs',
        incidents: 'घटनाहरू',
        display_panel_title: 'नजिकैको जानकारी',
        route_finder: 'मार्ग खोज्नुहोस्',
        find_route_btn: 'उत्तम मार्ग खोज्नुहोस्',
        clear_route_btn: 'मार्ग हटाउनुहोस्',
        share_route: 'मार्ग साझा गर्नुहोस्',
        link_copied: 'लिङ्क प्रतिलिपि भयो!',
        route_finder_error: 'सुरु वा अन्त्य स्थान फेला पार्न सकिएन। कृपया मान्य POI नामहरू प्रयोग गर्नुहोस्।',
        menu_map: 'नक्सा',
        menu_alerts: 'सतर्कता',
        menu_driver: 'चालक',
        menu_profile: 'प्रोफाइल',
        ai_chat_title: 'एआई सहायक',
        ai_chat_placeholder: 'ठाउँ खोज्न वा घटना रिपोर्ट गर्न सोध्नुहोस्...',
        report_incident_prompt: 'म यहाँ एक घटना रिपोर्ट गर्न चाहन्छु: ',
    },
    hi: {
        layers: 'परतें',
        roads: 'सड़कें',
        bridges: 'पुल और POIs',
        incidents: 'घटनाएं',
        display_panel_title: 'आस-पास की जानकारी',
        route_finder: 'मार्ग खोजें',
        find_route_btn: 'इष्टतम मार्ग खोजें',
        clear_route_btn: 'मार्ग साफ़ करें',
        share_route: 'मार्ग साझा करें',
        link_copied: 'लिंक कॉपी किया गया!',
        route_finder_error: 'प्रारंभ या अंत स्थान नहीं मिला। कृपया मान्य POI नामों का उपयोग करें।',
        menu_map: 'नक्शा',
        menu_alerts: 'चेतावनी',
        menu_driver: 'चालक',
        menu_profile: 'प्रोफ़ाइल',
        ai_chat_title: 'एआई सहायक',
        ai_chat_placeholder: 'कोई स्थान खोजने या घटना की रिपोर्ट करने के लिए कहें...',
        report_incident_prompt: 'मैं यहां एक घटना की रिपोर्ट करना चाहता हूं: ',
    }
};

let map: L.Map;
let roadLayer: L.GeoJSON;
let trafficLayer: L.GeoJSON; // Layer for traffic color casing
let bridgeLayer: L.FeatureGroup;
let incidentLayer: L.FeatureGroup;
let routeLayer: L.FeatureGroup;
let userLocationMarker: L.Marker | null = null;
let currentUserPosition: { lat: number, lng: number, heading: number | null } | null = null;
let currentLang = 'en';
let currentRouteCoords: [number, number][] | null = null;
let chatHistory: any[] = []; // Store chat history for context
let highAccuracyWatchId: number | null = null;
let lowAccuracyWatchId: number | null = null;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initUI();
    handleSharedRoute();
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
    bridgeLayer = L.featureGroup().addTo(map);
    incidentLayer = L.featureGroup().addTo(map);
    routeLayer = L.featureGroup().addTo(map);

    // Add initial data to layers
    addRoadLayers();
    addBridgeLayer(bridgePois);
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
    findRouteBtn.addEventListener('click', findOptimalRoute);
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
    document.getElementById('toggle-bridges')!.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) map.addLayer(bridgeLayer);
        else map.removeLayer(bridgeLayer);
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
            aiChatModal.classList.remove('hidden');
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

function addBridgeLayer(pois: any[]) {
    bridgeLayer.clearLayers();
    pois.forEach(poi => {
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
        bridgeLayer.addLayer(marker);
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
    const allItems = [...bridgePois, ...wazeIncidents];

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
            let targetLayer = item.type === 'bridge' || item.type === 'poi' ? bridgeLayer : incidentLayer;
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
    let offsetX = 0, offsetY = 0;
    let startX = 0, startY = 0;

    const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        offsetX = dragTarget.offsetLeft;
        offsetY = dragTarget.offsetTop;
        
        // Prevent map interaction while dragging the modal
        if (handleElement.id === 'ai-chat-header') {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
        }

        handleElement.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Mark as dragged if moved more than a few pixels
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
             handleElement.dataset.dragged = 'true';
        }
        
        dragTarget.style.left = `${offsetX + dx}px`;
        dragTarget.style.top = `${offsetY + dy}px`;
    };

    const onMouseUp = () => {
        isDragging = false;
        
        // Re-enable map interaction
        if (handleElement.id === 'ai-chat-header') {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
        }

        handleElement.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    return { onMouseDown };
}

// --- Routing Functions ---

function findOptimalRoute() {
    clearRoute();
    const fromInput = (document.getElementById('from-input') as HTMLInputElement).value;
    const toInput = (document.getElementById('to-input') as HTMLInputElement).value;
    const routeDetails = document.getElementById('route-details')!;
    
    const fromPoi = bridgePois.find(p => p.name.toLowerCase() === fromInput.toLowerCase());
    const toPoi = bridgePois.find(p => p.name.toLowerCase() === toInput.toLowerCase());

    if (!fromPoi || !toPoi) {
        routeDetails.innerHTML = `<p style="color: var(--danger-color);">${translations[currentLang].route_finder_error}</p>`;
        return;
    }

    // Mock route that deliberately intersects with a closure to show alert
    const routeCoords: [number, number][] = [
        [fromPoi.lat, fromPoi.lng],
        [27.695, 85.35], // Intermediate point
        [27.70, 85.4], // Near road closure
        [toPoi.lat, toPoi.lng]
    ];
    
    currentRouteCoords = routeCoords;

    const routePolyline = L.polyline(routeCoords, { color: '#3498db', weight: 6 });
    const bounds = routePolyline.getBounds();
    
    // Check for incidents on route
    let incidentOnRoute = false;
    incidentLayer.eachLayer((layer: any) => {
        if (bounds.contains(layer.getLatLng())) {
             const incident = wazeIncidents.find(i => i.id === layer.incidentId);
             if (incident && incident.type === 'closure') {
                incidentOnRoute = true;
                routePolyline.setStyle({ color: '#f39c12' });
                routeDetails.innerHTML = `
                    <div class="route-warning">
                        <span class="material-icons">warning</span>
                        <span>Route intersects with a road closure!</span>
                    </div>
                `;
                layer.openPopup();
            }
        }
    });

    if (!incidentOnRoute) {
        routeDetails.innerHTML = `<p style="color: var(--success-color);">Optimal route found. Avoiding heavy traffic.</p>`;
    }
    
    routeLayer.addLayer(routePolyline);
    map.flyToBounds(bounds.pad(0.1));
    document.getElementById('share-route-btn')!.classList.remove('hidden');
}

function clearRoute() {
    routeLayer.clearLayers();
    currentRouteCoords = null;
    document.getElementById('route-details')!.innerHTML = '';
    document.getElementById('share-route-btn')!.classList.add('hidden');
}

async function shareRoute() {
    if (!currentRouteCoords) return;
    const routeString = currentRouteCoords.map(c => c.join(',')).join(';');
    const url = `${window.location.origin}${window.location.pathname}?route=${encodeURIComponent(routeString)}`;
    const shareData = {
        title: 'Sadak Sathi Route',
        text: 'Check out this route I planned on Sadak Sathi!',
        url: url
    };
    const shareBtn = document.getElementById('share-route-btn')!;
    const originalText = shareBtn.querySelector('span:last-child')!.textContent;

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            throw new Error('Web Share API not available.');
        }
    } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url).then(() => {
            shareBtn.querySelector('span:last-child')!.textContent = translations[currentLang].link_copied;
            setTimeout(() => {
                shareBtn.querySelector('span:last-child')!.textContent = originalText;
            }, 2000);
        });
    }
}

function handleSharedRoute() {
    const params = new URLSearchParams(window.location.search);
    const routeParam = params.get('route');
    if (routeParam) {
        const coords = routeParam.split(';').map(pair => {
            const [lat, lng] = pair.split(',').map(Number);
            return [lat, lng] as [number, number];
        });
        currentRouteCoords = coords;
        const routePolyline = L.polyline(coords, { color: '#3498db', weight: 6 });
        routeLayer.addLayer(routePolyline);
        map.flyToBounds(routePolyline.getBounds().pad(0.1));
        document.getElementById('route-finder-panel')!.classList.remove('hidden');
        document.getElementById('share-route-btn')!.classList.remove('hidden');
    }
}

// --- Geolocation Functions ---

function initGeolocation() {
    if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        return;
    }
    
    const onHighAccuracyError = (err: GeolocationPositionError) => {
        console.warn(`High accuracy geolocation failed: ${err.message}. Falling back to low accuracy.`);
        onLocationError(err);
        // Stop watching high accuracy and start low accuracy
        if (highAccuracyWatchId !== null) navigator.geolocation.clearWatch(highAccuracyWatchId);
        highAccuracyWatchId = null;
        
        if (lowAccuracyWatchId === null) {
             lowAccuracyWatchId = navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0
            });
        }
    };

    // First, try for high accuracy
    highAccuracyWatchId = navigator.geolocation.watchPosition(onLocationFound, onHighAccuracyError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    });
}

function onLocationFound(position: GeolocationPosition) {
    const { latitude, longitude, heading } = position.coords;
    currentUserPosition = { lat: latitude, lng: longitude, heading: heading };
    
    const icon = L.divIcon({
        className: 'user-location-icon',
        html: `<div class="pulse"></div><div class="dot"></div><div class="heading"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });

    if (!userLocationMarker) {
        userLocationMarker = L.marker([latitude, longitude], { icon: icon }).addTo(map);
        map.flyTo([latitude, longitude], 16);
    } else {
        userLocationMarker.setLatLng([latitude, longitude]);
    }
    
    const headingElement = userLocationMarker.getElement()?.querySelector('.heading') as HTMLElement;
    if (headingElement && heading !== null) {
        headingElement.style.transform = `translate(-50%, -100%) rotate(${heading}deg)`;
    }
}

function onLocationError(error: GeolocationPositionError) {
    let message = "Could not get location: ";
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message += "Permission denied.";
            break;
        case error.POSITION_UNAVAILABLE:
            message += "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            message += "The request to get user location timed out.";
            break;
        default:
             message += "An unknown error occurred.";
             break;
    }
    console.error(message);
}

// --- AI Chat Functions ---
async function handleChatMessage() {
    const input = document.getElementById('chat-input') as HTMLInputElement;
    const message = input.value.trim();
    if (!message) return;

    addMessageToUI(message, 'user');
    input.value = '';
    
    const typingIndicator = document.getElementById('typing-indicator')!;
    typingIndicator.classList.remove('hidden');

    try {
        // 1. Gather detailed map context
        const bounds = map.getBounds();
        const mapCenter = map.getCenter();
        const mapZoom = map.getZoom();

        const visiblePois = bridgePois.filter(poi => bounds.contains(L.latLng(poi.lat, poi.lng)));
        const visibleIncidents = wazeIncidents.filter(incident => bounds.contains(L.latLng(incident.lat, incident.lng)));

        let contextString = `Current map context:\n- Map Center: ${mapCenter.lat.toFixed(4)}, ${mapCenter.lng.toFixed(4)}\n- Zoom Level: ${mapZoom}\n`;

        if (visiblePois.length > 0) {
            contextString += "- Visible POIs:\n";
            visiblePois.forEach(poi => {
                contextString += `  - Name: ${poi.name} (Type: ${poi.type}, Status: ${poi.status})\n`;
            });
        } else {
            contextString += "- No POIs are visible.\n";
        }

        if (visibleIncidents.length > 0) {
            contextString += "- Visible Incidents:\n";
            visibleIncidents.forEach(incident => {
                contextString += `  - Name: ${incident.name} (Type: ${incident.type}, Status: ${incident.status})\n`;
            });
        } else {
            contextString += "- No incidents are visible.\n";
        }


        const tools: Tool[] = [{
            functionDeclarations: [
                {
                    name: "find_poi",
                    description: "Find a point of interest (POI) like a bridge, hospital, or landmark on the map.",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            poi_name: { type: Type.STRING, description: "The name of the POI to find." }
                        },
                        required: ["poi_name"]
                    }
                },
                {
                    name: "add_incident",
                    description: "Add a new incident like a traffic jam, accident, or road closure to the map. If the user says 'here' or doesn't specify a location, the location_name can be omitted, and the map center or user's GPS location will be used.",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            incident_type: { type: Type.STRING, description: "The type of incident (e.g., 'accident', 'traffic', 'closure')." },
                            location_name: { type: Type.STRING, description: "The name of the location where the incident occurred. Omit if the user says 'here' or similar." }
                        },
                        required: ["incident_type"]
                    }
                }
            ]
        }];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { role: 'user', parts: [{ text: message }] },
            config: { 
                tools: tools,
                systemInstruction: contextString // Pass context here
            },
        });
        
        const call = response.candidates?.[0]?.content?.parts[0]?.functionCall;

        if (call) {
            const { name, args } = call;
            let result: any;
            if (name === 'find_poi') {
                 result = findPoiOnMap(args.poi_name as string);
            } else if (name === 'add_incident') {
                result = addIncidentToMap(args.incident_type as string, args.location_name as string | undefined);
            }
            
            // Send the result back to the model for a natural language response
            const response2 = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [response.candidates![0].content.parts[0]] },
                    { role: 'user', parts: [{ functionResponse: { name, response: { result } } }] }
                ],
                config: { tools: tools }
            });

            addMessageToUI(response2.text, 'ai');
        } else {
            addMessageToUI(response.text, 'ai');
        }

    } catch (error) {
        console.error("AI Error:", error);
        addMessageToUI("Sorry, I encountered an error.", 'ai');
    } finally {
        typingIndicator.classList.add('hidden');
    }
}

function addMessageToUI(text: string, sender: 'user' | 'ai') {
    const messagesContainer = document.getElementById('chat-messages')!;
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    messageElement.textContent = text;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function findPoiOnMap(poiName: string) {
    const allPois = [...bridgePois, ...wazeIncidents];
    const poi = allPois.find(p => p.name.toLowerCase().includes(poiName.toLowerCase()));

    if (poi) {
        const targetLayer = poi.type === 'bridge' || poi.type === 'poi' ? bridgeLayer : incidentLayer;
        const targetIdKey = poi.type === 'bridge' || poi.type === 'poi' ? 'poiId' : 'incidentId';
        
        targetLayer.eachLayer((layer: any) => {
            if (layer[targetIdKey] === poi.id) {
                map.flyTo(layer.getLatLng(), 16);
                layer.openPopup();
            }
        });
        return `Found ${poi.name} and centered the map on it.`;
    } else {
        return `Sorry, I could not find a location named "${poiName}".`;
    }
}

function addIncidentToMap(incidentType: string, locationName?: string) {
    let incidentLat: number;
    let incidentLng: number;
    let finalLocationName: string;

    if (locationName) {
        const location = bridgePois.find(p => p.name.toLowerCase().includes(locationName.toLowerCase()));
        if (!location) {
            return `Sorry, I couldn't find the location "${locationName}" to add the incident.`;
        }
        incidentLat = location.lat + 0.001; // Offset slightly to avoid overlap
        incidentLng = location.lng + 0.001;
        finalLocationName = `"${locationName}"`;
    } else {
        // No location provided, use context
        if (currentUserPosition) {
            // Prioritize user's GPS
            incidentLat = currentUserPosition.lat;
            incidentLng = currentUserPosition.lng;
            finalLocationName = "your current location";
        } else {
            // Fallback to map center
            const center = map.getCenter();
            incidentLat = center.lat;
            incidentLng = center.lng;
            finalLocationName = "the center of the map";
        }
    }
    
    const newIncident = {
        id: Math.max(...wazeIncidents.map(i => i.id), ...bridgePois.map(p => p.id)) + 1,
        name: incidentType.charAt(0).toUpperCase() + incidentType.slice(1),
        lat: incidentLat,
        lng: incidentLng,
        type: incidentType.toLowerCase().includes('closure') ? 'closure' : 'traffic',
        status: 'Newly Reported'
    };
    
    wazeIncidents.push(newIncident);
    addIncidentLayer(wazeIncidents);
    populateDisplayPanel();
    
    return `OK, I've added a new "${incidentType}" incident at ${finalLocationName}.`;
}


// --- Live Traffic Simulation ---
function updateAndRefreshTraffic() {
    // Randomly change traffic conditions for demonstration
    mockTrafficData.forEach(road => {
        const rand = Math.random();
        if (rand < 0.33) road.traffic = 'clear';
        else if (rand < 0.66) road.traffic = 'moderate';
        else road.traffic = 'heavy';
    });
    
    // Refresh the style of the traffic layer
    trafficLayer.setStyle(getTrafficStyle);
}