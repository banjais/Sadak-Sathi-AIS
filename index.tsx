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
            { id: 3, name: "Heavy Traffic", lat: 27.717, lng: 85.323, type: 'traffic', status: 'Active', category: 'incidents' },
            { id: 4, name: "Road Closure", lat: 27.70, lng: 85.4, type: 'closure', status: 'Active', category: 'incidents' },
        ];
        if (Math.random() > 0.6) {
             baseIncidents.push({ id: 101, name: "Minor Accident", lat: 27.698, lng: 85.325, type: 'other', status: 'Active', category: 'incidents' });
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
        layers: 'तहहरू', roads: 'सडकहरू', pois: 'रुचिका ठाउँहरू', incidents: 'घटनाहरू', display_panel_title: 'नजिकैको जानकारी', route_finder: 'मार्ग खोज्नुहोस्', find_route_btn: 'उत्तम मार्ग खोज्नुहोस्', clear_route_btn: 'मार्ग हटाउनुहोस्', share_route: 'मार्ग साझा गर्नुहोस्', link_copied: 'लिङ्क प्रतिलिपि भयो!', route_finder_error: 'सुरु वा अन्त्य स्थान फेला पार्न सकिएन। कृपया मान्य POI नामहरू प्रयोग गर्नुहोस्।', route_finder_error_no_start: 'तपाईंको हालको स्थान उपलब्ध छैन। मार्ग योजना गर्न सकिँदैन।', menu_map: 'नक्सा', menu_alerts: 'सतर्कता', menu_driver: 'चालक', menu_passenger: 'यात्री', menu_settings: 'सेटिङहरू', menu_profile: 'प्रोफाइल', ai_chat_title: 'एआई सहायक', ai_chat_placeholder: 'ठाउँ खोज्न वा घटना रिपोर्ट गर्न सोध्नुहोस्...', ai_chat_placeholder_passenger: 'नजिकैका ठाउँहरूको बारेमा सोध्नुहोस् वा यात्राको योजना बनाउनुहोस्...', ai_chat_placeholder_listening: 'सुन्दै...', report_incident_prompt: 'म यहाँ एक घटना रिपोर्ट गर्न चाहन्छु: ', share_location: 'लाइभ स्थान साझा गर्नुहोस्', nearby_pois: 'नजिकैको POIs', voice_error_no_speech: 'मैले बुझिनँ। कृपया माइक फेरि ट्याप गर्नुहोस्।', voice_error_mic_problem: 'तपाईंको माइक्रोफोनमा समस्या देखिन्छ।', route_preferences: 'मार्ग प्राथमिकताहरू', prefer_highways: 'राजमार्गहरू प्राथमिकता दिनुहोस्', avoid_tolls: 'टोलबाट बच्नुहोस्', prefer_scenic_route: 'रमणीय मार्ग प्राथमिकता दिनुहोस्', route_pref_scenic: 'एक रमणीय मार्ग फेला पर्यो।', route_pref_highways: 'राजमार्गहरूलाई प्राथमिकता दिने मार्ग फेला पर्यो।', route_pref_fastest: 'सबैभन्दा छिटो मार्ग फेला पर्यो।', route_pref_avoid_tolls: 'टोलबाट बच्दै।', mic_denied: "माइक्रोफोन पहुँच अस्वीकार गरियो। भ्वाइस कमाण्डहरू प्रयोग गर्न कृपया आफ्नो ब्राउजर सेटिङहरूमा माइक्रोफोन पहुँच अनुमति दिनुहोस्।", loc_denied: "स्थान पहुँच अस्वीकार गरियो। कृपया आफ्नो ब्राउजर सेटिङहरूमा यसलाई सक्षम गर्नुहोस्।", speech_unsupported: "तपाईंको ब्राउजरद्वारा वाक् पहिचान समर्थित छैन।", loc_unavailable: "तपाईंको स्थान प्राप्त गर्न सकिँदैन। कृपया जडान र सेटिङहरू जाँच गर्नुहोस्।", loc_timeout: "स्थान अनुरोधको समय सकियो। कृपया राम्रो संकेत भएको क्षेत्रमा फेरि प्रयास गर्नुहोस्।", gps_searching: 'GPS स्थिति: खोज्दै...', gps_ok: 'GPS स्थिति: संकेत प्राप्त भयो।', gps_error: 'GPS स्थिति: संकेत प्राप्त गर्नमा त्रुटि।'
    },
    hi: { layers: 'परतें', roads: 'सड़कें', pois: 'रुचि के स्थान', incidents: 'घटनाएं', display_panel_title: 'आस-पास की जानकारी', route_finder: 'मार्ग खोजें', find_route_btn: 'इष्टतम मार्ग खोजें', clear_route_btn: 'मार्ग साफ़ करें', share_route: 'मार्ग साझा करें', link_copied: 'लिंक कॉपी किया गया!', route_finder_error: 'प्रारंभ या अंत स्थान नहीं मिला। कृपया मान्य POI नामों का उपयोग करें।', route_finder_error_no_start: 'आपका वर्तमान स्थान उपलब्ध नहीं है। मार्ग की योजना नहीं बनाई जा सकती।', menu_map: 'नक्शा', menu_alerts: 'चेतावनी', menu_driver: 'चालक', menu_passenger: 'यात्री', menu_settings: 'सेटिंग्स', menu_profile: 'प्रोफ़ाइल', ai_chat_title: 'एआई सहायक', ai_chat_placeholder: 'कोई स्थान खोजने या घटना की रिपोर्ट करने के लिए कहें...', ai_chat_placeholder_passenger: 'आस-पास के स्थानों के बारे में पूछें या यात्रा की योजना बनाएं...', ai_chat_placeholder_listening: 'सुन रहा है...', report_incident_prompt: 'मैं यहां एक घटना की रिपोर्ट करना चाहता हूं: ', share_location: 'लाइव स्थान साझा करें', nearby_pois: 'आस-पास के POI', voice_error_no_speech: 'मैंने सुना नहीं। कृपया माइक को फिर से टैप करें।', voice_error_mic_problem: 'आपके माइक्रोफ़ोन में कोई समस्या है।', route_preferences: 'मार्ग प्राथमिकताएं', prefer_highways: 'राजमार्गों को प्राथमिकता दें', avoid_tolls: 'टोल से बचें', prefer_scenic_route: 'दर्शनीय मार्ग को प्राथमिकता दें', route_pref_scenic: 'एक सुंदर मार्ग मिला।', route_pref_highways: 'राजमार्गों को प्राथमिकता देने वाला मार्ग मिला।', route_pref_fastest: 'सबसे तेज़ मार्ग मिला।', route_pref_avoid_tolls: 'टोल से बचते हुए।', mic_denied: "माइक्रोफ़ोन एक्सेस अस्वीकृत कर दिया गया। वॉयस कमांड का उपयोग करने के लिए कृपया अपनी ब्राउज़र सेटिंग्स में माइक्रोफ़ोन एक्सेस की अनुमति दें।", loc_denied: "स्थान एक्सेस अस्वीकृत कर दिया गया। कृपया इसे अपनी ब्राउज़र सेटिंग्स में सक्षम करें।", speech_unsupported: "आपके ब्राउज़र द्वारा वाक् पहचान समर्थित नहीं है।", loc_unavailable: "आपका स्थान प्राप्त नहीं किया जा सका। कृपया कनेक्शन और सेटिंग्स जांचें।", loc_timeout: "स्थान अनुरोध का समय समाप्त हो गया। कृपया बेहतर सिग्नल वाले क्षेत्र में पुनः प्रयास करें।", gps_searching: 'GPS स्थिति: खोज रहा है...', gps_ok: 'GPS स्थिति: सिग्नल मिल गया।', gps_error: 'GPS स्थिति: सिग्नल प्राप्त करने में त्रुटि।' },
    es: { layers: 'Capas', roads: 'Carreteras', pois: 'Puntos de Interés', incidents: 'Incidentes', display_panel_title: 'Información Cercana', route_finder: 'Buscador de Rutas', find_route_btn: 'Encontrar Ruta Óptima', clear_route_btn: 'Borrar Ruta', share_route: 'Compartir Ruta', link_copied: '¡Enlace Copiado!', route_finder_error: 'No se pudo encontrar la ubicación de inicio o fin. Utilice nombres de PDI válidos.', route_finder_error_no_start: 'Tu ubicación actual no está disponible. No se puede planificar la ruta.', menu_map: 'Mapa', menu_alerts: 'Alertas', menu_driver: 'Conductor', menu_passenger: 'Pasajero', menu_settings: 'Ajustes', menu_profile: 'Perfil', ai_chat_title: 'Asistente de IA', ai_chat_placeholder: 'Pregunta para encontrar un lugar o reportar un incidente...', ai_chat_placeholder_passenger: 'Pregunta sobre lugares cercanos o planifica un viaje...', ai_chat_placeholder_listening: 'Escuchando...', report_incident_prompt: 'Quiero reportar un incidente aquí: ', share_location: 'Compartir Ubicación en Vivo', nearby_pois: 'PDI Cercanos', voice_error_no_speech: 'No entendí eso. Por favor, intenta tocar el micrófono de nuevo.', voice_error_mic_problem: 'Parece que hay un problema con tu micrófono.', route_preferences: 'Preferencias de Ruta', prefer_highways: 'Preferir Autopistas', avoid_tolls: 'Evitar Peajes', prefer_scenic_route: 'Preferir Ruta Panorámica', route_pref_scenic: 'Se encontró una ruta panorámica.', route_pref_highways: 'Se encontró una ruta prefiriendo autopistas.', route_pref_fastest: 'Ruta más rápida encontrada.', route_pref_avoid_tolls: 'Evitando peajes.', mic_denied: "Acceso al micrófono denegado. Permita el acceso al micrófono en la configuración de su navegador para usar comandos de voz.", loc_denied: "Acceso a la ubicación denegado. Por favor, actívelo en la configuración de su navegador.", speech_unsupported: "El reconocimiento de voz no es compatible con su navegador.", loc_unavailable: "No se pudo obtener su ubicación. Verifique la conexión y la configuración.", loc_timeout: "La solicitud de ubicación expiró. Inténtelo de nuevo con mejor señal.", gps_searching: 'Estado del GPS: Buscando...', gps_ok: 'Estado del GPS: Señal adquirida.', gps_error: 'Estado del GPS: Error al adquirir señal.' },
    fr: { layers: 'Couches', roads: 'Routes', pois: 'Points d\'Intérêt', incidents: 'Incidents', display_panel_title: 'Informations à Proximité', route_finder: 'Recherche d\'Itinéraire', find_route_btn: 'Trouver l\'Itinéraire Optimal', clear_route_btn: 'Effacer l\'Itinéraire', share_route: 'Partager l\'Itinéraire', link_copied: 'Lien Copié !', route_finder_error: 'Impossible de trouver le lieu de départ ou d\'arrivée. Veuillez utiliser des noms de POI valides.', route_finder_error_no_start: 'Votre emplacement actuel n\'est pas disponible. Impossible de planifier l\'itinéraire.', menu_map: 'Carte', menu_alerts: 'Alertes', menu_driver: 'Conducteur', menu_passenger: 'Passager', menu_settings: 'Paramètres', menu_profile: 'Profil', ai_chat_title: 'Assistant IA', ai_chat_placeholder: 'Demandez pour trouver un lieu ou signaler un incident...', ai_chat_placeholder_passenger: 'Renseignez-vous sur les lieux à proximité ou planifiez un voyage...', ai_chat_placeholder_listening: 'Écoute...', report_incident_prompt: 'Je veux signaler un incident ici : ', share_location: 'Partager la Position en Direct', nearby_pois: 'POI à Proximité', voice_error_no_speech: 'Je n\'ai pas compris. Veuillez essayer de toucher à nouveau le micro.', voice_error_mic_problem: 'Il semble y avoir un problème avec votre microphone.', route_preferences: 'Préférences d\'Itinéraire', prefer_highways: 'Préférer les Autoroutes', avoid_tolls: 'Éviter les Péages', prefer_scenic_route: 'Préférer la Route Panorámica', route_pref_scenic: 'Un itinéraire panoramique a été trouvé.', route_pref_highways: 'Un itinéraire préférant les autoroutes a été trouvé.', route_pref_fastest: 'Itinéraire le plus rapide trouvé.', route_pref_avoid_tolls: 'Évitement des péages.', mic_denied: "Accès au microphone refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur pour utiliser les commandes vocales.", loc_denied: "Accès à la localisation refusé. Veuillez l'activer dans les paramètres de votre navigateur.", speech_unsupported: "La reconnaissance vocale n'est pas prise en charge par votre navigateur.", loc_unavailable: "Impossible d'obtenir votre position. Vérifiez la connexion et les paramètres.", loc_timeout: "La demande de localisation a expiré. Veuillez réessayer avec un meilleur signal.", gps_searching: 'État du GPS : Recherche...', gps_ok: 'État du GPS : Signal acquis.', gps_error: 'État du GPS : Erreur d\'acquisition du signal.' },
    de: { layers: 'Ebenen', roads: 'Straßen', pois: 'Interessante Orte', incidents: 'Vorfälle', display_panel_title: 'Infos in der Nähe', route_finder: 'Routenfinder', find_route_btn: 'Optimale Route Finden', clear_route_btn: 'Route Löschen', share_route: 'Route Teilen', link_copied: 'Link Kopiert!', route_finder_error: 'Start- oder Zielort konnte nicht gefunden werden. Bitte verwenden Sie gültige POI-Namen.', route_finder_error_no_start: 'Ihr aktueller Standort ist nicht verfügbar. Route kann nicht geplant werden.', menu_map: 'Karte', menu_alerts: 'Warnungen', menu_driver: 'Fahrer', menu_passenger: 'Beifahrer', menu_settings: 'Einstellungen', menu_profile: 'Profil', ai_chat_title: 'KI-Assistent', ai_chat_placeholder: 'Fragen Sie nach einem Ort oder melden Sie einen Vorfall...', ai_chat_placeholder_passenger: 'Fragen Sie nach Orten in der Nähe oder planen Sie eine Reise...', ai_chat_placeholder_listening: 'Hören...', report_incident_prompt: 'Ich möchte hier einen Vorfall melden: ', share_location: 'Live-Standort Teilen', nearby_pois: 'POIs in der Nähe', voice_error_no_speech: 'Ich habe das nicht verstanden. Bitte tippen Sie erneut auf das Mikrofon.', voice_error_mic_problem: 'Es scheint ein Problem mit Ihrem Mikrofon zu geben.', route_preferences: 'Routenpräferenzen', prefer_highways: 'Autobahnen Bevorzugen', avoid_tolls: 'Maut Vermeiden', prefer_scenic_route: 'Szenische Route Bevorzugen', route_pref_scenic: 'Eine malerische Route wurde gefunden.', route_pref_highways: 'Eine Route, die Autobahnen bevorzugt, wurde gefunden.', route_pref_fastest: 'Schnellste Route gefunden.', route_pref_avoid_tolls: 'Maut wird vermieden.', mic_denied: "Mikrofonzugriff verweigert. Bitte erlauben Sie den Mikrofonzugriff in Ihren Browsereinstellungen, um Sprachbefehle zu verwenden.", loc_denied: "Standortzugriff verweigert. Bitte aktivieren Sie ihn in Ihren Browsereinstellungen.", speech_unsupported: "Spracherkennung wird von Ihrem Browser nicht unterstützt.", loc_unavailable: "Ihr Standort konnte nicht abgerufen werden. Bitte überprüfen Sie Verbindung und Einstellungen.", loc_timeout: "Standortanfrage abgelaufen. Bitte versuchen Sie es mit einem besseren Signal erneut.", gps_searching: 'GPS-Status: Suche...', gps_ok: 'GPS-Status: Signal erfasst.', gps_error: 'GPS-Status: Fehler bei der Signalerfassung.' },
    zh: { layers: '图层', roads: '道路', pois: '兴趣点', incidents: '事件', display_panel_title: '附近信息', route_finder: '路线查找器', find_route_btn: '查找最佳路线', clear_route_btn: '清除路线', share_route: '分享路线', link_copied: '链接已复制！', route_finder_error: '无法找到起点或终点。请使用有效的POI名称。', route_finder_error_no_start: '您当前的位置不可用。无法规划路线。', menu_map: '地图', menu_alerts: '警报', menu_driver: '驾驶模式', menu_passenger: '乘客模式', menu_settings: '设置', menu_profile: '个人资料', ai_chat_title: 'AI助手', ai_chat_placeholder: '询问查找地点或报告事件...', ai_chat_placeholder_passenger: '询问附近地点或规划行程...', ai_chat_placeholder_listening: '正在聆听...', report_incident_prompt: '我想在这里报告一个事件：', share_location: '分享实时位置', nearby_pois: '附近的POI', voice_error_no_speech: '我没听清。请再试一次。', voice_error_mic_problem: '您的麦克风似乎有问题。', route_preferences: '路线偏好', prefer_highways: '高速公路优先', avoid_tolls: '避开收费站', prefer_scenic_route: '风景路线优先', route_pref_scenic: '已找到风景路线。', route_pref_highways: '已找到高速公路优先路线。', route_pref_fastest: '已找到最快路线。', route_pref_avoid_tolls: '避开收费站。', mic_denied: "麦克风访问被拒绝。请在浏览器设置中允许麦克风访问以使用语音命令。", loc_denied: "位置访问被拒绝。请在浏览器设置中启用它。", speech_unsupported: "您的浏览器不支持语音识别。", loc_unavailable: "无法获取您的位置。请检查连接和设置。", loc_timeout: "位置请求超时。请在信号更好的地方再试。", gps_searching: 'GPS状态：搜索中...', gps_ok: 'GPS状态：信号已获取。', gps_error: 'GPS状态：获取信号时出错。' },
    ja: { layers: 'レイヤー', roads: '道路', pois: '興味のある場所', incidents: 'インシデント', display_panel_title: '周辺情報', route_finder: 'ルート検索', find_route_btn: '最適ルートを検索', clear_route_btn: 'ルートをクリア', share_route: 'ルートを共有', link_copied: 'リンクがコピーされました！', route_finder_error: '出発地または目的地が見つかりませんでした。有効なPOI名を使用してください。', route_finder_error_no_start: '現在地が利用できません。ルートを計画できません。', menu_map: '地図', menu_alerts: 'アラート', menu_driver: '運転手', menu_passenger: '乗客', menu_settings: '設定', menu_profile: 'プロフィール', ai_chat_title: 'AIアシスタント', ai_chat_placeholder: '場所の検索やインシデントの報告を依頼...', ai_chat_placeholder_passenger: '近くの場所について尋ねるか、旅行を計画する...', ai_chat_placeholder_listening: '聞き取り中...', report_incident_prompt: 'ここでインシデントを報告したい：', share_location: 'ライブロケーションを共有', nearby_pois: '近くのPOI', voice_error_no_speech: '聞き取れませんでした。もう一度マイクをタップしてください。', voice_error_mic_problem: 'マイクに問題があるようです。', route_preferences: 'ルート設定', prefer_highways: '高速道路を優先', avoid_tolls: '有料道路を避ける', prefer_scenic_route: '景色の良いルートを優先', route_pref_scenic: '景色の良いルートが見つかりました。', route_pref_highways: '高速道路を優先するルートが見つかりました。', route_pref_fastest: '最速ルートが見つかりました。', route_pref_avoid_tolls: '有料道路を回避中。', mic_denied: "マイクへのアクセスが拒否されました。音声コマンドを使用するには、ブラウザの設定でマイクへのアクセスを許可してください。", loc_denied: "位置情報へのアクセスが拒否されました。ブラウザの設定で有効にしてください。", speech_unsupported: "お使いのブラウザは音声認識をサポートしていません。", loc_unavailable: "現在地を取得できませんでした。接続と設定を確認してください。", loc_timeout: "位置情報のリクエストがタイムアウトしました。電波の良い場所で再試行してください。", gps_searching: 'GPSステータス：検索中...', gps_ok: 'GPSステータス：信号取得済み。', gps_error: 'GPSステータス：信号取得エラー。' },
    ko: { layers: '레이어', roads: '도로', pois: '관심 지점', incidents: '사건', display_panel_title: '주변 정보', route_finder: '경로 찾기', find_route_btn: '최적 경로 찾기', clear_route_btn: '경로 지우기', share_route: '경로 공유', link_copied: '링크가 복사되었습니다!', route_finder_error: '출발지 또는 목적지를 찾을 수 없습니다. 유효한 POI 이름을 사용하십시오.', route_finder_error_no_start: '현재 위치를 사용할 수 없습니다. 경로를 계획할 수 없습니다.', menu_map: '지도', menu_alerts: '알림', menu_driver: '운전자', menu_passenger: '승객', menu_settings: '설정', menu_profile: '프로필', ai_chat_title: 'AI 비서', ai_chat_placeholder: '장소를 찾거나 사건을 보고하도록 요청...', ai_chat_placeholder_passenger: '주변 장소에 대해 질문하거나 여행 계획 세우기...', ai_chat_placeholder_listening: '듣는 중...', report_incident_prompt: '여기서 사건을 보고하고 싶습니다:', share_location: '실시간 위치 공유', nearby_pois: '주변 POI', voice_error_no_speech: '못 알아들었습니다. 마이크를 다시 탭해주세요.', voice_error_mic_problem: '마이크에 문제가 있는 것 같습니다.', route_preferences: '경로 기본 설정', prefer_highways: '고속도로 선호', avoid_tolls: '통행료 회피', prefer_scenic_route: '경치 좋은 경로 선호', route_pref_scenic: '경치 좋은 경로를 찾았습니다.', route_pref_highways: '고속도로를 선호하는 경로를 찾았습니다.', route_pref_fastest: '가장 빠른 경로를 찾았습니다.', route_pref_avoid_tolls: '통행료를 피하는 중입니다.', mic_denied: "마이크 접근이 거부되었습니다. 음성 명령을 사용하려면 브라우저 설정에서 마이크 접근을 허용하십시오.", loc_denied: "위치 정보 접근이 거부되었습니다. 브라우저 설정에서 활성화하십시오.", speech_unsupported: "브라우저에서 음성 인식을 지원하지 않습니다.", loc_unavailable: "위치를 가져올 수 없습니다. 연결 및 설정을 확인하십시오.", loc_timeout: "위치 요청 시간이 초과되었습니다. 신호가 더 좋은 곳에서 다시 시도하십시오.", gps_searching: 'GPS 상태: 검색 중...', gps_ok: 'GPS 상태: 신호 수신됨.', gps_error: 'GPS 상태: 신호 수신 오류.' },
    new: { layers: 'तहः', roads: 'लं', pois: 'रुचि युगु थाय्', incidents: 'घटना', display_panel_title: 'नापयुगु जानकारी', route_finder: 'लं मालेगु', find_route_btn: 'उत्तम लं मालेगु', clear_route_btn: 'लं चीकेगु', share_route: 'लं सेयर यायेगु', link_copied: 'लिङ्क कपि जुल!', menu_settings: 'सेटिङ', menu_driver: 'ड्राइभर', menu_passenger: 'प्यासेन्जर', route_preferences: 'लं प्राथमिकता', prefer_highways: 'राजमार्ग प्राथमिकता', avoid_tolls: 'टोल छले यायेगु', prefer_scenic_route: 'रमणीय लं प्राथमिकता' },
    mai: { layers: 'परत', roads: 'सड़क', pois: 'रुचिक स्थान', incidents: 'घटना', display_panel_title: 'नजिकक जानकारी', route_finder: 'मार्ग खोजू', find_route_btn: 'उत्तम मार्ग खोजू', clear_route_btn: 'मार्ग हटाउ', share_route: 'मार्ग साझा करू', link_copied: 'लिंक प्रतिलिपि भेल!', menu_settings: 'सेटिङ', menu_driver: 'चालक', menu_passenger: 'यात्री', route_preferences: 'मार्ग प्राथमिकता', prefer_highways: 'राजमार्ग प्राथमिकता', avoid_tolls: 'टोल स बचू', prefer_scenic_route: 'रमणीय मार्ग प्राथमिकता' }
};

/**
 * Applies language translations to the UI.
 * @param {string} lang The language code (e.g., 'en', 'np').
 */
function setLanguage(lang: string) {
    currentLang = lang;
    document.documentElement.lang = lang;
    const langStrings = translations[lang] || translations.en;
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key')!;
        if (langStrings[key]) {
            el.textContent = langStrings[key];
        }
    });
     document.querySelectorAll<HTMLElement>('[data-lang-key-placeholder]').forEach(el => {
        const key = el.getAttribute('data-lang-key-placeholder')!;
        if (langStrings[key]) {
            el.setAttribute('placeholder', langStrings[key]);
        }
    });
}

/**
 * Displays a temporary notification message.
 * @param {string} message The message to display.
 * @param {number} duration Duration in milliseconds.
 */
function showToast(message: string, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Fade in
    setTimeout(() => toast.classList.add('show'), 10);
    // Fade out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

/**
 * Updates the GPS status indicator in the header.
 * @param {'searching' | 'ok' | 'error'} status The current status of the GPS.
 * @param {string} messageKey The translation key for the tooltip message.
 */
function updateGpsIndicator(status: 'searching' | 'ok' | 'error', messageKey: string) {
    const indicator = document.getElementById('gps-status-indicator')!;
    indicator.className = `gps-${status}`;
    const message = translations[currentLang][messageKey] || translations.en[messageKey];
    indicator.title = message;
}

/**
 * Starts watching for geolocation updates.
 */
function startGeolocationWatch() {
    if (geolocationWatchId !== null) {
        return; // Already watching
    }
    console.log("Starting geolocation watch...");
    updateGpsIndicator('searching', 'gps_searching');
    geolocationWatchId = navigator.geolocation.watchPosition(
        handleGeolocationSuccess,
        handleGeolocationError,
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );
}

/**
 * Stops watching for geolocation updates.
 */
function stopGeolocationWatch() {
    if (geolocationWatchId !== null) {
        console.log("Stopping geolocation watch.");
        navigator.geolocation.clearWatch(geolocationWatchId);
        geolocationWatchId = null;
    }
}

/**
 * Handles successful retrieval of geolocation.
 * @param {GeolocationPosition} position The geolocation position object.
 */
function handleGeolocationSuccess(position: GeolocationPosition) {
    updateGpsIndicator('ok', 'gps_ok');
    currentUserPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading,
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0 // m/s to km/h
    };
    updateUserLocationMarker();
    updateDriverCockpit();
}

/**
 * Handles errors during geolocation retrieval.
 * @param {GeolocationPositionError} error The geolocation error object.
 */
function handleGeolocationError(error: GeolocationPositionError) {
    console.error("Geolocation error:", error);
    stopGeolocationWatch(); // Stop trying if there's a persistent error
    updateGpsIndicator('error', 'gps_error');
    
    let messageKey = 'loc_unavailable';
    if (error.code === error.PERMISSION_DENIED) {
        messageKey = 'loc_denied';
    } else if (error.code === error.TIMEOUT) {
        messageKey = 'loc_timeout';
    }
    const message = translations[currentLang][messageKey] || translations.en[messageKey];
    showToast(message, 5000);
}

/**
 * Initializes the Leaflet map.
 */
function initMap() {
    map = L.map('map', {
        center: [27.7, 85.3],
        zoom: 13,
        zoomControl: false // Disable default zoom control
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    // Add zoom control to the top right
    L.control.zoom({ position: 'topright' }).addTo(map);
}

/**
 * Unhighlights any previously selected item.
 */
function unhighlightAll() {
    if (selectedItemId !== null) {
        const prevCard = itemCards.get(selectedItemId);
        const prevMarker = itemMarkers.get(selectedItemId);
        if (prevCard) prevCard.classList.remove('info-card--highlighted');
        if (prevMarker) prevMarker.getElement()?.classList.remove('map-icon--highlighted');
        selectedItemId = null;
    }
}

/**
 * Highlights a specific item on the map and in the list.
 * @param {number} itemId The ID of the item to highlight.
 */
function highlightItem(itemId: number) {
    unhighlightAll(); // Clear previous selection

    selectedItemId = itemId;
    const card = itemCards.get(itemId);
    const marker = itemMarkers.get(itemId);

    if (card) {
        card.classList.add('info-card--highlighted');
        // Briefly flash the card for instant feedback
        card.classList.add('info-card--clicked');
        setTimeout(() => card.classList.remove('info-card--clicked'), 300);
    }
    if (marker) {
        marker.getElement()?.classList.add('map-icon--highlighted');
        marker.openPopup();
    }
}

/**
 * Creates an information card element for the display panel.
 * @param {any} item The POI or incident data.
 * @returns {HTMLElement} The created card element.
 */
function createInfoCard(item: any): HTMLElement {
    const card = document.createElement('div');
    card.className = 'info-card';
    card.dataset.id = item.id;

    const statusType = item.type === 'traffic' || item.type === 'closure' ? 'incident' : 'good';
    card.innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.status}</p>
        <span class="card-status ${statusType}">${item.category || item.type}</span>
    `;
    
    card.addEventListener('click', () => {
        highlightItem(item.id);
        const marker = itemMarkers.get(item.id);
        if (marker) {
            map.flyTo(marker.getLatLng(), 15);
        }
    });

    itemCards.set(item.id, card);
    return card;
}

/**
 * Creates a map marker for a POI or incident.
 * @param {any} item The POI or incident data.
 * @returns {L.Marker} The created marker.
 */
function createMapIcon(item: any): L.Marker {
    let iconUrl = '';
    switch (item.type) {
        case 'poi': iconUrl = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'; break;
        case 'bridge': iconUrl = 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'; break;
        case 'traffic': iconUrl = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'; break;
        case 'closure':
        case 'other':
            iconUrl = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'; break;
        default: iconUrl = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'; break;
    }
    const icon = L.icon({
        iconUrl: iconUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });

    const marker = L.marker([item.lat, item.lng], { icon: icon });
    marker.bindPopup(`<b>${item.name}</b><br>${item.status}`);
    
    marker.on('click', () => {
        highlightItem(item.id);
        const card = itemCards.get(item.id);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    marker.on('add', () => {
        marker.getElement()?.classList.add('map-icon');
    });

    itemMarkers.set(item.id, marker);
    return marker;
}


/**
 * Fetches all initial data from the simulated API.
 */
async function fetchAllData() {
    [roadsData, poisData, incidentsData, trafficData] = await Promise.all([
        api.getRoads(),
        api.getPOIs(),
        api.getLiveIncidents(),
        api.getLiveTraffic()
    ]);
}

/**
 * Renders the road data on the map.
 */
function renderRoads() {
    if (roadLayer) map.removeLayer(roadLayer);
    roadLayer = L.geoJSON(roadsData, {
        style: (feature) => {
            const trafficInfo = trafficData.find(t => t.roadName === feature.properties.name);
            let color = '#3388ff'; // Default blue
            if (trafficInfo) {
                switch (trafficInfo.traffic) {
                    case 'moderate': color = '#f39c12'; break; // Orange
                    case 'heavy': color = '#e74c3c'; break;    // Red
                }
            }
            return { color: color, weight: 5, opacity: 0.7 };
        }
    }).addTo(map);
}

/**
 * Renders POIs and incidents on their respective layers.
 */
function renderPoisAndIncidents() {
    poiLayer.clearLayers();
    incidentLayer.clearLayers();
    itemMarkers.clear();
    itemCards.clear();

    poisData.forEach(poi => {
        const marker = createMapIcon(poi);
        poiLayer.addLayer(marker);
    });
    incidentsData.forEach(incident => {
        const marker = createMapIcon(incident);
        incidentLayer.addLayer(marker);
    });
    populateDisplayPanel();
}


/**
 * Populates the display panel with nearby information, grouped by category.
 */
function populateDisplayPanel() {
    const list = document.getElementById('display-panel-list')!;
    const filtersContainer = document.getElementById('display-panel-filters')!;
    list.innerHTML = '';
    filtersContainer.innerHTML = '';

    const allItems = [...poisData, ...incidentsData];
    const categories = [...new Set(allItems.map(item => item.category || 'incidents'))];

    // Create filter buttons
    const createFilterBtn = (category: string) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        btn.dataset.filter = category;
        btn.onclick = () => {
            activeDisplayFilter = category;
            populateDisplayPanel(); // Re-render
        };
        if (category === activeDisplayFilter) {
            btn.classList.add('active');
        }
        return btn;
    };
    
    filtersContainer.appendChild(createFilterBtn('all'));
    categories.forEach(cat => filtersContainer.appendChild(createFilterBtn(cat)));

    // Group and render items
    const itemsToDisplay = (activeDisplayFilter === 'all')
        ? allItems
        : allItems.filter(item => (item.category || 'incidents') === activeDisplayFilter);

    if (activeDisplayFilter === 'all') {
        const grouped = itemsToDisplay.reduce((acc, item) => {
            const key = item.category || 'incidents';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {} as { [key: string]: any[] });

        for (const category in grouped) {
            const header = document.createElement('h3');
            header.className = 'category-header';
            header.textContent = category;
            list.appendChild(header);
            grouped[category].forEach(item => list.appendChild(createInfoCard(item)));
        }
    } else {
        itemsToDisplay.forEach(item => list.appendChild(createInfoCard(item)));
    }
}

/**
 * Updates the user's location marker on the map.
 */
function updateUserLocationMarker() {
    if (!currentUserPosition) return;
    const { lat, lng, heading } = currentUserPosition;

    if (!userLocationMarker) {
        const icon = L.divIcon({
            className: 'user-location-icon',
            html: `<div class="pulse"></div><div class="dot"></div><div class="heading"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });
        userLocationMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
    } else {
        userLocationMarker.setLatLng([lat, lng]);
    }
    const headingEl = userLocationMarker.getElement()?.querySelector('.heading') as HTMLElement;
    if (headingEl && heading !== null) {
        headingEl.style.transform = `translate(-50%, -100%) rotate(${heading}deg)`;
    }
}


/**
 * Updates the driver cockpit UI elements.
 */
function updateDriverCockpit() {
    if (document.body.dataset.mode !== 'driver' || !currentUserPosition) return;

    const speedEl = document.querySelector('#speed-widget .value')!;
    const compassEl = document.querySelector('#compass-widget .compass-rose')!;
    
    speedEl.textContent = currentUserPosition.speed !== null ? Math.round(currentUserPosition.speed).toString() : '0';

    if (currentUserPosition.heading !== null) {
        // FIX: The `Element` type from querySelector doesn't have a `style` property. Cast to `HTMLElement`.
        (compassEl as HTMLElement).style.transform = `rotate(${-currentUserPosition.heading}deg)`;
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(currentUserPosition.heading / 45) % 8;
        compassEl.textContent = directions[index];
    } else {
        compassEl.textContent = 'N';
    }
    
    // Mock temperature
    document.querySelector('#temp-widget .value')!.textContent = '24°';
}


/**
 * Adds the main map layers.
 */
function addMapLayers() {
    poiLayer = L.featureGroup().addTo(map);
    incidentLayer = L.featureGroup().addTo(map);
    routeLayer = L.featureGroup().addTo(map);
}

/**
 * Toggles a map layer's visibility.
 * @param {L.FeatureGroup | L.GeoJSON} layer The layer to toggle.
 * @param {boolean} show Whether to show or hide the layer.
 */
function toggleLayer(layer: L.FeatureGroup | L.GeoJSON, show: boolean) {
    if (show) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
    }
}

/**
 * Finds a point of interest by name.
 * @param {string} name The name of the POI.
 * @returns {any | null} The POI object or null if not found.
 */
function findPOIByName(name: string): any | null {
    if (name.toLowerCase().trim() === 'my location') return { name: 'My Location', ...currentUserPosition };
    const searchTerm = name.toLowerCase().trim();
    return poisData.find(p => p.name.toLowerCase().trim() === searchTerm) || null;
}

/**
 * Finds and displays the optimal route between two points.
 */
function findOptimalRoute() {
    const fromInput = document.getElementById('from-input') as HTMLInputElement;
    const toInput = document.getElementById('to-input') as HTMLInputElement;
    const fromPOI = findPOIByName(fromInput.value);
    const toPOI = findPOIByName(toInput.value);
    const routeDetails = document.getElementById('route-details')!;
    
    routeDetails.innerHTML = '';
    
    if (fromPOI && toPOI) {
        const start = [fromPOI.lat, fromPOI.lng];
        const end = [toPOI.lat, toPOI.lng];
        
        let waypoints: [number, number][] = [start, end];
        let messageKey = 'route_pref_fastest';
        
        // Mock route generation based on preferences
        if (routePreferences.preferHighways) {
            // Find a point on the highway to snap to
            const highway = roadsData.features.find((f: any) => f.properties.name === "Prithvi Highway");
            if (highway) {
                // FIX: Explicitly cast the coordinate to `[number, number]` to match the `waypoints` type.
                const midPointOnHighway = highway.geometry.coordinates[Math.floor(highway.geometry.coordinates.length / 2)].slice().reverse() as [number, number];
                waypoints = [start, midPointOnHighway, end];
            }
            messageKey = 'route_pref_highways';
        } else if (routePreferences.preferScenic) {
            const scenicRoad = roadsData.features.find((f: any) => f.properties.name === "Local Road");
            if (scenicRoad) {
                 // FIX: Explicitly cast the coordinate to `[number, number]` to match the `waypoints` type.
                 const midPointOnScenic = scenicRoad.geometry.coordinates[Math.floor(scenicRoad.geometry.coordinates.length / 2)].slice().reverse() as [number, number];
                 waypoints = [start, midPointOnScenic, end];
            }
             messageKey = 'route_pref_scenic';
        }

        currentRouteCoords = waypoints;
        currentRouteInfo = { from: fromPOI.name, to: toPOI.name };

        clearRoute();
        const routeLine = L.polyline(waypoints, { color: 'var(--primary-color)', weight: 6, opacity: 0.8 }).addTo(routeLayer);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        let prefMessage = translations[currentLang][messageKey] || translations.en[messageKey];
        if (routePreferences.avoidTolls) {
            prefMessage += ` (${translations[currentLang].route_pref_avoid_tolls || translations.en.route_pref_avoid_tolls})`;
        }

        routeDetails.innerHTML = `
            <div class="route-warning">
                 <span class="material-icons">info</span>
                <span>${prefMessage}</span>
            </div>
            <p><strong>From:</strong> ${fromPOI.name}</p>
            <p><strong>To:</strong> ${toPOI.name}</p>
            <p><strong>Estimated Distance:</strong> ${(L.latLng(start).distanceTo(end) / 1000).toFixed(2)} km</p>
        `;
        document.getElementById('share-route-btn')!.classList.remove('hidden');

    } else {
        routeDetails.innerHTML = `<p style="color:var(--danger-color);">${translations[currentLang].route_finder_error}</p>`;
    }
}

/**
 * Clears the current route from the map.
 */
function clearRoute() {
    routeLayer.clearLayers();
    currentRouteCoords = null;
    currentRouteInfo = null;
    document.getElementById('route-details')!.innerHTML = '';
    document.getElementById('share-route-btn')!.classList.add('hidden');
}


/**
 * Shares the current route via Web Share API or copies to clipboard.
 */
async function shareRoute() {
    if (!currentRouteCoords || !currentRouteInfo) return;

    // Analyze route for incidents and traffic
    const routeBounds = L.latLngBounds(currentRouteCoords);
    const incidentsOnRoute = incidentsData.filter(inc => routeBounds.contains([inc.lat, inc.lng]));
    
    // Create a simplified traffic summary for the share text
    const overallTraffic = trafficData.length > 0 ? (trafficData.some(t => t.traffic === 'heavy') ? 'heavy' : (trafficData.some(t => t.traffic === 'moderate') ? 'moderate' : 'clear')) : 'unknown';

    const params = new URLSearchParams();
    params.set('route', JSON.stringify(currentRouteCoords));
    if(incidentsOnRoute.length > 0) {
        params.set('incidents', incidentsOnRoute.map(i => i.id).join(','));
    }
    params.set('traffic', overallTraffic);
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const shareText = `Check out my route from ${currentRouteInfo.from} to ${currentRouteInfo.to} on Sadak Sathi! Traffic is currently ${overallTraffic}. ${incidentsOnRoute.length} incident(s) reported.`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Sadak Sathi Route',
                text: shareText,
                url: url
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showToast(translations[currentLang].link_copied || 'Link Copied!');
        });
    }
}


/**
 * Sets the application mode (driver or passenger).
 * @param {'driver' | 'passenger'} mode The mode to set.
 */
function setMode(mode: 'driver' | 'passenger') {
    const container = document.getElementById('app-container')!;
    container.dataset.mode = mode;

    document.getElementById('driver-mode-btn')!.classList.toggle('active', mode === 'driver');
    document.getElementById('passenger-mode-btn')!.classList.toggle('active', mode === 'passenger');
}

/**
 * Adds a message to the AI chat window.
 * @param {string} text The message text.
 * @param {'ai' | 'user'} sender The sender of the message.
 * @param {any[]} [suggestions] Optional array of POI suggestions.
 */
function addMessageToChat(text: string, sender: 'ai' | 'user', suggestions?: any[]) {
    const chatMessages = document.getElementById('chat-messages')!;
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    
    const p = document.createElement('p');
    p.textContent = text;
    messageEl.appendChild(p);

    if (suggestions && suggestions.length > 0) {
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'poi-suggestions';
        suggestions.forEach(poi => {
            const btn = document.createElement('button');
            btn.className = 'poi-suggestion-btn';
            btn.textContent = `Navigate to ${poi.name} (${(L.latLng(currentUserPosition!).distanceTo([poi.lat, poi.lng]) / 1000).toFixed(1)} km)`;
            btn.onclick = () => {
                const fromInput = document.getElementById('from-input') as HTMLInputElement;
                const toInput = document.getElementById('to-input') as HTMLInputElement;
                fromInput.value = 'My Location';
                toInput.value = poi.name;
                findOptimalRoute();
                aiChatModal.classList.add('hidden');
            };
            suggestionsContainer.appendChild(btn);
        });
        messageEl.appendChild(suggestionsContainer);
    }
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Handles the AI chat message submission.
 */
async function handleChatMessage() {
    const input = document.getElementById('chat-input') as HTMLInputElement;
    const message = input.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user');
    input.value = '';
    
    document.getElementById('typing-indicator')!.classList.remove('hidden');

    try {
        const isDriver = document.body.dataset.mode === 'driver';
        const persona = isDriver
            ? `You are a concise, voice-first AI co-pilot for a navigation app in Nepal called Sadak Sathi. Respond briefly. Your primary goal is to help the user with navigation and reporting incidents hands-free. Prioritize using the available tools.`
            : `You are a friendly and helpful AI tour guide for a passenger using the Sadak Sathi navigation app in Nepal. Provide interesting information about nearby places and help plan trips.`;
            
        const context = {
            current_time: new Date().toLocaleTimeString(),
            current_location: currentUserPosition,
            visible_pois: poisData.filter(p => map.getBounds().contains([p.lat, p.lng])),
            visible_incidents: incidentsData.filter(i => map.getBounds().contains([i.lat, i.lng])),
            current_mode: isDriver ? 'driver' : 'passenger',
            active_route: currentRouteInfo,
            traffic_conditions: trafficData,
            route_preferences: routePreferences
        };

        const tools: Tool[] = [{
            functionDeclarations: [
                {
                    name: 'add_incident',
                    description: 'Report an incident like a traffic jam, accident, or road closure at the user\'s current location. Use this for commands like "report an accident here" or "there is heavy traffic".',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, description: 'The type of incident (e.g., "traffic", "accident", "closure", "roadwork").' },
                            description: { type: Type.STRING, description: 'A brief description of the incident.' }
                        },
                        required: ['type', 'description']
                    }
                },
                {
                    name: 'start_navigation',
                    description: 'Start navigation from the user\'s current location to a specified destination. Use for commands like "navigate to Patan Hospital" or "get directions to Civil Mall".',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            destination_name: { type: Type.STRING, description: 'The name of the destination point of interest.' }
                        },
                        required: ['destination_name']
                    }
                },
                {
                    name: 'find_nearby_pois',
                    description: 'Find points of interest near the user\'s current location based on a category.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, description: 'The category to search for (e.g., "atm", "coffee shop", "restaurant", "hospital", "shopping", "landmark").' }
                        },
                        required: ['category']
                    }
                }
            ]
        }];

        chatHistory.push({ role: 'user', parts: [{ text: message }] });
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [{ text: `Context: ${JSON.stringify(context)}\n\nUser query: ${message}` }]
            },
            config: {
                systemInstruction: persona,
                tools: tools
            }
        });

        const functionCalls = response.candidates?.[0]?.content?.parts
            .filter(part => part.functionCall)
            .map(part => part.functionCall);

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const args = call.args as any;

            if (call.name === 'add_incident') {
                const { type, description } = args;
                if (currentUserPosition) {
                    const newIncident = {
                        id: Date.now(),
                        name: description,
                        lat: currentUserPosition.lat,
                        lng: currentUserPosition.lng,
                        type: type,
                        status: 'Reported',
                        category: 'incidents'
                    };
                    incidentsData.push(newIncident);
                    renderPoisAndIncidents();
                    addMessageToChat(`OK, I've reported "${description}" at your location.`, 'ai');
                    showToast(`Incident Reported: ${description}`);
                }
            } else if (call.name === 'start_navigation') {
                const { destination_name } = args;
                const fromInput = document.getElementById('from-input') as HTMLInputElement;
                const toInput = document.getElementById('to-input') as HTMLInputElement;
                fromInput.value = 'My Location';
                toInput.value = destination_name;
                findOptimalRoute();
                addMessageToChat(`Navigating to ${destination_name}.`, 'ai');
                aiChatModal.classList.add('hidden');
            } else if (call.name === 'find_nearby_pois') {
                const { category } = args;
                const nearby = poisData
                    .filter(p => p.category === category)
                    .sort((a, b) => L.latLng(currentUserPosition!).distanceTo([a.lat, a.lng]) - L.latLng(currentUserPosition!).distanceTo([b.lat, b.lng]))
                    .slice(0, 3);
                
                if (nearby.length > 0) {
                    addMessageToChat(`Here are some nearby ${category}s:`, 'ai', nearby);
                } else {
                    addMessageToChat(`Sorry, I couldn't find any ${category}s nearby.`, 'ai');
                }
            }
        } else {
            const text = response.text;
            addMessageToChat(text, 'ai');
        }
        
    } catch (error) {
        console.error("AI Chat Error:", error);
        addMessageToChat("Sorry, I'm having trouble connecting right now.", 'ai');
    } finally {
        document.getElementById('typing-indicator')!.classList.add('hidden');
    }
}

/**
 * Toggles the voice recognition listening state.
 */
function toggleVoiceListening() {
    if (!SpeechRecognition) {
        alert(translations[currentLang].speech_unsupported);
        return;
    }
    const assistantBtn = document.getElementById('ai-assistant')!;
    if (recognition && recognition.isListening) {
        recognition.stop();
        recognition.isListening = false;
        assistantBtn.classList.remove('listening');
        (document.getElementById('chat-input') as HTMLInputElement).placeholder = translations[currentLang].ai_chat_placeholder;
    } else {
        recognition = new SpeechRecognition();
        recognition.lang = currentLang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.isListening = true;

        recognition.start();

        recognition.onstart = () => {
            assistantBtn.classList.add('listening');
            aiChatModal.classList.remove('hidden');
            const placeholder = document.getElementById('chat-input') as HTMLInputElement;
            placeholder.value = '';
            placeholder.placeholder = translations[currentLang].ai_chat_placeholder_listening;
        };
        
        recognition.onresult = (event: any) => {
            const speechResult = event.results[0][0].transcript;
            (document.getElementById('chat-input') as HTMLInputElement).value = speechResult;
            handleChatMessage();
        };

        recognition.onspeechend = () => {
            recognition.stop();
            recognition.isListening = false;
        };

        recognition.onerror = (event: any) => {
             let errorMsg = translations[currentLang].voice_error_mic_problem;
            if (event.error === 'no-speech') {
                errorMsg = translations[currentLang].voice_error_no_speech;
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMsg = translations[currentLang].mic_denied;
            }
            addMessageToChat(errorMsg, 'ai');
        };

        recognition.onend = () => {
             assistantBtn.classList.remove('listening');
             (document.getElementById('chat-input') as HTMLInputElement).placeholder = translations[currentLang].ai_chat_placeholder;
             recognition.isListening = false;
        };
    }
}

/**
 * Makes a UI element draggable by its header.
 * @param {HTMLElement} panel The panel element to make draggable.
 * @param {HTMLElement} header The header element that acts as the drag handle.
 */
function makeDraggable(panel: HTMLElement, header: HTMLElement) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    header.onmousedown = dragMouseDown;

    function dragMouseDown(e: MouseEvent) {
        // FIX: The fallback `window.event` is of type `Event`, which is not assignable to `MouseEvent`. Cast it to fix type errors.
        e = e || window.event as MouseEvent;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent) {
        // FIX: The fallback `window.event` is of type `Event`, which is not assignable to `MouseEvent`. Cast it to fix type errors.
        e = e || window.event as MouseEvent;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        panel.style.top = (panel.offsetTop - pos2) + "px";
        panel.style.left = (panel.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}


// =================================================================================
// UI Initialization Functions
// =================================================================================

function setupCoreControls() {
    // Language and Theme
    document.getElementById('language-select')!.addEventListener('change', (e) => {
        setLanguage((e.target as HTMLSelectElement).value);
    });
    document.getElementById('theme-toggle')!.addEventListener('click', () => {
        const container = document.getElementById('app-container')!;
        const newTheme = container.dataset.theme === 'light' ? 'dark' : 'light';
        container.dataset.theme = newTheme;
        currentTheme = defaultThemes[newTheme];
        applyTheme(currentTheme);
        document.querySelector('#theme-toggle .material-icons')!.textContent = newTheme === 'light' ? 'light_mode' : 'dark_mode';
    });

    // Center button
    document.getElementById('center-location-btn')!.addEventListener('click', () => {
        if (currentUserPosition) {
            map.flyTo([currentUserPosition.lat, currentUserPosition.lng], 15);
        }
    });

    // Settings Panel
    const settingsPanel = document.getElementById('settings-panel')!;
    document.getElementById('hamburger-menu')!.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
        // Ensure display panel closes to avoid overlap
        document.getElementById('display-panel')!.classList.add('collapsed');
    });

     // Resilient Geolocation with Page Visibility
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            startGeolocationWatch();
        } else {
            stopGeolocationWatch();
        }
    });
}

function setupLayersPanel() {
    document.getElementById('toggle-roads')!.addEventListener('change', (e) => toggleLayer(roadLayer, (e.target as HTMLInputElement).checked));
    document.getElementById('toggle-pois')!.addEventListener('change', (e) => toggleLayer(poiLayer, (e.target as HTMLInputElement).checked));
    document.getElementById('toggle-incidents')!.addEventListener('change', (e) => toggleLayer(incidentLayer, (e.target as HTMLInputElement).checked));
}

function setupDisplayPanel() {
    const displayPanel = document.getElementById('display-panel')!;
    document.getElementById('display-panel-header')!.addEventListener('click', () => {
        displayPanel.classList.toggle('collapsed');
    });
}

function setupRouteFinder() {
     const routeFinderPanel = document.getElementById('route-finder-panel')!;
    document.getElementById('route-finder-trigger')!.addEventListener('click', () => {
        routeFinderPanel.classList.remove('hidden');
    });
    document.getElementById('route-finder-close')!.addEventListener('click', () => {
        routeFinderPanel.classList.add('hidden');
    });
    document.getElementById('find-route-btn')!.addEventListener('click', findOptimalRoute);
    document.getElementById('clear-route-btn')!.addEventListener('click', clearRoute);
    document.getElementById('share-route-btn')!.addEventListener('click', shareRoute);
    
    // Preferences
    document.getElementById('pref-highways')!.addEventListener('change', (e) => routePreferences.preferHighways = (e.target as HTMLInputElement).checked);
    document.getElementById('pref-no-tolls')!.addEventListener('change', (e) => routePreferences.avoidTolls = (e.target as HTMLInputElement).checked);
    document.getElementById('pref-scenic')!.addEventListener('change', (e) => routePreferences.preferScenic = (e.target as HTMLInputElement).checked);
}

function setupAIChat() {
    aiChatModal = document.getElementById('ai-chat-modal')!;
    const chatPanel = document.querySelector('.chat-panel') as HTMLElement;
    const chatHeader = document.getElementById('ai-chat-header') as HTMLElement;

    document.getElementById('ai-assistant')!.addEventListener('click', () => {
        const isDriver = document.getElementById('app-container')!.dataset.mode === 'driver';
        if (isDriver) {
            toggleVoiceListening();
        } else {
            aiChatModal.classList.remove('hidden');
        }
    });
    document.getElementById('ai-chat-close')!.addEventListener('click', () => aiChatModal.classList.add('hidden'));
    document.getElementById('chat-form')!.addEventListener('submit', (e) => {
        e.preventDefault();
        handleChatMessage();
    });
    makeDraggable(chatPanel, chatHeader);
}

function setupModeSwitcher() {
    document.getElementById('driver-mode-btn')!.addEventListener('click', () => setMode('driver'));
    document.getElementById('passenger-mode-btn')!.addEventListener('click', () => setMode('passenger'));
    document.getElementById('report-incident-btn')!.addEventListener('click', () => {
        aiChatModal.classList.remove('hidden');
        (document.getElementById('chat-input') as HTMLInputElement).value = translations[currentLang].report_incident_prompt;
    });
}

function applyTheme(theme: { [key: string]: string }) {
    for (const key in theme) {
        document.documentElement.style.setProperty(key, theme[key]);
    }
}

function setupAdminControls() {
    // Super-secret admin toggle
    let pressCount = 0;
    document.getElementById('profile-btn')!.addEventListener('click', () => {
        pressCount++;
        if (pressCount >= 5) {
            document.getElementById('admin-theme-controls')!.classList.toggle('hidden');
            pressCount = 0;
        }
        setTimeout(() => pressCount = Math.max(0, pressCount - 1), 3000);
    });

    const adminControls = document.getElementById('admin-theme-controls')!;
    adminControls.querySelectorAll('input[type="color"]').forEach(input => {
        const cssVar = (input as HTMLElement).dataset.cssVar!;
        // Initialize color picker value
        (input as HTMLInputElement).value = currentTheme[cssVar].replace('#', '');

        input.addEventListener('input', () => {
            currentTheme[cssVar] = (input as HTMLInputElement).value;
            applyTheme(currentTheme);
        });
    });

    document.getElementById('save-theme-btn')!.addEventListener('click', () => {
        // Simulate saving to backend
        console.log("Saving theme:", currentTheme);
        showToast("Theme saved (simulated)!");
    });

    document.getElementById('reset-theme-btn')!.addEventListener('click', () => {
        const currentMode = document.getElementById('app-container')!.dataset.theme as 'light' | 'dark';
        currentTheme = { ...defaultThemes[currentMode] };
        applyTheme(currentTheme);
        // Reset color picker values
        adminControls.querySelectorAll('input[type="color"]').forEach(input => {
             const cssVar = (input as HTMLElement).dataset.cssVar!;
             (input as HTMLInputElement).value = currentTheme[cssVar];
        });
        showToast("Theme reset to default.");
    });
}

/**
 * Main function to initialize the entire application.
 */
async function initUI() {
    // Apply default theme immediately
    applyTheme(currentTheme);

    // Setup UI components
    setupCoreControls();
    initMap();
    addMapLayers();
    setupLayersPanel();
    setupDisplayPanel();
    setupRouteFinder();
    setupAIChat();
    setupModeSwitcher();
    setupAdminControls();
    
    // Set initial language
    setLanguage(currentLang);
    
    // Fetch data and render
    await fetchAllData();
    renderRoads();
    renderPoisAndIncidents();
    
    // Start location services
    startGeolocationWatch();
    
    // Handle shared route from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('route')) {
        const routeCoords = JSON.parse(urlParams.get('route')!);
        const routeLine = L.polyline(routeCoords, { color: 'var(--primary-color)', weight: 6, opacity: 0.8 }).addTo(routeLayer);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
        
        const traffic = urlParams.get('traffic');
        const incidentIds = urlParams.get('incidents')?.split(',') || [];
        let detailsHtml = `<p>Showing a shared route.</p>`;
        if(traffic) detailsHtml += `<p>Shared traffic condition: <strong>${traffic}</strong></p>`;
        if(incidentIds.length > 0) {
            detailsHtml += `<p><strong>${incidentIds.length} incident(s)</strong> on this route.</p>`;
            incidentIds.forEach(id => highlightItem(parseInt(id, 10)));
        }
        document.getElementById('route-details')!.innerHTML = detailsHtml;
        document.getElementById('route-finder-panel')!.classList.remove('hidden');
    }
}

// Start the application once the DOM is ready
document.addEventListener('DOMContentLoaded', initUI);