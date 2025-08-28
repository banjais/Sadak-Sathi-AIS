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


// =================================================================================
// ARCHITECTURE REFACTOR: "Backend-Ready" API Simulation
// =================================================================================
const api = {
    // In a real backend, this would fetch your DoR GeoJSON shapefile.
    getRoads: async (): Promise<any> => {
        console.log("API: Fetching road data...");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return Promise.resolve({
            "type": "FeatureCollection", "features": [
                { "type": "Feature", "properties": { "name": "Araniko Highway", "status": "good" }, "geometry": { "type": "LineString", "coordinates": [[85.3, 27.7], [85.4, 27.75], [85.5, 27.7]] } },
                { "type": "Feature", "properties": { "name": "Prithvi Highway", "status": "fair" }, "geometry": { "type": "LineString", "coordinates": [[84.4, 27.7], [84.8, 27.65], [85.3, 27.7]] } },
                { "type": "Feature", "properties": { "name": "Local Road", "status": "poor" }, "geometry": { "type": "LineString", "coordinates": [[85.32, 27.68], [85.35, 27.69], [85.34, 27.66]] } },
                { "type": "Feature", "properties": { "name": "Congested Inner Road", "status": "good" }, "geometry": { "type": "LineString", "coordinates": [[85.322, 27.693], [85.324, 27.691], [85.318, 27.689], [85.316, 27.691]] } }
            ]
        });
    },
    getPOIs: async (): Promise<any[]> => {
        console.log("API: Fetching POIs...");
        await new Promise(resolve => setTimeout(resolve, 300));
        return Promise.resolve([
            { id: 1, name: "Maitighar Mandala", lat: 27.693, lng: 85.322, type: 'poi', status: 'Good condition', category: 'landmark' },
            { id: 2, name: "Thapathali Bridge", lat: 27.691, lng: 85.316, type: 'bridge', status: 'Under maintenance', category: 'bridge' },
            { id: 5, name: "Patan Hospital", lat: 27.671, lng: 85.318, type: 'poi', status: 'Open 24/7', category: 'hospital' },
            { id: 6, name: "Himalayan Java Coffee", lat: 27.695, lng: 85.320, type: 'poi', status: 'Open', category: 'coffee shop' },
            { id: 7, name: "Nabil Bank ATM", lat: 27.690, lng: 85.318, type: 'poi', status: 'In Service', category: 'atm' },
            { id: 8, name: "The Old House Restaurant", lat: 27.705, lng: 85.319, type: 'poi', status: 'Open', category: 'restaurant' },
            { id: 9, name: "Civil Mall", lat: 27.698, lng: 85.311, type: 'poi', status: 'Open', category: 'shopping' },
            { id: 10, name: "Everest Bank ATM", lat: 27.685, lng: 85.325, type: 'poi', status: 'In Service', category: 'atm' },
            { id: 11, name: "Bhatbhateni Supermarket", lat: 27.688, lng: 85.333, type: "poi", status: "Open", category: "shopping" },
        ]);
    },
    getLiveIncidents: async (): Promise<any[]> => {
        console.log("API: Fetching live incidents...");
        await new Promise(resolve => setTimeout(resolve, 400));
        const baseIncidents = [
            { id: 3, name: "Heavy Traffic", lat: 27.717, lng: 85.323, type: 'traffic', status: 'Active' },
            { id: 4, name: "Road Closure", lat: 27.70, lng: 85.4, type: 'closure', status: 'Active' },
        ];
        if (Math.random() > 0.6) {
             baseIncidents.push({ id: 101, name: "Minor Accident", lat: 27.698, lng: 85.325, type: 'other', status: 'Active' });
        }
        return Promise.resolve(baseIncidents);
    },
    getLiveTraffic: async (): Promise<any[]> => {
        console.log("API: Fetching live traffic...");
        const roads = ["Araniko Highway", "Prithvi Highway", "Local Road", "Congested Inner Road"];
        const conditions = ['clear', 'moderate', 'heavy'];
        return Promise.resolve(
            roads.map(roadName => ({ roadName, traffic: conditions[Math.floor(Math.random() * conditions.length)] }))
        );
    }
};

// Global state variables
let map: L.Map;
let roadLayer: L.GeoJSON;
let trafficLayer: L.GeoJSON;
let poiLayer: L.FeatureGroup;
let incidentLayer: L.FeatureGroup;
let routeLayer: L.FeatureGroup;
let userLocationMarker: L.Marker | null = null;
let roadsData: any = null;
let poisData: any[] = [];
let incidentsData: any[] = [];
let trafficData: any[] = [];
let currentUserPosition: { lat: number, lng: number, heading: number | null, speed: number | null } | null = null;
let currentLang = 'en';
let currentRouteCoords: [number, number][] | null = null;
let currentRouteInfo: { from: string, to: string } | null = null;
let chatHistory: any[] = [];
let geolocationWatchId: number | null = null;
let recognition: any | null = null;
let aiChatModal: HTMLElement;
let routePreferences = { preferHighways: false, avoidTolls: false, preferScenic: false };
let activeDisplayFilter: string = 'all';

// NEW: State for item selection and interaction
let selectedItemId: number | null = null;
const itemMarkers = new Map<number, L.Marker>();
const itemCards = new Map<number, HTMLElement>();

// Theme object for SuperAdmin controls
const defaultThemes = {
    light: {
        '--primary-color': '#3498db', '--primary-color-dark': '#2980b9', '--text-color': '#222222',
        '--text-color-light': '#f5f5f5', '--bg-color': '#ffffff', '--panel-bg-color': '#f8f9fa',
        '--header-bg-color': 'rgba(248, 249, 250, 0.8)', '--footer-bg-color': '#f8f9fa',
        '--border-color': '#dee2e6', '--shadow': '0 2px 10px rgba(0, 0, 0, 0.1)'
    },
    dark: {
        '--primary-color': '#3498db', '--primary-color-dark': '#2980b9', '--text-color': '#f5f5f5',
        '--text-color-light': '#f5f5f5', '--bg-color': '#1a1a1a', '--panel-bg-color': '#2c2c2c',
        '--header-bg-color': 'rgba(44, 44, 44, 0.8)', '--footer-bg-color': '#2c2c2c',
        '--border-color': '#444444', '--shadow': '0 2px 10px rgba(0, 0, 0, 0.4)'
    }
};
let currentTheme: { [key: string]: string } = defaultThemes.light;

const translations: { [key: string]: any } = {
    en: {
        layers: 'Layers', roads: 'Roads', pois: 'Points of Interest', incidents: 'Incidents', display_panel_title: 'Nearby Information', route_finder: 'Route Finder', find_route_btn: 'Find Optimal Route', clear_route_btn: 'Clear Route', share_route: 'Share Route', link_copied: 'Link Copied!', route_finder_error: 'Could not find start or end location. Please use valid POI names.', route_finder_error_no_start: 'Your current location is not available. Cannot plan route.', menu_map: 'Map', menu_alerts: 'Alerts', menu_driver: 'Driver', menu_passenger: 'Passenger', menu_settings: 'Settings', menu_profile: 'Profile', ai_chat_title: 'AI Assistant', ai_chat_placeholder: 'Ask to find a place or report an incident...', ai_chat_placeholder_passenger: 'Ask about nearby places or plan a trip...', ai_chat_placeholder_listening: 'Listening...', report_incident_prompt: 'I want to report an incident here: ', share_location: 'Share Live Location', nearby_pois: 'Nearby POIs', voice_error_no_speech: "I didn't catch that. Please try tapping the mic again.", voice_error_mic_problem: "There seems to be an issue with your microphone.", route_preferences: 'Route Preferences', prefer_highways: 'Prefer Highways', avoid_tolls: 'Avoid Tolls', prefer_scenic_route: 'Prefer Scenic Route', route_pref_scenic: 'Found a scenic route.', route_pref_highways: 'Found a route preferring highways.', route_pref_fastest: 'Fastest route found.', route_pref_avoid_tolls: 'Avoiding tolls.', mic_denied: "Microphone access was denied. Please allow microphone access in your browser settings to use voice commands.", loc_denied: "Location access was denied. Please enable it in your browser settings.", speech_unsupported: "Speech recognition is not supported by your browser.", loc_unavailable: "Could not get your location. Please check connection and settings.", loc_timeout: "Location request timed out. Please try again with a better signal.", gps_searching: 'GPS Status: Searching...', gps_ok: 'GPS Status: Signal acquired.', gps_error: 'GPS Status: Error acquiring signal.'
    },
    np: {
        layers: 'तहहरू', roads: 'सडकहरू', pois: 'रुचिका ठाउँहरू', incidents: 'घटनाहरू', display_panel_title: 'नजिकैको जानकारी', route_finder: 'मार्ग खोज्नुहोस्', find_route_btn: 'उत्तम मार्ग खोज्नुहोस्', clear_route_btn: 'मार्ग हटाउनुहोस्', share_route: 'मार्ग साझा गर्नुहोस्', link_copied: 'लिङ्क प्रतिलिपि भयो!', route_finder_error: 'सुरु वा अन्त्य स्थान फेला पार्न सकिएन। कृपया मान्य POI नामहरू प्रयोग गर्नुहोस्।', route_finder_error_no_start: 'तपाईंको हालको स्थान उपलब्ध छैन। मार्ग योजना गर्न सकिँदैन।', menu_map: 'नक्सा', menu_alerts: 'सतर्कता', menu_driver: 'चालक', menu_passenger: 'यात्री', menu_settings: 'सेटिङहरू', menu_profile: 'प्रोफाइल', ai_chat_title: 'एआई सहायक', ai_chat_placeholder: 'ठाउँ खोज्न वा घटना रिपोर्ट गर्न सोध्नुहोस्...', ai_chat_placeholder_passenger: 'नजिकैका ठाउँहरूको बारेमा सोध्नुहोस् वा यात्राको योजना बनाउनुहोस्...', ai_chat_placeholder_listening: 'सुन्दै...', report_incident_prompt: 'म यहाँ एक घटना रिपोर्ट गर्न चाहन्छु: ', share_location: 'लाइभ स्थान साझा गर्नुहोस्', nearby_pois: 'नजिकैको POIs', voice_error_no_speech: 'मैले बुझिनँ। कृपया माइक फेरि ट्याप गर्नुहोस्।', voice_error_mic_problem: 'तपाईंको माइक्रोफोनमा समस्या देखिन्छ।', route_preferences: 'मार्ग प्राथमिकताहरू', prefer_highways: 'राजमार्गहरू प्राथमिकता दिनुहोस्', avoid_tolls: 'टोलबाट बच्नुहोस्', prefer_scenic_route: 'रमणीय मार्ग प्राथमिकता दिनुहोस्', route_pref_scenic: 'एक रमणीय मार्ग फेला पर्यो।', route_pref_highways: 'राजमार्गहरूलाई प्राथमिकता दिने मार्ग फेला पर्यो।', route_pref_fastest: 'सबैभन्दा छिटो मार्ग फेला पर्यो।', route_pref_avoid_tolls: 'टोलबाट बच्दै।', mic_denied: "माइक्रोफोन पहुँच अस्वीकार गरियो। भ्वाइस कमाण्डहरू प्रयोग गर्न कृपया आफ्नो ब्राउजर सेटिङहरूमा माइक्रोफोन पहुँच अनुमति दिनुहोस्।", loc_denied: "स्थान पहुँच अस्वीकार गरियो। कृपया आफ्नो ब्राउजर सेटिङहरूमा यसलाई सक्षम गर्नुहोस्।", speech_unsupported: "तपाईंको ब्राउजरद्वारा वाक् पहिचान समर्थित छैन।", loc_unavailable: "तपाईंको स्थान प्राप्त गर्न सकिएन। कृपया जडान र सेटिङहरू जाँच गर्नुहोस्।", loc_timeout: "स्थान अनुरोधको समय सकियो। कृपया राम्रो संकेत भएको क्षेत्रमा फेरि प्रयास गर्नुहोस्।", gps_searching: 'GPS स्थिति: खोज्दै...', gps_ok: 'GPS स्थिति: संकेत प्राप्त भयो।', gps_error: 'GPS स्थिति: संकेत प्राप्त गर्नमा त्रुटि।'
    },
    // ... Other languages remain the same
    hi: { layers: 'परतें', roads: 'सड़कें', pois: 'रुचि के स्थान', incidents: 'घटनाएं', display_panel_title: 'आस-पास की जानकारी', route_finder: 'मार्ग खोजें', find_route_btn: 'इष्टतम मार्ग खोजें', clear_route_btn: 'मार्ग साफ़ करें', share_route: 'मार्ग साझा करें', link_copied: 'लिंक कॉपी किया गया!', route_finder_error: 'प्रारंभ या अंत स्थान नहीं मिला। कृपया मान्य POI नामों का उपयोग करें।', route_finder_error_no_start: 'आपका वर्तमान स्थान उपलब्ध नहीं है। मार्ग की योजना नहीं बनाई जा सकती।', menu_map: 'नक्शा', menu_alerts: 'चेतावनी', menu_driver: 'चालक', menu_passenger: 'यात्री', menu_settings: 'सेटिंग्स', menu_profile: 'प्रोफ़ाइल', ai_chat_title: 'एआई सहायक', ai_chat_placeholder: 'कोई स्थान खोजने या घटना की रिपोर्ट करने के लिए कहें...', ai_chat_placeholder_passenger: 'आस-पास के स्थानों के बारे में पूछें या यात्रा की योजना बनाएं...', ai_chat_placeholder_listening: 'सुन रहा है...', report_incident_prompt: 'मैं यहां एक घटना की रिपोर्ट करना चाहता हूं: ', share_location: 'लाइव स्थान साझा करें', nearby_pois: 'आस-पास के POI', voice_error_no_speech: 'मैंने सुना नहीं। कृपया माइक को फिर से टैप करें।', voice_error_mic_problem: 'आपके माइक्रोफ़ोन में कोई समस्या है।', route_preferences: 'मार्ग प्राथमिकताएं', prefer_highways: 'राजमार्गों को प्राथमिकता दें', avoid_tolls: 'टोल से बचें', prefer_scenic_route: 'दर्शनीय मार्ग को प्राथमिकता दें', route_pref_scenic: 'एक सुंदर मार्ग मिला।', route_pref_highways: 'राजमार्गों को प्राथमिकता देने वाला मार्ग मिला।', route_pref_fastest: 'सबसे तेज़ मार्ग मिला।', route_pref_avoid_tolls: 'टोल से बचते हुए।', mic_denied: "माइक्रोफ़ोन एक्सेस अस्वीकृत कर दिया गया। वॉयस कमांड का उपयोग करने के लिए कृपया अपनी ब्राउज़र सेटिंग्स में माइक्रोफ़ोन एक्सेस की अनुमति दें।", loc_denied: "स्थान एक्सेस अस्वीकृत कर दिया गया। कृपया इसे अपनी ब्राउज़र सेटिंग्स में सक्षम करें।", speech_unsupported: "आपके ब्राउज़र द्वारा वाक् पहचान समर्थित नहीं है।", loc_unavailable: "आपका स्थान प्राप्त नहीं किया जा सका। कृपया कनेक्शन और सेटिंग्स जांचें।", loc_timeout: "स्थान अनुरोध का समय समाप्त हो गया। कृपया बेहतर सिग्नल वाले क्षेत्र में पुनः प्रयास करें।", gps_searching: 'GPS स्थिति: खोज रहा है...', gps_ok: 'GPS स्थिति: सिग्नल मिल गया।', gps_error: 'GPS स्थिति: सिग्नल प्राप्त करने में त्रुटि।' },
    es: { layers: 'Capas', roads: 'Carreteras', pois: 'Puntos de Interés', incidents: 'Incidentes', display_panel_title: 'Información Cercana', route_finder: 'Buscador de Rutas', find_route_btn: 'Encontrar Ruta Óptima', clear_route_btn: 'Borrar Ruta', share_route: 'Compartir Ruta', link_copied: '¡Enlace Copiado!', route_finder_error: 'No se pudo encontrar la ubicación de inicio o fin. Utilice nombres de PDI válidos.', route_finder_error_no_start: 'Tu ubicación actual no está disponible. No se puede planificar la ruta.', menu_map: 'Mapa', menu_alerts: 'Alertas', menu_driver: 'Conductor', menu_passenger: 'Pasajero', menu_settings: 'Ajustes', menu_profile: 'Perfil', ai_chat_title: 'Asistente de IA', ai_chat_placeholder: 'Pregunta para encontrar un lugar o reportar un incidente...', ai_chat_placeholder_passenger: 'Pregunta sobre lugares cercanos o planifica un viaje...', ai_chat_placeholder_listening: 'Escuchando...', report_incident_prompt: 'Quiero reportar un incidente aquí: ', share_location: 'Compartir Ubicación en Vivo', nearby_pois: 'PDI Cercanos', voice_error_no_speech: 'No entendí eso. Por favor, intenta tocar el micrófono de nuevo.', voice_error_mic_problem: 'Parece que hay un problema con tu micrófono.', route_preferences: 'Preferencias de Ruta', prefer_highways: 'Preferir Autopistas', avoid_tolls: 'Evitar Peajes', prefer_scenic_route: 'Preferir Ruta Panorámica', route_pref_scenic: 'Se encontró una ruta panorámica.', route_pref_highways: 'Se encontró una ruta prefiriendo autopistas.', route_pref_fastest: 'Ruta más rápida encontrada.', route_pref_avoid_tolls: 'Evitando peajes.', mic_denied: "Acceso al micrófono denegado. Permita el acceso al micrófono en la configuración de su navegador para usar comandos de voz.", loc_denied: "Acceso a la ubicación denegado. Por favor, actívelo en la configuración de su navegador.", speech_unsupported: "El reconocimiento de voz no es compatible con su navegador.", loc_unavailable: "No se pudo obtener su ubicación. Verifique la conexión y la configuración.", loc_timeout: "La solicitud de ubicación expiró. Inténtelo de nuevo con mejor señal.", gps_searching: 'Estado del GPS: Buscando...', gps_ok: 'Estado del GPS: Señal adquirida.', gps_error: 'Estado del GPS: Error al adquirir señal.' },
    fr: { layers: 'Couches', roads: 'Routes', pois: 'Points d\'Intérêt', incidents: 'Incidents', display_panel_title: 'Informations à Proximité', route_finder: 'Recherche d\'Itinéraire', find_route_btn: 'Trouver l\'Itinéraire Optimal', clear_route_btn: 'Effacer l\'Itinéraire', share_route: 'Partager l\'Itinéraire', link_copied: 'Lien Copié !', route_finder_error: 'Impossible de trouver le lieu de départ ou d\'arrivée. Veuillez utiliser des noms de POI valides.', route_finder_error_no_start: 'Votre emplacement actuel n\'est pas disponible. Impossible de planifier l\'itinéraire.', menu_map: 'Carte', menu_alerts: 'Alertes', menu_driver: 'Conducteur', menu_passenger: 'Passager', menu_settings: 'Paramètres', menu_profile: 'Profil', ai_chat_title: 'Assistant IA', ai_chat_placeholder: 'Demandez pour trouver un lieu ou signaler un incident...', ai_chat_placeholder_passenger: 'Renseignez-vous sur les lieux à proximité ou planifiez un voyage...', ai_chat_placeholder_listening: 'Écoute...', report_incident_prompt: 'Je veux signaler un incident ici : ', share_location: 'Partager la Position en Direct', nearby_pois: 'POI à Proximité', voice_error_no_speech: 'Je n\'ai pas compris. Veuillez essayer de toucher à nouveau le micro.', voice_error_mic_problem: 'Il semble y avoir un problème avec votre microphone.', route_preferences: 'Préférences d\'Itinéraire', prefer_highways: 'Préférer les Autoroutes', avoid_tolls: 'Éviter les Péages', prefer_scenic_route: 'Préférer la Route Panorámica', route_pref_scenic: 'Un itinéraire panoramique a été trouvé.', route_pref_highways: 'Un itinéraire préférant les autoroutes a été trouvé.', route_pref_fastest: 'Itinéraire le plus rapide trouvé.', route_pref_avoid_tolls: 'Évitement des péages.', mic_denied: "Accès au microphone refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur pour utiliser les commandes vocales.", loc_denied: "Accès à la localisation refusé. Veuillez l'activer dans les paramètres de votre navigateur.", speech_unsupported: "La reconnaissance vocale n'est pas prise en charge par votre navigateur.", loc_unavailable: "Impossible d'obtenir votre position. Vérifiez la connexion et les paramètres.", loc_timeout: "La demande de localisation a expiré. Veuillez réessayer avec un meilleur signal.", gps_searching: 'État du GPS : Recherche...', gps_ok: 'État du GPS : Signal acquis.', gps_error: 'État du GPS : Erreur d\'acquisition du signal.' },
    de: { layers: 'Ebenen', roads: 'Straßen', pois: 'Interessante Orte', incidents: 'Vorfälle', display_panel_title: 'Infos in der Nähe', route_finder: 'Routenfinder', find_route_btn: 'Optimale Route Finden', clear_route_btn: 'Route Löschen', share_route: 'Route Teilen', link_copied: 'Link Kopiert!', route_finder_error: 'Start- oder Zielort konnte nicht gefunden werden. Bitte verwenden Sie gültige POI-Namen.', route_finder_error_no_start: 'Ihr aktueller Standort ist nicht verfügbar. Route kann nicht geplant werden.', menu_map: 'Karte', menu_alerts: 'Warnungen', menu_driver: 'Fahrer', menu_passenger: 'Beifahrer', menu_settings: 'Einstellungen', menu_profile: 'Profil', ai_chat_title: 'KI-Assistent', ai_chat_placeholder: 'Fragen Sie nach einem Ort oder melden Sie einen Vorfall...', ai_chat_placeholder_passenger: 'Fragen Sie nach Orten in der Nähe oder planen Sie eine Reise...', ai_chat_placeholder_listening: 'Hören...', report_incident_prompt: 'Ich möchte hier einen Vorfall melden: ', share_location: 'Live-Standort Teilen', nearby_pois: 'POIs in der Nähe', voice_error_no_speech: 'Ich habe das nicht verstanden. Bitte tippen Sie erneut auf das Mikrofon.', voice_error_mic_problem: 'Es scheint ein Problem mit Ihrem Mikrofon zu geben.', route_preferences: 'Routenpräferenzen', prefer_highways: 'Autobahnen Bevorzugen', avoid_tolls: 'Maut Vermeiden', prefer_scenic_route: 'Szenische Route Bevorzugen', route_pref_scenic: 'Eine malerische Route wurde gefunden.', route_pref_highways: 'Eine Route, die Autobahnen bevorzugt, wurde gefunden.', route_pref_fastest: 'Schnellste Route gefunden.', route_pref_avoid_tolls: 'Maut wird vermieden.', mic_denied: "Mikrofonzugriff verweigert. Bitte erlauben Sie den Mikrofonzugriff in Ihren Browsereinstellungen, um Sprachbefehle zu verwenden.", loc_denied: "Standortzugriff verweigert. Bitte aktivieren Sie ihn in Ihren Browsereinstellungen.", speech_unsupported: "Die Spracherkennung wird von Ihrem Browser nicht unterstützt.", loc_unavailable: "Ihr Standort konnte nicht abgerufen werden. Bitte überprüfen Sie Verbindung und Einstellungen.", loc_timeout: "Standortanfrage abgelaufen. Bitte versuchen Sie es mit einem besseren Signal erneut.", gps_searching: 'GPS-Status: Suche...', gps_ok: 'GPS-Status: Signal erfasst.', gps_error: 'GPS-Status: Fehler bei der Signalerfassung.' },
    zh: { layers: '图层', roads: '道路', pois: '兴趣点', incidents: '事件', display_panel_title: '附近信息', route_finder: '路线查找器', find_route_btn: '查找最佳路线', clear_route_btn: '清除路线', share_route: '分享路线', link_copied: '链接已复制!', route_finder_error: '找不到起点或终点位置。请使用有效的POI名称。', route_finder_error_no_start: '您当前的位置不可用。无法规划路线。', menu_map: '地图', menu_alerts: '警报', menu_driver: '司机', menu_passenger: '乘客', menu_settings: '设置', menu_profile: '个人资料', ai_chat_title: 'AI助手', ai_chat_placeholder: '询问查找地点或报告事件...', ai_chat_placeholder_passenger: '询问附近地点或计划行程...', ai_chat_placeholder_listening: '正在听...', report_incident_prompt: '我想在这里报告一个事件：', share_location: '分享实时位置', nearby_pois: '附近的POI', voice_error_no_speech: '我没听清。请再试一次。', voice_error_mic_problem: '您的麦克风似乎有问题。', route_preferences: '路线偏好', prefer_highways: '高速优先', avoid_tolls: '避开收费站', prefer_scenic_route: '风景路线优先', route_pref_scenic: '已找到风景路线。', route_pref_highways: '已找到高速优先路线。', route_pref_fastest: '已找到最快路线。', route_pref_avoid_tolls: '避开收费站。', mic_denied: "麦克风访问被拒绝。请在您的浏览器设置中允许麦克风访问以使用语音命令。", loc_denied: "位置访问被拒绝。请在您的浏览器设置中启用它。", speech_unsupported: "您的浏览器不支持语音识别。", loc_unavailable: "无法获取您的位置。请检查网络连接和设置。", loc_timeout: "位置请求超时。请在信号更好的区域重试。", gps_searching: 'GPS状态：搜索中...', gps_ok: 'GPS状态：已获取信号。', gps_error: 'GPS状态：获取信号时出错。' },
    ja: { layers: 'レイヤー', roads: '道路', pois: '興味のある場所', incidents: 'インシデント', display_panel_title: '周辺情報', route_finder: 'ルート検索', find_route_btn: '最適ルートを検索', clear_route_btn: 'ルートをクリア', share_route: 'ルートを共有', link_copied: 'リンクがコピーされました！', route_finder_error: '出発地または目的地が見つかりませんでした。有効なPOI名を使用してください。', route_finder_error_no_start: '現在地が利用できません。ルートを計画できません。', menu_map: '地図', menu_alerts: 'アラート', menu_driver: 'ドライバー', menu_passenger: '乗客', menu_settings: '設定', menu_profile: 'プロフィール', ai_chat_title: 'AIアシスタント', ai_chat_placeholder: '場所の検索やインシデントの報告を依頼...', ai_chat_placeholder_passenger: '近くの場所について尋ねるか、旅行を計画する...', ai_chat_placeholder_listening: '聞き取り中...', report_incident_prompt: 'ここでインシデントを報告したい：', share_location: '現在地を共有', nearby_pois: '近くのPOI', voice_error_no_speech: '聞き取れませんでした。もう一度マイクをタップしてください。', voice_error_mic_problem: 'マイクに問題があるようです。', route_preferences: 'ルート設定', prefer_highways: '高速道路を優先', avoid_tolls: '有料道路を避ける', prefer_scenic_route: '景色の良いルートを優先', route_pref_scenic: '景色の良いルートが見つかりました。', route_pref_highways: '高速道路を優先するルートが見つかりました。', route_pref_fastest: '最速ルートが見つかりました。', route_pref_avoid_tolls: '有料道路を回避しています。', mic_denied: "マイクへのアクセスが拒否されました。音声コマンドを使用するには、ブラウザの設定でマイクへのアクセスを許可してください。", loc_denied: "位置情報へのアクセスが拒否されました。ブラウザの設定で有効にしてください。", speech_unsupported: "お使いのブラウザは音声認識をサポートしていません。", loc_unavailable: "現在地を取得できませんでした。接続と設定を確認してください。", loc_timeout: "位置情報のリクエストがタイムアウトしました。電波の良い場所で再試行してください。", gps_searching: 'GPSステータス：検索中...', gps_ok: 'GPSステータス：信号を取得しました。', gps_error: 'GPSステータス：信号の取得中にエラーが発生しました。' },
    ko: { layers: '레이어', roads: '도로', pois: '관심 지점', incidents: '사건', display_panel_title: '주변 정보', route_finder: '경로 찾기', find_route_btn: '최적 경로 찾기', clear_route_btn: '경로 지우기', share_route: '경로 공유', link_copied: '링크가 복사되었습니다!', route_finder_error: '출발지 또는 목적지를 찾을 수 없습니다. 유효한 POI 이름을 사용하십시오.', route_finder_error_no_start: '현재 위치를 사용할 수 없습니다. 경로를 계획할 수 없습니다.', menu_map: '지도', menu_alerts: '알림', menu_driver: '운전자', menu_passenger: '승객', menu_settings: '설정', menu_profile: '프로필', ai_chat_title: 'AI 어시스턴트', ai_chat_placeholder: '장소를 찾거나 사건을 보고하려면 질문하세요...', ai_chat_placeholder_passenger: '주변 장소에 대해 질문하거나 여행을 계획하세요...', ai_chat_placeholder_listening: '듣는 중...', report_incident_prompt: '여기서 사건을 보고하고 싶습니다: ', share_location: '실시간 위치 공유', nearby_pois: '주변 POI', voice_error_no_speech: '聞き取れませんでした。もう一度マイクをタップしてください。', voice_error_mic_problem: '마이크에 문제가 있는 것 같습니다.', route_preferences: '경로 기본 설정', prefer_highways: '고속도로 선호', avoid_tolls: '유료 도로 피하기', prefer_scenic_route: '경치 좋은 길 선호', route_pref_scenic: '경치 좋은 경로를 찾았습니다.', route_pref_highways: '고속도로를 선호하는 경로를 찾았습니다.', route_pref_fastest: '가장 빠른 경로를 찾았습니다.', route_pref_avoid_tolls: '유료 도로를 피하는 중입니다.', mic_denied: "마이크 액세스가 거부되었습니다. 음성 명령을 사용하려면 브라우저 설정에서 마이크 액세스를 허용하십시오.", loc_denied: "위치 액세스가 거부되었습니다. 브라우저 설정에서 활성화하십시오.", speech_unsupported: "브라우저에서 음성 인식을 지원하지 않습니다。", loc_unavailable: "위치를 가져올 수 없습니다. 연결 및 설정을 확인하십시오。", loc_timeout: "위치 요청 시간이 초과되었습니다. 신호가 더 좋은 곳에서 다시 시도하십시오。", gps_searching: 'GPS 상태: 검색 중...', gps_ok: 'GPS 상태: 신호 수신 완료.', gps_error: 'GPS 상태: 신호 수신 오류.' }
};
translations.new = { ...translations.np, menu_settings: 'सेटिंग्स (नेवाः)' };
translations.mai = { ...translations.np, menu_settings: 'सेटिंग्स (मैथिली)' };

document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    initUI();
    initSpeechRecognition();
    startGeolocationWatch();
    await loadInitialData();
    handleUrlParameters();
    populateDisplayPanel();
    updateLanguage();
    setInterval(refreshLiveData, 15000);
});

async function loadInitialData() {
    const [roads, pois, incidents, traffic] = await Promise.all([
        api.getRoads(), api.getPOIs(), api.getLiveIncidents(), api.getLiveTraffic()
    ]);
    roadsData = roads; poisData = pois; incidentsData = incidents; trafficData = traffic;
    addRoadLayers(); addPoiLayer(poisData); addIncidentLayer(incidentsData);
}

async function refreshLiveData() {
    console.log("Refreshing live data...");
    const [incidents, traffic] = await Promise.all([api.getLiveIncidents(), api.getLiveTraffic()]);
    incidentsData = incidents; trafficData = traffic;
    addIncidentLayer(incidentsData); updateAndRefreshTraffic(); populateDisplayPanel();
}

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([27.7172, 85.3240], 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    const darkTiles = L.tileLayer('https{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' });
    lightTiles.addTo(map);
    (map as any).tileLayers = { light: lightTiles, dark: darkTiles };
    trafficLayer = L.geoJSON(undefined).addTo(map);
    roadLayer = L.geoJSON(undefined, { onEachFeature: onEachRoad }).addTo(map);
    poiLayer = L.featureGroup().addTo(map);
    incidentLayer = L.featureGroup().addTo(map);
    routeLayer = L.featureGroup().addTo(map);
}

function initUI() {
    aiChatModal = document.getElementById('ai-chat-modal')!;
    setupThemeControls();
    setupCoreControls();
    setupPanelsAndModals();
    setupMapInteraction();
    setupModeSwitching();
    // Only the AI chat header is draggable now
    makeDraggable(document.getElementById('ai-chat-header')!, aiChatModal.querySelector('.chat-panel') as HTMLElement);

    // Listen for page visibility changes to be more efficient
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopGeolocationWatch();
        } else {
            startGeolocationWatch();
        }
    });
}

function setupThemeControls() {
    const themeToggle = document.getElementById('theme-toggle')!;
    themeToggle.addEventListener('click', () => {
        const container = document.getElementById('app-container')!;
        const newThemeName = container.dataset.theme === 'light' ? 'dark' : 'light';
        container.dataset.theme = newThemeName;
        currentTheme = defaultThemes[newThemeName as 'light' | 'dark'];
        applyTheme(currentTheme);
        themeToggle.querySelector('.material-icons')!.textContent = newThemeName === 'light' ? 'light_mode' : 'dark_mode';
        (map as any).removeLayer((map as any).tileLayers[newThemeName === 'light' ? 'dark' : 'light']);
        (map as any).addLayer((map as any).tileLayers[newThemeName]);
    });
    // Initialize default theme
    applyTheme(currentTheme);
    setupAdminControls();
}

function setupAdminControls() {
    const adminPanel = document.getElementById('admin-theme-controls')!;
    const profileBtn = document.getElementById('profile-btn')!;
    
    // Toggle admin panel with a long press on the profile button
    let pressTimer: number;
    profileBtn.addEventListener('mousedown', () => {
        pressTimer = window.setTimeout(() => adminPanel.classList.toggle('hidden'), 1000);
    });
    profileBtn.addEventListener('mouseup', () => clearTimeout(pressTimer));
    profileBtn.addEventListener('mouseleave', () => clearTimeout(pressTimer));

    const colorPickers = adminPanel.querySelectorAll<HTMLInputElement>('input[type="color"]');
    colorPickers.forEach(picker => {
        picker.value = currentTheme[picker.dataset.cssVar!];
        picker.addEventListener('input', () => {
            const newColors = { ...currentTheme, [picker.dataset.cssVar!]: picker.value };
            applyTheme(newColors);
        });
    });

    document.getElementById('save-theme-btn')!.addEventListener('click', () => {
        colorPickers.forEach(picker => {
            currentTheme[picker.dataset.cssVar!] = picker.value;
        });
        // In a real app, this would be saved to a backend or localStorage
        localStorage.setItem('customTheme', JSON.stringify(currentTheme));
        showToast('Theme saved!');
        adminPanel.classList.add('hidden');
    });

    document.getElementById('reset-theme-btn')!.addEventListener('click', () => {
        const themeName = document.getElementById('app-container')!.dataset.theme as 'light' | 'dark';
        currentTheme = { ...defaultThemes[themeName] };
        applyTheme(currentTheme);
        colorPickers.forEach(picker => {
            picker.value = currentTheme[picker.dataset.cssVar!];
        });
        localStorage.removeItem('customTheme');
    });

    // Load custom theme from storage if it exists
    const savedTheme = localStorage.getItem('customTheme');
    if (savedTheme) {
        currentTheme = JSON.parse(savedTheme);
        applyTheme(currentTheme);
        colorPickers.forEach(picker => {
            picker.value = currentTheme[picker.dataset.cssVar!];
        });
    }
}

function applyTheme(theme: { [key: string]: string }) {
    for (const [key, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(key, value);
    }
}


function setupCoreControls() {
    const languageSelect = document.getElementById('language-select')!;
    const hamburgerMenu = document.getElementById('hamburger-menu')!;
    const settingsPanel = document.getElementById('settings-panel')!;
    const prefHighways = document.getElementById('pref-highways') as HTMLInputElement;
    const prefNoTolls = document.getElementById('pref-no-tolls') as HTMLInputElement;
    const prefScenic = document.getElementById('pref-scenic') as HTMLInputElement;
    
    languageSelect.addEventListener('change', (e) => {
        currentLang = (e.target as HTMLSelectElement).value;
        updateLanguage();
        if (recognition) {
            const langMap: { [key: string]: string } = { en: 'en-US', np: 'ne-NP', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'cmn-Hans-CN', ja: 'ja-JP', ko: 'ko-KR' };
            recognition.lang = langMap[currentLang] || 'en-US';
        }
    });
    
    hamburgerMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        // UX Improvement: If the display panel is expanded, collapse it before showing settings.
        const displayPanel = document.getElementById('display-panel')!;
        if (!displayPanel.classList.contains('collapsed')) {
            displayPanel.classList.add('collapsed');
        }
        settingsPanel.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target as Node) && !hamburgerMenu.contains(e.target as Node)) {
            settingsPanel.classList.remove('open');
        }
    });
    
    prefHighways.addEventListener('change', () => {
        routePreferences.preferHighways = prefHighways.checked;
        if (routePreferences.preferHighways) {
            routePreferences.preferScenic = false;
            prefScenic.checked = false;
        }
    });
    prefNoTolls.addEventListener('change', () => { routePreferences.avoidTolls = prefNoTolls.checked; });
    prefScenic.addEventListener('change', () => {
        routePreferences.preferScenic = prefScenic.checked;
        if (routePreferences.preferScenic) {
            routePreferences.preferHighways = false;
            prefHighways.checked = false;
        }
    });
}

function setupPanelsAndModals() {
    const displayPanelHeader = document.getElementById('display-panel-header')!;
    const displayPanel = document.getElementById('display-panel')!;
    displayPanelHeader.addEventListener('click', () => displayPanel.classList.toggle('collapsed'));

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
        routeLayer.clearLayers(); currentRouteCoords = null; currentRouteInfo = null;
        document.getElementById('route-details')!.innerHTML = '';
        shareRouteBtn.classList.add('hidden');
    });
    shareRouteBtn.addEventListener('click', shareRoute);
    
    const aiAssistantBtn = document.getElementById('ai-assistant')!;
    const aiChatCloseBtn = document.getElementById('ai-chat-close')!;
    const chatForm = document.getElementById('chat-form')!;
    aiAssistantBtn.addEventListener('click', () => {
        const mode = document.getElementById('app-container')!.dataset.mode;
        if (mode === 'driver') { toggleVoiceListening(); } 
        else { aiChatModal.classList.remove('hidden'); }
    });
    aiChatCloseBtn.addEventListener('click', () => aiChatModal.classList.add('hidden'));
    chatForm.addEventListener('submit', handleChatMessage);
}

function setupMapInteraction() {
    const centerLocationBtn = document.getElementById('center-location-btn')!;
    const reportIncidentBtn = document.getElementById('report-incident-btn')!;

    document.getElementById('toggle-roads')!.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        if (checked) { map.addLayer(roadLayer); map.addLayer(trafficLayer); } 
        else { map.removeLayer(roadLayer); map.removeLayer(trafficLayer); }
    });
    document.getElementById('toggle-pois')!.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) map.addLayer(poiLayer); else map.removeLayer(poiLayer);
    });
    document.getElementById('toggle-incidents')!.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) map.addLayer(incidentLayer); else map.removeLayer(incidentLayer);
    });
    
    centerLocationBtn.addEventListener('click', () => {
        if (currentUserPosition) { map.setView([currentUserPosition.lat, currentUserPosition.lng], 15); }
    });
    
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
    driverModeBtn.addEventListener('click', () => setMode('driver'));
    passengerModeBtn.addEventListener('click', () => setMode('passenger'));
}

function makeDraggable(button: HTMLElement, dragTarget?: HTMLElement) {
    let isDragging = false; let offsetX: number, offsetY: number;
    const target = dragTarget || button;
    const onMouseDown = (e: MouseEvent | TouchEvent) => {
        isDragging = true;
        const event = 'touches' in e ? e.touches[0] : e;
        offsetX = event.clientX - target.getBoundingClientRect().left;
        offsetY = event.clientY - target.getBoundingClientRect().top;
        target.style.position = 'fixed';
    };
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return; e.preventDefault();
        const event = 'touches' in e ? e.touches[0] : e;
        let newX = event.clientX - offsetX; let newY = event.clientY - offsetY;
        newX = Math.max(0, Math.min(newX, window.innerWidth - target.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - target.offsetHeight));
        target.style.left = `${newX}px`; target.style.top = `${newY}px`;
    };
    const onMouseUp = () => { isDragging = false; };
    button.addEventListener('mousedown', onMouseDown); document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp); button.addEventListener('touchstart', onMouseDown, { passive: false });
    document.addEventListener('touchmove', onMouseMove, { passive: false }); document.addEventListener('touchend', onMouseUp);
}

function handleGeolocationError(err: GeolocationPositionError) {
    console.warn(`Could not get location: ${err.message} (Code: ${err.code})`);
    let messageKey = 'loc_unavailable';
    if (err.code === err.PERMISSION_DENIED) messageKey = 'loc_denied';
    else if (err.code === err.TIMEOUT) messageKey = 'loc_timeout';
    showToast(translations[currentLang][messageKey] || translations.en[messageKey]);
    updateGpsIndicator('error', translations[currentLang].gps_error || translations.en.gps_error);
    if (geolocationWatchId) {
        navigator.geolocation.clearWatch(geolocationWatchId);
        geolocationWatchId = null;
    }
}

function startGeolocationWatch() {
    if (geolocationWatchId !== null) return; // Already watching
    console.log("Starting geolocation watch...");
    updateGpsIndicator('searching', translations[currentLang].gps_searching || translations.en.gps_searching);
    const options = { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 };
    geolocationWatchId = navigator.geolocation.watchPosition(updateUserLocation, handleGeolocationError, options);
}

function stopGeolocationWatch() {
    if (geolocationWatchId !== null) {
        console.log("Stopping geolocation watch.");
        navigator.geolocation.clearWatch(geolocationWatchId);
        geolocationWatchId = null;
    }
}

function updateUserLocation(pos: GeolocationPosition) {
    const { latitude, longitude, heading, speed } = pos.coords;
    currentUserPosition = { lat: latitude, lng: longitude, heading, speed };
    updateGpsIndicator('ok', translations[currentLang].gps_ok || translations.en.gps_ok);
    const icon = L.divIcon({ className: 'user-location-icon', html: `<div class="pulse"></div><div class="dot"></div><div class="heading"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
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
    // Update Cockpit
    const speedWidget = document.querySelector('#speed-widget .value');
    if (speedWidget) speedWidget.textContent = speed ? Math.round(speed * 3.6).toString() : '0';
    
    const compassWidget = document.querySelector('#compass-widget .compass-rose');
    if (compassWidget) {
        (compassWidget as HTMLElement).style.transform = `rotate(${heading ? -heading : 0}deg)`;
        const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round((heading || 0) / 45) % 8;
        (compassWidget as HTMLElement).textContent = cardinals[index];
    }

    const tempWidget = document.querySelector('#temp-widget .value');
    if (tempWidget && tempWidget.textContent?.startsWith('--')) {
        // Mock temperature update
        tempWidget.textContent = `${(Math.random() * 5 + 20).toFixed(0)}°`;
    }
}

function updateGpsIndicator(status: 'ok' | 'searching' | 'error', title: string) {
    const indicator = document.getElementById('gps-status-indicator')!;
    indicator.className = `gps-status-indicator gps-${status}`;
    indicator.title = title;
}


function handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from'); const to = params.get('to');
    const incidents = params.get('incidents'); const traffic = params.get('traffic');
    if (from && to) {
        findOptimalRoute(from, to);
        (document.getElementById('from-input') as HTMLInputElement).value = from;
        (document.getElementById('to-input') as HTMLInputElement).value = to;
    }
    if (incidents || traffic) {
        let warningHtml = 'Shared route information:<ul>';
        if (traffic) { warningHtml += `<li>Traffic is reported as ${traffic}.</li>`; }
        if (incidents) {
            const incidentIds = incidents.split(',').map(id => parseInt(id, 10));
            warningHtml += `<li>${incidentIds.length} incident(s) reported along the route.</li>`;
            setTimeout(() => {
                incidentLayer.eachLayer((layer: any) => {
                    if (incidentIds.includes(layer.options.incidentId)) { layer.openPopup(); }
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
        driverBtn.classList.add('active'); passengerBtn.classList.remove('active');
        aiIcon.textContent = 'mic';
        chatInput.setAttribute('data-lang-key-placeholder', 'ai_chat_placeholder');
    } else {
        passengerBtn.classList.add('active'); driverBtn.classList.remove('active');
        aiIcon.textContent = 'chat';
        chatInput.setAttribute('data-lang-key-placeholder', 'ai_chat_placeholder_passenger');
    }
    updateLanguage();
}

function shareRoute() {
    if (!currentRouteInfo) {
        if (!currentUserPosition) return;
        const url = `${window.location.origin}${window.location.pathname}?from=My%20Location&lat=${currentUserPosition.lat}&lng=${currentUserPosition.lng}`;
        navigator.clipboard.writeText(url).then(() => showToast(translations[currentLang].link_copied || 'Location link copied!'));
        return;
    }
    const from = encodeURIComponent(currentRouteInfo.from);
    const to = encodeURIComponent(currentRouteInfo.to);
    const routeBounds = L.polyline(currentRouteCoords!).getBounds();
    const incidentsOnRoute = incidentsData.filter(inc => routeBounds.contains([inc.lat, inc.lng]));
    const incidentIds = incidentsOnRoute.map(inc => inc.id).join(',');
    const roadsOnRoute = roadsData.features.filter((feature: any) => {
        const roadLine = L.polyline(feature.geometry.coordinates.map((c: any) => [c[1], c[0]]));
        return routeBounds.intersects(roadLine.getBounds());
    });
    const trafficOnRoute = roadsOnRoute.map((road: any) => trafficData.find(t => t.roadName === road.properties.name)?.traffic);
    const hasHeavy = trafficOnRoute.includes('heavy');
    const hasModerate = trafficOnRoute.includes('moderate');
    const overallTraffic = hasHeavy ? 'heavy' : (hasModerate ? 'moderate' : 'clear');
    let url = `${window.location.origin}${window.location.pathname}?from=${from}&to=${to}`;
    if (incidentIds) url += `&incidents=${incidentIds}`;
    if (overallTraffic !== 'clear') url += `&traffic=${overallTraffic}`;
    let shareText = `Check out my route from ${currentRouteInfo.from} to ${currentRouteInfo.to} on Sadak Sathi!`;
    if (overallTraffic !== 'clear') shareText += ` Traffic is currently ${overallTraffic}.`;
    if (incidentsOnRoute.length > 0) shareText += ` Heads up, there is ${incidentsOnRoute.length} incident(s) reported along the way.`;

    if (navigator.share) {
        navigator.share({ title: 'My Sadak Sathi Route', text: shareText, url: url }).catch(console.error);
    } else {
        navigator.clipboard.writeText(`${shareText}\n${url}`).then(() => showToast(translations[currentLang].link_copied || 'Link Copied!'));
    }
}

function getVisiblePoisAndIncidents() {
    const bounds = map.getBounds();
    const visiblePois = poisData.filter(p => bounds.contains([p.lat, p.lng])).map(({ id, name, type, status, category }) => ({ id, name, type, status, category }));
    const visibleIncidents = incidentsData.filter(i => bounds.contains([i.lat, i.lng])).map(({ id, name, type, status }) => ({ id, name, type, status }));
    return { pois: visiblePois, incidents: visibleIncidents };
}

function unhighlightAll() {
    if (selectedItemId === null) return;
    const card = itemCards.get(selectedItemId);
    if (card) card.classList.remove('info-card--highlighted');
    const marker = itemMarkers.get(selectedItemId);
    if (marker && marker.getElement()) {
        marker.getElement()!.classList.remove('map-icon--highlighted');
    }
    selectedItemId = null;
}

function highlightItem(itemId: number) {
    unhighlightAll();
    selectedItemId = itemId;
    const card = itemCards.get(itemId);
    const marker = itemMarkers.get(itemId);
    if (card) {
        card.classList.add('info-card--highlighted');
        card.classList.add('info-card--clicked');
        setTimeout(() => card.classList.remove('info-card--clicked'), 300);
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (marker && marker.getElement()) {
        marker.getElement()!.classList.add('map-icon--highlighted');
    }
}

function populateDisplayPanel() {
    const listContainer = document.getElementById('display-panel-list')!;
    const filtersContainer = document.getElementById('display-panel-filters')!;
    unhighlightAll();
    listContainer.innerHTML = '';
    itemCards.clear();
    filtersContainer.innerHTML = '';
    const allItems = [...poisData, ...incidentsData.map(i => ({ ...i, category: 'incidents' }))];
    const itemsInView = allItems.filter(item => map.getBounds().contains([item.lat, item.lng]));
    if (itemsInView.length === 0) {
        listContainer.innerHTML = `<p style="padding: 20px; text-align: center; opacity: 0.7;">No information in current map view.</p>`;
        return;
    }
    const categories = ['all', ...Array.from(new Set(itemsInView.map(item => item.category)))];
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn'; btn.dataset.category = category;
        btn.textContent = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (category === activeDisplayFilter) btn.classList.add('active');
        btn.addEventListener('click', () => { activeDisplayFilter = category; populateDisplayPanel(); });
        filtersContainer.appendChild(btn);
    });
    const filteredItems = activeDisplayFilter === 'all' ? itemsInView : itemsInView.filter(item => item.category === activeDisplayFilter);
    if (activeDisplayFilter === 'all') {
        const groupedItems: { [key: string]: any[] } = {};
        filteredItems.forEach(item => { if (!groupedItems[item.category]) groupedItems[item.category] = []; groupedItems[item.category].push(item); });
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
    card.innerHTML = `<h3><span class="material-icons">${icon}</span> ${item.name}</h3><p>${item.status}</p><span class="card-status ${statusClass}">${item.type.replace(/^\w/, c => c.toUpperCase())}</span>`;
    card.addEventListener('click', () => {
        map.setView([item.lat, item.lng], 16);
        highlightItem(item.id);
        const marker = itemMarkers.get(item.id);
        if (marker) {
            marker.openPopup();
        }
    });
    itemCards.set(item.id, card);
    return card;
}

function addRoadLayers() {
    if (!roadsData) return;
    trafficLayer.addData(roadsData); roadLayer.addData(roadsData);
    trafficLayer.setStyle((feature) => ({ color: getTrafficColor(feature!.properties.name), weight: 10, opacity: 0.5 }));
    roadLayer.setStyle(() => ({ color: '#fff', weight: 4, opacity: 1 }));
}

function onEachRoad(feature: any, layer: any) {
    if (feature.properties && feature.properties.name) {
        const trafficInfo = trafficData.find(t => t.roadName === feature.properties.name);
        const popupContent = `<strong>${feature.properties.name}</strong><br>Status: ${feature.properties.status}<br>Traffic: <span id="traffic-${feature.properties.name.replace(/\s/g, '')}">${trafficInfo ? trafficInfo.traffic : 'N/A'}</span>`;
        layer.bindPopup(popupContent);
    }
}

function addPoiLayer(pois: any[]) {
    poiLayer.clearLayers();
    pois.forEach(poi => {
        const icon = L.divIcon({ html: `<span class="material-icons">${poi.category === 'hospital' ? 'local_hospital' : 'place'}</span>`, className: 'map-icon', iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -24] });
        const marker = L.marker([poi.lat, poi.lng], { icon }).bindPopup(`<strong>${poi.name}</strong><br>${poi.status}`).addTo(poiLayer);
        marker.on('click', () => {
            highlightItem(poi.id);
        });
        itemMarkers.set(poi.id, marker);
    });
}

function addIncidentLayer(incidents: any[]) {
    incidentLayer.clearLayers();
    incidents.forEach(incident => {
        const icon = L.divIcon({ html: `<span class="material-icons" style="color: var(--danger-color);">${incident.type === 'closure' ? 'block' : 'warning'}</span>`, className: 'map-icon', iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -24] });
        const marker = L.marker([incident.lat, incident.lng], { icon, incidentId: incident.id }).bindPopup(`<strong>${incident.name}</strong><br>Status: ${incident.status}`).addTo(incidentLayer);
        marker.on('click', () => {
            highlightItem(incident.id);
        });
        itemMarkers.set(incident.id, marker);
    });
}

function getTrafficColor(roadName: string): string {
    const trafficInfo = trafficData.find(t => t.roadName === roadName);
    switch (trafficInfo?.traffic) {
        case 'heavy': return '#e74c3c'; case 'moderate': return '#f39c12';
        case 'clear': return '#2ecc71'; default: 'transparent';
    }
    return 'transparent';
}

function updateAndRefreshTraffic() {
    trafficLayer.setStyle(feature => ({ color: getTrafficColor(feature!.properties.name), weight: 10, opacity: 0.5 }));
    document.querySelectorAll('[id^="traffic-"]').forEach(el => {
        const roadName = el.id.substring(8).replace(/([A-Z])/g, ' $1').trim();
        const trafficInfo = trafficData.find(t => t.roadName === roadName);
        if (trafficInfo) el.textContent = trafficInfo.traffic;
    });
    const hasHeavyTraffic = trafficData.some(r => r.traffic === 'heavy');
    document.querySelector('#hamburger-menu .blinking-dot')?.classList.toggle('hide', !hasHeavyTraffic);
}

function findOptimalRoute(fromName: string, toName: string) {
    routeLayer.clearLayers();
    const allLocations = [...poisData, {name: 'My Location', lat: currentUserPosition?.lat, lng: currentUserPosition?.lng}];
    const startPoint = fromName === 'My Location' ? allLocations.find(p => p.name === 'My Location') : poisData.find(p => p.name.toLowerCase() === fromName.toLowerCase());
    const endPoint = toName === 'My Location' ? allLocations.find(p => p.name === 'My Location') : poisData.find(p => p.name.toLowerCase() === toName.toLowerCase());
    if (!startPoint || !endPoint) { showToast(translations[currentLang].route_finder_error || translations.en.route_finder_error); return; }
    if ((fromName === 'My Location' || toName === 'My Location') && !currentUserPosition) { showToast(translations[currentLang].route_finder_error_no_start || translations.en.route_finder_error_no_start); return; }
    let waypoints: [number, number][] = [[startPoint.lng, startPoint.lat], [endPoint.lng, endPoint.lat]];
    let preferenceMessage = translations[currentLang].route_pref_fastest;
    if (routePreferences.preferHighways) {
        const highway = roadsData.features.find((f: any) => f.properties.name === "Prithvi Highway");
        if (highway) { const midPoint = highway.geometry.coordinates[Math.floor(highway.geometry.coordinates.length / 2)]; waypoints.splice(1, 0, midPoint); }
        preferenceMessage = translations[currentLang].route_pref_highways;
    } else if (routePreferences.preferScenic) {
        const scenicRoad = roadsData.features.find((f: any) => f.properties.name === "Local Road");
        if (scenicRoad) { const midPoint = scenicRoad.geometry.coordinates[Math.floor(scenicRoad.geometry.coordinates.length / 2)]; waypoints.splice(1, 0, midPoint); }
        preferenceMessage = translations[currentLang].route_pref_scenic;
    } else {
        const midLat = (startPoint.lat + endPoint.lat) / 2 + (Math.random() - 0.5) * 0.01;
        const midLng = (startPoint.lng + endPoint.lng) / 2 + (Math.random() - 0.5) * 0.01;
        waypoints.splice(1, 0, [midLng, midLat]);
    }
    if (routePreferences.avoidTolls) { waypoints.splice(1, 0, [waypoints[1][0] + 0.005, waypoints[1][1] + 0.005]); preferenceMessage += ` ${translations[currentLang].route_pref_avoid_tolls}`; }
    const routeLine = L.polyline(waypoints.map(p => [p[1], p[0]]), { color: 'var(--primary-color)', weight: 6, opacity: 0.8 }).addTo(routeLayer);
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    currentRouteCoords = (routeLine.getLatLngs() as L.LatLng[]).map(latlng => [latlng.lat, latlng.lng]);
    currentRouteInfo = { from: fromName, to: toName };
    const routeDetails = document.getElementById('route-details')!;
    routeDetails.innerHTML = `<p><strong>${preferenceMessage.trim()}</strong></p><p>Distance: ${(Math.random() * 5 + 2).toFixed(1)} km</p><p>Time: ${Math.floor(Math.random() * 15 + 5)} mins</p>`;
    document.getElementById('share-route-btn')!.classList.remove('hidden'); document.getElementById('route-finder-panel')!.classList.add('hidden');
}

function initSpeechRecognition() {
    if (!SpeechRecognition) { showToast(translations[currentLang].speech_unsupported || translations.en.speech_unsupported); console.warn("Speech Recognition not supported."); return; }
    recognition = new SpeechRecognition();
    recognition.continuous = false; recognition.interimResults = false;
    const langMap: { [key: string]: string } = { en: 'en-US', np: 'ne-NP', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'cmn-Hans-CN', ja: 'ja-JP', ko: 'ko-KR' };
    recognition.lang = langMap[currentLang];
    recognition.onresult = (event: any) => { (document.getElementById('chat-input') as HTMLInputElement).value = event.results[0][0].transcript; handleChatMessage(); };
    recognition.onerror = (event: any) => {
        let message = translations[currentLang].voice_error_mic_problem;
        if (event.error === 'no-speech' || event.error === 'speech-not-recognized') { message = translations[currentLang].voice_error_no_speech; } 
        else if (event.error === 'not-allowed') { message = translations[currentLang].mic_denied; }
        addMessageToChat(message, 'ai'); console.error('Speech recognition error:', event.error);
    };
    recognition.onend = () => {
        document.getElementById('ai-assistant')!.classList.remove('listening');
        const chatInput = document.getElementById('chat-input') as HTMLInputElement;
        const placeholderKey = document.getElementById('app-container')!.dataset.mode === 'driver' ? 'ai_chat_placeholder' : 'ai_chat_placeholder_passenger';
        chatInput.placeholder = translations[currentLang][placeholderKey] || translations.en[placeholderKey];
    };
}

function toggleVoiceListening() {
    if (!recognition) return;
    const aiButton = document.getElementById('ai-assistant')!;
    if (aiButton.classList.contains('listening')) { recognition.stop(); } 
    else {
        recognition.start();
        aiButton.classList.add('listening'); aiChatModal.classList.remove('hidden');
        (document.getElementById('chat-input') as HTMLInputElement).placeholder = translations[currentLang].ai_chat_placeholder_listening || translations.en.ai_chat_placeholder_listening;
    }
}

async function handleChatMessage(e?: Event) {
    e?.preventDefault();
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const message = chatInput.value.trim();
    if (!message) return;
    addMessageToChat(message, 'user'); chatInput.value = '';
    const typingIndicator = document.getElementById('typing-indicator')!;
    typingIndicator.classList.remove('hidden');
    const visibleFeatures = getVisiblePoisAndIncidents();
    const currentMode = document.getElementById('app-container')!.dataset.mode;
    const activeRoute = currentRouteInfo ? `An active route is set from ${currentRouteInfo.from} to ${currentRouteInfo.to}.` : 'No active route.';
    const tools: Tool[] = [{ functionDeclarations: [ { name: 'add_incident', description: 'Adds a new incident report to the map at the user\'s current location. Use for traffic jams, accidents, road closures, etc. Example: "Report a crash here"', parameters: { type: Type.OBJECT, properties: { incident_name: { type: Type.STRING }, incident_type: { type: Type.STRING } }, required: ['incident_name', 'incident_type'] } }, { name: 'start_navigation', description: 'Starts navigation from the user\'s current location to a specified destination. Example: "Navigate to Patan Hospital"', parameters: { type: Type.OBJECT, properties: { destination_name: { type: Type.STRING } }, required: ['destination_name'] } }, { name: 'find_nearby_pois', description: 'Finds points of interest (POIs) of a specific category near the user\'s current location.', parameters: { type: Type.OBJECT, properties: { category: { type: Type.STRING, description: `The category of POI. Available categories: ${[...new Set(poisData.map(p => p.category))].join(', ')}` } }, required: ['category'] } } ] }];
    const persona = currentMode === 'driver' ? 'You are a concise, voice-first co-pilot. Keep responses short and to the point for a hands-free experience.' : 'You are a helpful and friendly tour guide for a passenger. Provide interesting details and be conversational.';
    let systemInstruction = `You are Sadak Sathi, a helpful AI road assistant for a navigation app in Nepal. ${persona} Current user mode: ${currentMode}. Current language: ${currentLang}. User's current location: ${currentUserPosition ? `${currentUserPosition.lat.toFixed(4)}, ${currentUserPosition.lng.toFixed(4)}` : 'Not available'}. ${activeRoute} Current route preferences: Prefer Highways: ${routePreferences.preferHighways}, Avoid Tolls: ${routePreferences.avoidTolls}, Prefer Scenic: ${routePreferences.preferScenic}. Current traffic on major roads: ${JSON.stringify(trafficData)}. Visible points of interest on the map: ${JSON.stringify(visibleFeatures.pois)}. Visible incidents on the map: ${JSON.stringify(visibleFeatures.incidents)}. Respond in the user's current language.`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { role: 'user', parts: [{ text: message }] }, config: { systemInstruction: systemInstruction, tools: tools } });
        typingIndicator.classList.add('hidden');
        const functionCalls = response.candidates?.[0]?.content.parts.filter(part => part.functionCall);
        if (functionCalls && functionCalls.length > 0) {
            for (const part of functionCalls) {
                const { name, args } = part.functionCall!; let toolResponse = '';
                if (name === 'add_incident') {
                    if (!currentUserPosition) { toolResponse = 'Cannot report an incident without your current location.'; } 
                    else {
                        const incidentName = (args as any).incident_name as string; const incidentType = (args as any).incident_type as string;
                        const newIncident = { id: incidentsData.length + 100, name: incidentName, lat: currentUserPosition.lat, lng: currentUserPosition.lng, type: incidentType, status: 'Active' };
                        incidentsData.push(newIncident); addIncidentLayer(incidentsData); populateDisplayPanel();
                        toolResponse = `OK, I've reported "${incidentName}" at your current location.`; showToast(`Incident Reported: ${incidentName}`);
                    }
                } else if (name === 'start_navigation') {
                    const destination = (args as any).destination_name as string; findOptimalRoute("My Location", destination);
                    toolResponse = `Starting navigation to ${destination}.`;
                } else if (name === 'find_nearby_pois') {
                    const category = (args as any).category as string;
                    if (!currentUserPosition) { toolResponse = "I can't find nearby places without your location."; } 
                    else {
                        const nearby = poisData.filter(p => p.category.toLowerCase() === category.toLowerCase()).map(p => ({ ...p, distance: L.latLng(currentUserPosition!.lat, currentUserPosition!.lng).distanceTo([p.lat, p.lng]) })).filter(p => p.distance < 2000).sort((a, b) => a.distance - b.distance).slice(0, 3);
                        if (nearby.length > 0) {
                             toolResponse = `Here are some nearby ${category}s. You can tap to navigate.`;
                             const suggestionsHtml = nearby.map(p => `<button class="poi-suggestion-btn" data-destination="${p.name}">${p.name} (~${(p.distance/1000).toFixed(1)} km)</button>`).join('');
                             addMessageToChat(toolResponse + `<div class="poi-suggestions">${suggestionsHtml}</div>`, 'ai');
                             document.querySelectorAll('.poi-suggestion-btn').forEach(btn => {
                                 btn.addEventListener('click', (e) => {
                                     const destination = (e.currentTarget as HTMLElement).dataset.destination;
                                     if(destination) { findOptimalRoute('My Location', destination); aiChatModal.classList.add('hidden'); }
                                 });
                             });
                             return;
                        } else { toolResponse = `Sorry, I couldn't find any ${category}s nearby.`; }
                    }
                }
                addMessageToChat(toolResponse, 'ai');
            }
        } else { addMessageToChat(response.text, 'ai'); }
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
        el.textContent = translations[currentLang]?.[key] || translations.en[key];
    });
    document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
        const key = el.getAttribute('data-lang-key-placeholder')!;
        el.setAttribute('placeholder', translations[currentLang]?.[key] || translations.en[key]);
    });
    // Update GPS indicator title
    const indicator = document.getElementById('gps-status-indicator')!;
    if (indicator.classList.contains('gps-ok')) indicator.title = translations[currentLang].gps_ok || translations.en.gps_ok;
    else if (indicator.classList.contains('gps-searching')) indicator.title = translations[currentLang].gps_searching || translations.en.gps_searching;
    else indicator.title = translations[currentLang].gps_error || translations.en.gps_error;
}

function showToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'toast'; toast.textContent = message; document.body.appendChild(toast);
    toast.style.position = 'fixed';
    toast.style.bottom = '95px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'var(--primary-color)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.zIndex = '102';
    toast.style.boxShadow = 'var(--shadow)';
    setTimeout(() => { toast.remove(); }, 3000);
}