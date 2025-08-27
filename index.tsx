/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";

// Fix: To resolve "Cannot find namespace 'L'", declare the namespace for Leaflet types.
// `declare var L: any` is not enough as it only declares the global variable, not the types.
declare namespace L {
    type Map = any;
    type GeoJSON = any;
    type FeatureGroup = any;
    type Marker = any;
    type Polyline = any;
}
declare var L: any;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// Since this is a demo, we will use mock data.
// In a real application, this would come from an API.

// Mock GeoJSON for roads
const dorGeoJson = {
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
const bridgePois = [
    { id: 1, name: "Maitighar Mandala", lat: 27.693, lng: 85.322, type: 'poi', status: 'Good condition' },
    { id: 2, name: "Thapathali Bridge", lat: 27.691, lng: 85.316, type: 'bridge', status: 'Under maintenance' },
];

// Mock Incidents (from "Waze")
const wazeIncidents = [
    { id: 3, name: "Heavy Traffic", lat: 27.717, lng: 85.323, type: 'traffic', status: 'Active' },
    { id: 4, name: "Road Closure", lat: 27.70, lng: 85.4, type: 'closure', status: 'Active' },
];

// Mock Traffic Data
const mockTrafficData = [
    { roadName: "Araniko Highway", traffic: "heavy" },
    { roadName: "Prithvi Highway", traffic: "moderate" },
    { roadName: "Local Road", traffic: "clear" },
    { roadName: "Congested Inner Road", traffic: "heavy" },
];

// Translations
const translations = {
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
        ai_chat_placeholder: 'Type a message...',
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
        ai_chat_placeholder: 'सन्देश टाइप गर्नुहोस्...',
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
        ai_chat_placeholder: 'एक संदेश टाइप करें...',
    }
};

let map: L.Map;
let roadLayer: L.GeoJSON;
let trafficLayer: L.GeoJSON; // Layer for traffic color casing
let bridgeLayer: L.FeatureGroup;
let incidentLayer: L.FeatureGroup;
let routeLayer: L.FeatureGroup;
let userLocationMarker: L.Marker | null = null;
let currentLang = 'en';
let currentRouteCoords: [number, number][] | null = null;

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
    
    lightTiles.addTo(map);

    // Store tile layers for theme toggling
    (map as any).tileLayers = { light: lightTiles, dark: darkTiles };

    addMapLayers();
}


function getTrafficStyle(feature: any) {
    const trafficInfo = mockTrafficData.find(d => d.roadName === feature.properties.name);
    const trafficStatus = trafficInfo ? trafficInfo.traffic : 'clear';
    let color = 'var(--success-color)';
    switch (trafficStatus) {
        case 'heavy': color = 'var(--danger-color)'; break;
        case 'moderate': color = 'var(--warning-color)'; break;
    }
    return { color, weight: 8, opacity: 1 };
}

function getRoadStatusStyle(feature: any) {
    const style: { color: string, weight: number, dashArray?: string } = {
        color: 'var(--panel-bg-color)', // Inner line color to contrast with traffic
        weight: 4
    };
    switch (feature.properties.status) {
        case 'fair': style.dashArray = '5, 5'; break; // Dotted
        case 'poor': style.dashArray = '10, 5'; break; // Dashed
    }
    return style;
}


function addMapLayers() {
    // Traffic Layer (Bottom layer for color casing)
    trafficLayer = L.geoJSON(dorGeoJson as any, {
        style: getTrafficStyle
    }).addTo(map);

    // Road Status Layer (Top layer for physical status)
    roadLayer = L.geoJSON(dorGeoJson as any, {
        style: getRoadStatusStyle,
        onEachFeature: (feature, layer) => {
            const trafficInfo = mockTrafficData.find(d => d.roadName === feature.properties.name);
            const trafficStatus = trafficInfo ? trafficInfo.traffic : 'clear';
            layer.bindPopup(`<b>${feature.properties.name}</b><br>Status: ${feature.properties.status}<br>Traffic: ${trafficStatus}`);
        }
    }).addTo(map);

    // Bridge/POI Layer
    bridgeLayer = L.featureGroup().addTo(map);
    bridgePois.forEach(poi => {
        const icon = L.divIcon({
            html: `<span class="material-icons" style="color: var(--primary-color); font-size: 32px;">${poi.type === 'bridge' ? 'location_city' : 'place'}</span>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });
        const marker = L.marker([poi.lat, poi.lng], { icon }).addTo(bridgeLayer);
        marker.bindPopup(`<b>${poi.name}</b><br>${poi.status}`);
        (marker as any).poiId = poi.id;
    });

    // Incident Layer
    incidentLayer = L.featureGroup().addTo(map);
    wazeIncidents.forEach(incident => {
         const icon = L.divIcon({
            html: `<span class="material-icons" style="color: var(--danger-color); font-size: 32px;">${incident.type === 'traffic' ? 'traffic' : 'warning'}</span>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });
        const marker = L.marker([incident.lat, incident.lng], { icon }).addTo(incidentLayer);
        marker.bindPopup(`<b>${incident.name}</b>`);
        (marker as any).poiId = incident.id;
    });

    // Route Layer (initially empty)
    routeLayer = L.featureGroup().addTo(map);
}


function initUI() {
    const themeToggle = document.getElementById('theme-toggle')!;
    const hamburgerMenu = document.getElementById('hamburger-menu')!;
    const settingsPanel = document.getElementById('settings-panel')!;
    const aiAssistant = document.getElementById('ai-assistant') as HTMLButtonElement;
    const langSelect = document.getElementById('language-select') as HTMLSelectElement;
    const displayPanel = document.getElementById('display-panel')!;
    const displayPanelHeader = document.getElementById('display-panel-header')!;
    const blinkingDot = hamburgerMenu.querySelector('.blinking-dot')!;
    const centerLocationBtn = document.getElementById('center-location-btn')!;

    // Route Finder UI Elements
    const routeFinderTrigger = document.getElementById('route-finder-trigger')!;
    const routeFinderPanel = document.getElementById('route-finder-panel')!;
    const routeFinderClose = document.getElementById('route-finder-close')!;
    const findRouteBtn = document.getElementById('find-route-btn')!;
    const clearRouteBtn = document.getElementById('clear-route-btn')!;
    const shareRouteBtn = document.getElementById('share-route-btn')!;
    
    // AI Chat UI Elements
    const aiChatModal = document.getElementById('ai-chat-modal')!;
    const aiChatClose = document.getElementById('ai-chat-close')!;
    const chatForm = document.getElementById('chat-form')!;

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const container = document.getElementById('app-container')!;
        const currentTheme = container.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        container.setAttribute('data-theme', newTheme);
        themeToggle.querySelector('.material-icons')!.textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
        
        // Swap map tiles
        if (newTheme === 'dark') {
            map.removeLayer((map as any).tileLayers.light);
            (map as any).tileLayers.dark.addTo(map);
        } else {
            map.removeLayer((map as any).tileLayers.dark);
            (map as any).tileLayers.light.addTo(map);
        }
    });

    // Hamburger menu
    hamburgerMenu.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
        // Hide dot on first click
        if (!blinkingDot.classList.contains('hide')) {
            blinkingDot.classList.add('hide');
        }
    });

    // Display Panel toggle
    displayPanelHeader.addEventListener('click', () => {
        displayPanel.classList.toggle('collapsed');
        // After the animation, invalidate the map size to fix rendering issues
        setTimeout(() => {
            map.invalidateSize();
        }, 400); // Should match the transition duration in CSS
    });

    // Layer toggles
    document.getElementById('toggle-roads')!.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) {
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
    
    // Center on location button
    centerLocationBtn.addEventListener('click', () => {
        if (userLocationMarker) {
            map.flyTo(userLocationMarker.getLatLng(), 16);
        }
    });

    // Route Finder Panel Logic
    routeFinderTrigger.addEventListener('click', () => {
        routeFinderPanel.classList.remove('hidden');
    });
    routeFinderClose.addEventListener('click', () => {
        routeFinderPanel.classList.add('hidden');
    });
    findRouteBtn.addEventListener('click', findOptimalRoute);
    clearRouteBtn.addEventListener('click', clearRoute);
    shareRouteBtn.addEventListener('click', shareRoute);

    // AI Chat Logic
    makeDraggable(aiAssistant, () => {
        aiChatModal.classList.remove('hidden');
    });
    aiChatClose.addEventListener('click', () => {
        aiChatModal.classList.add('hidden');
    });
    chatForm.addEventListener('submit', handleChatMessage);

    // Language switcher
    langSelect.addEventListener('change', (e) => {
        currentLang = (e.target as HTMLSelectElement).value;
        updateLanguage();
    });
}

function findOptimalRoute() {
    clearRoute();

    const fromInput = document.getElementById('from-input') as HTMLInputElement;
    const toInput = document.getElementById('to-input') as HTMLInputElement;
    const routeDetails = document.getElementById('route-details')!;
    const shareRouteBtn = document.getElementById('share-route-btn')!;

    const startPoi = bridgePois.find(p => p.name.toLowerCase() === fromInput.value.trim().toLowerCase());
    const endPoi = bridgePois.find(p => p.name.toLowerCase() === toInput.value.trim().toLowerCase());
    
    if (!startPoi || !endPoi) {
        const errorText = translations[currentLang as keyof typeof translations]?.route_finder_error || 'Could not find start or end location.';
        routeDetails.className = 'route-warning';
        routeDetails.innerHTML = `
            <span class="material-icons">error</span>
            <span>${errorText}</span>
        `;
        return;
    }

    // --- MOCK LOGIC FOR DEMONSTRATION ---
    // In this mock, we will simulate a route that INTERSECTS with the known road closure
    // to demonstrate the alert functionality.
    const roadClosureIncident = wazeIncidents.find(i => i.name === "Road Closure")!;
    
    // Create a dynamic route based on inputs that still passes through the incident
    const routeCoords: [number, number][] = [
        [startPoi.lat, startPoi.lng], // Start at the "From" POI
        [roadClosureIncident.lat, roadClosureIncident.lng], // Path through the incident
        [endPoi.lat, endPoi.lng]    // End at the "To" POI
    ];

    // 1. Display a prominent warning in the panel
    routeDetails.className = 'route-warning';
    routeDetails.innerHTML = `
        <span class="material-icons">warning</span>
        <span><strong>Alert:</strong> Route intersects with a road closure.</span>
    `;

    // 2. Draw the route on the map with a warning (amber) color
    const routeLine: L.Polyline = L.polyline(routeCoords, {
        color: 'var(--warning-color)',
        weight: 6,
        opacity: 0.9,
    });

    routeLayer.addLayer(routeLine);
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    // 3. Highlight the specific incident on the map by opening its popup
    incidentLayer.eachLayer(marker => {
        if ((marker as any).poiId === roadClosureIncident.id) {
            (marker as L.Marker).openPopup();
        }
    });
    
    // 4. Store route for sharing and show the share button
    currentRouteCoords = routeCoords;
    shareRouteBtn.classList.remove('hidden');

    // We do NOT close the panel, so the user can see the warning.
}

function clearRoute() {
    routeLayer.clearLayers();
    const routeDetails = document.getElementById('route-details')!;
    const shareRouteBtn = document.getElementById('share-route-btn')!;
    routeDetails.innerHTML = '';
    routeDetails.className = ''; // Reset any warning/success styling
    shareRouteBtn.classList.add('hidden');
    currentRouteCoords = null;
}

async function shareRoute() {
    if (!currentRouteCoords) return;

    // 1. Generate URL
    const routeString = currentRouteCoords.map(c => c.join(',')).join(';');
    const url = new URL(window.location.href);
    url.search = `?route=${encodeURIComponent(routeString)}`;
    const shareableLink = url.toString();

    // 2. Try Web Share API
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Sadak Sathi Route',
                text: 'Check out this route I planned on Sadak Sathi!',
                url: shareableLink,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        // 3. Fallback to clipboard
        try {
            await navigator.clipboard.writeText(shareableLink);
            // Fix: Cast shareBtn to HTMLButtonElement to access the 'disabled' property.
            const shareBtn = document.getElementById('share-route-btn')! as HTMLButtonElement;
            const originalHTML = shareBtn.innerHTML;
            const copiedText = translations[currentLang as keyof typeof translations]?.link_copied || 'Link Copied!';
            shareBtn.innerHTML = `<span class="material-icons">check</span> <span>${copiedText}</span>`;
            shareBtn.disabled = true;

            setTimeout(() => {
                shareBtn.innerHTML = originalHTML;
                shareBtn.disabled = false;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            alert('Failed to copy link.'); // Simple alert fallback
        }
    }
}

function handleSharedRoute() {
    const params = new URLSearchParams(window.location.search);
    const routeParam = params.get('route');

    if (!routeParam) return;

    try {
        const coords: [number, number][] = routeParam.split(';').map(pair => {
            const [lat, lng] = pair.split(',').map(Number);
            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Invalid coordinate pair');
            }
            return [lat, lng];
        });

        if (coords.length < 2) return;

        // Open the panel and draw the route
        document.getElementById('route-finder-panel')!.classList.remove('hidden');
        clearRoute(); // Clear any existing route first

        const routeLine = L.polyline(coords, {
            color: 'var(--warning-color)',
            weight: 6,
            opacity: 0.9,
        });
        
        routeLayer.addLayer(routeLine);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        // Store coords so it can be re-shared, and show the button
        currentRouteCoords = coords;
        document.getElementById('share-route-btn')!.classList.remove('hidden');

    } catch (error) {
        console.error('Failed to parse shared route:', error);
    }
}


function updateLanguage() {
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang-key') as keyof typeof translations.en;
        const translation = translations[currentLang as keyof typeof translations]?.[key];
        // Handle buttons with nested spans
        const target = el.querySelector('span:last-child') || el;
        if (translation) {
            target.textContent = translation;
        }
    });
    
    // Handle placeholders
    const placeholderElements = document.querySelectorAll('[data-lang-key-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-lang-key-placeholder') as keyof typeof translations.en;
        const translation = translations[currentLang as keyof typeof translations]?.[key];
        if (translation) {
            (el as HTMLInputElement).placeholder = translation;
        }
    });
}

function makeDraggable(element: HTMLElement, onClick?: () => void) {
    let isDragging = false;
    let hasMoved = false; // To distinguish a click from a drag
    let offsetX = 0;
    let offsetY = 0;

    const onMouseDown = (e: MouseEvent | TouchEvent) => {
        isDragging = true;
        hasMoved = false; // Reset on each new drag attempt
        const event = 'touches' in e ? e.touches[0] : e;
        offsetX = event.clientX - element.getBoundingClientRect().left;
        offsetY = event.clientY - element.getBoundingClientRect().top;
        element.style.transition = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onMouseMove);
        document.addEventListener('touchend', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        hasMoved = true; // Flag that movement has occurred
        e.preventDefault();
        const event = 'touches' in e ? e.touches[0] : e;
        
        let x = event.clientX - offsetX;
        let y = event.clientY - offsetY;

        const parent = element.parentElement!;
        x = Math.max(0, Math.min(x, parent.clientWidth - element.offsetWidth));
        y = Math.max(0, Math.min(y, parent.clientHeight - element.offsetHeight));

        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.bottom = 'auto';
        element.style.right = 'auto';
    };

    const onMouseUp = () => {
        isDragging = false;
        // Only fire the onClick if the element wasn't dragged.
        if (!hasMoved && onClick) {
            onClick();
        }
        // Only mark as 'dragged' if the element was actually moved.
        if (hasMoved) {
            element.dataset.dragged = 'true';
        }
        element.style.transition = ''; // Restore any CSS transitions
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
    };

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('touchstart', onMouseDown);
}

function addMessageToUI(message: string, sender: 'user' | 'ai') {
    const messagesContainer = document.getElementById('chat-messages')!;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'ai-message'}`;
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll
}

async function handleChatMessage(event: Event) {
    event.preventDefault();
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const typingIndicator = document.getElementById('typing-indicator')!;
    const userInput = chatInput.value.trim();

    if (!userInput) return;

    // 1. Display user message
    addMessageToUI(userInput, 'user');
    chatInput.value = '';

    // 2. Show typing indicator
    typingIndicator.classList.remove('hidden');

    try {
        // 3. Call GenAI API
        // Fix: Simplified the 'contents' parameter for a single-turn text prompt as per Gemini API best practices.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userInput,
        });

        const aiResponse = response.text;
        addMessageToUI(aiResponse, 'ai');

    } catch (error) {
        console.error("Error calling GenAI:", error);
        addMessageToUI("Sorry, I encountered an error. Please try again.", 'ai');
    } finally {
        // 4. Hide typing indicator
        typingIndicator.classList.add('hidden');
    }
}

function initGeolocation() {
    if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        return;
    }

    const onLocationFound = (position: GeolocationPosition) => {
        const { latitude, longitude, heading } = position.coords;
        const latLng: [number, number] = [latitude, longitude];

        if (!userLocationMarker) {
            const icon = L.divIcon({
                className: 'user-location-icon',
                html: `
                    <div class="pulse"></div>
                    <div class="dot"></div>
                    <div class="heading"></div>
                `,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });
            userLocationMarker = L.marker(latLng, { icon }).addTo(map);
            map.flyTo(latLng, 16);
        } else {
            userLocationMarker.setLatLng(latLng);
        }
        
        // Update heading if available
        const markerIconElement = userLocationMarker.getElement();
        if (markerIconElement && heading !== null) {
            const headingElement = markerIconElement.querySelector('.heading') as HTMLElement;
            if (headingElement) {
                headingElement.style.transform = `translate(-50%, -100%) rotate(${heading}deg)`;
            }
        }
    };

    const onLocationError = (error: GeolocationPositionError) => {
        let message = "An unknown error occurred.";
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = "Geolocation permission denied. Please enable location services in your browser settings to use this feature.";
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Location information is unavailable. This can be caused by a weak network or satellite signal.";
                break;
            case error.TIMEOUT:
                message = "The request to get your location timed out. Please try again.";
                break;
        }
        console.error(`Geolocation error: ${message} (Code: ${error.code})`);
        // In a real application, this message would be displayed to the user in a more friendly way (e.g., a toast notification).
    };

    navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
}

function populateDisplayPanel() {
    const content = document.getElementById('display-panel-content')!;
    content.innerHTML = '';
    
    const allPois = [...bridgePois, ...wazeIncidents];

    allPois.forEach(poi => {
        const card = document.createElement('div');
        card.className = 'info-card';
        card.dataset.id = poi.id.toString();

        let icon, statusClass, statusText;
        if ('type' in poi && poi.type === 'bridge') {
            icon = 'location_city';
            statusClass = 'fair';
            statusText = 'Maintenance';
        } else if ('type' in poi && poi.type === 'poi') {
            icon = 'place';
            statusClass = 'good';
            statusText = 'Open';
        } else {
            icon = 'warning';
            statusClass = 'incident';
            statusText = 'Active';
        }
        
        card.innerHTML = `
            <h3><span class="material-icons">${icon}</span> ${poi.name}</h3>
            ${poi.status ? `<p>${poi.status}</p>` : ''}
            <span class="card-status ${statusClass}">${statusText}</span>
        `;
        
        card.addEventListener('click', () => {
            const allLayers = [bridgeLayer, incidentLayer];
            for (const layerGroup of allLayers) {
                 layerGroup.eachLayer(marker => {
                    if ((marker as any).poiId === poi.id) {
                        map.flyTo([poi.lat, poi.lng], 15);
                        (marker as L.Marker).openPopup();
                    }
                });
            }
        });

        content.appendChild(card);
    });
}