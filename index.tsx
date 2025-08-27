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
        menu_map: 'Map',
        menu_alerts: 'Alerts',
        menu_driver: 'Driver',
        menu_profile: 'Profile',
    },
    np: {
        layers: 'तहहरू',
        roads: 'सडकहरू',
        bridges: 'पुल र POIs',
        incidents: 'घटनाहरू',
        display_panel_title: 'नजिकैको जानकारी',
        route_finder: 'मार्ग खोज्नुहोस्',
        menu_map: 'नक्सा',
        menu_alerts: 'सतर्कता',
        menu_driver: 'चालक',
        menu_profile: 'प्रोफाइल',
    },
    hi: {
        layers: 'परतें',
        roads: 'सड़कें',
        bridges: 'पुल और POIs',
        incidents: 'घटनाएं',
        display_panel_title: 'आस-पास की जानकारी',
        route_finder: 'मार्ग खोजें',
        menu_map: 'नक्शा',
        menu_alerts: 'चेतावनी',
        menu_driver: 'चालक',
        menu_profile: 'प्रोफ़ाइल',
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

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initUI();
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

    // Route Finder UI Elements
    const routeFinderTrigger = document.getElementById('route-finder-trigger')!;
    const routeFinderPanel = document.getElementById('route-finder-panel')!;
    const routeFinderClose = document.getElementById('route-finder-close')!;
    const findRouteBtn = document.getElementById('find-route-btn')!;
    const clearRouteBtn = document.getElementById('clear-route-btn')!;

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
    
    // Route Finder Panel Logic
    routeFinderTrigger.addEventListener('click', () => {
        routeFinderPanel.classList.remove('hidden');
    });
    routeFinderClose.addEventListener('click', () => {
        routeFinderPanel.classList.add('hidden');
    });
    findRouteBtn.addEventListener('click', findOptimalRoute);
    clearRouteBtn.addEventListener('click', clearRoute);


    // Draggable AI button
    makeDraggable(aiAssistant);
    
    // Language switcher
    langSelect.addEventListener('change', (e) => {
        currentLang = (e.target as HTMLSelectElement).value;
        updateLanguage();
    });
}

function findOptimalRoute() {
    clearRoute();

    // --- MOCK LOGIC FOR DEMONSTRATION ---
    // In this mock, we will simulate a route that INTERSECTS with the known road closure
    // to demonstrate the alert functionality.
    const roadClosureIncident = wazeIncidents.find(i => i.name === "Road Closure")!;
    const routeDetails = document.getElementById('route-details')!;

    // A real app would get a route from a service and check for incidents.
    // Here, we hardcode the route to pass through the incident for the demo.
    const routeCoords = [
        [27.7172, 85.3240], // Start near app center
        [roadClosureIncident.lat, roadClosureIncident.lng], // Path through the incident
        [27.691, 85.316]    // End at Thapathali Bridge
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

    // We do NOT close the panel, so the user can see the warning.
}

function clearRoute() {
    routeLayer.clearLayers();
    const routeDetails = document.getElementById('route-details')!;
    routeDetails.innerHTML = '';
    routeDetails.className = ''; // Reset any warning/success styling
}


function updateLanguage() {
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang-key') as keyof typeof translations.en;
        const translation = translations[currentLang as keyof typeof translations]?.[key];
        if (translation) {
            el.textContent = translation;
        }
    });
}

function makeDraggable(element: HTMLElement) {
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
        console.error(`Geolocation error: ${error.message}`);
        // Optionally, inform the user that location could not be fetched.
    };

    navigator.geolocation.watchPosition(onLocationFound, onLocationError, {
        enableHighAccuracy: true,
        timeout: 5000,
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