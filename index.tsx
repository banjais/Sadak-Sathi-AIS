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
            { id: 7, name: "Civil Mall", lat: 27.699, lng: 85.314, type: 'poi', status: 'Open', category: 'shopping' }
        ]);
    },
    getIncidents: async (): Promise<any[]> => {
        console.log("API: Fetching Incidents...");
        await new Promise(resolve => setTimeout(resolve, 100));
        return Promise.resolve([
             { id: 3, name: "Traffic Jam at Baneshwor", lat: 27.693, lng: 85.341, type: 'incident', status: 'incident', category: 'traffic' },
             { id: 4, name: "Road construction", lat: 27.685, lng: 85.320, type: 'incident', status: 'incident', category: 'construction' }
        ]);
    }
};

// =================================================================================
// App State & Configuration
// =================================================================================
let map: L.Map;
let roadsLayer: L.GeoJSON;
let poisLayer: L.FeatureGroup;
let incidentsLayer: L.FeatureGroup;
let userMarker: L.Marker;
let routeLine: L.Polyline | null = null;
let currentLang = 'en';
let allPois: any[] = [];
let allIncidents: any[] = [];
let isVoiceResponseEnabled = true; // State for AI voice response feature
let activeChat: any = null; // To hold the AI chat session
let availableVoices: SpeechSynthesisVoice[] = []; // To store available speech voices

// =================================================================================
// Internationalization (i18n)
// =================================================================================
const translations = {
    en: {
        route_preferences: "Route Preferences", prefer_highways: "Prefer Highways", avoid_tolls: "Avoid Tolls",
        prefer_scenic_route: "Prefer Scenic Route", layers: "Layers", roads: "Roads", pois: "Points of Interest",
        incidents: "Incidents", display_panel_title: "Nearby Information", route_finder: "Route Finder",
        find_route_btn: "Find Optimal Route", clear_route_btn: "Clear Route", share_route: "Share Route",
        ai_chat_title: "AI Assistant", ai_chat_placeholder: "Type a message...", menu_settings: "Settings",
        menu_dashboard: "Dashboard", menu_driver: "Driver", ai_voice_response: "AI Voice Response"
    },
    np: {
        route_preferences: "मार्ग प्राथमिकताहरू", prefer_highways: "राजमार्गहरू प्राथमिकता दिनुहोस्",
        avoid_tolls: "टोलहरू बेवास्ता गर्नुहोस्", prefer_scenic_route: "रमणीय मार्ग प्राथमिकता दिनुहोस्",
        layers: "तहहरू", roads: "सडकहरू", pois: "चासोका ठाउँहरू", incidents: "घटनाहरू",
        display_panel_title: "नजिकैको जानकारी", route_finder: "मार्ग खोजकर्ता", find_route_btn: "उत्तम मार्ग खोज्नुहोस्",
        clear_route_btn: "मार्ग हटाउनुहोस्", share_route: "मार्ग साझा गर्नुहोस्", ai_chat_title: "एआई सहायक",
        ai_chat_placeholder: "सन्देश टाइप गर्नुहोस्...", menu_settings: "सेटिङहरू", menu_dashboard: "ड्यासबोर्ड",
        menu_driver: "चालक", ai_voice_response: "एआई आवाज प्रतिक्रिया"
    },
    hi: {
        route_preferences: "मार्ग प्राथमिकताएं", prefer_highways: "राजमार्गों को प्राथमिकता दें", avoid_tolls: "टोल से बचें",
        prefer_scenic_route: "दर्शनीय मार्ग को प्राथमिकता दें", layers: "परतें", roads: "सड़कें", pois: "रुचि के बिंदु",
        incidents: "घटनाएं", display_panel_title: "आस-पास की जानकारी", route_finder: "मार्ग खोजक", find_route_btn: "इष्टतम मार्ग खोजें",
        clear_route_btn: "मार्ग साफ़ करें", share_route: "मार्ग साझा करें", ai_chat_title: "एआई सहायक",
        ai_chat_placeholder: "एक संदेश टाइप करें...", menu_settings: "सेटिंग्स", menu_dashboard: "डैशबोर्ड",
        menu_driver: "चालक", ai_voice_response: "एआई वॉयस रिस्पांस"
    },
    es: {
        route_preferences: "Preferencias de ruta", prefer_highways: "Preferir autopistas", avoid_tolls: "Evitar peajes",
        prefer_scenic_route: "Preferir ruta escénica", layers: "Capas", roads: "Carreteras", pois: "Puntos de interés",
        incidents: "Incidentes", display_panel_title: "Información cercana", route_finder: "Buscador de rutas",
        find_route_btn: "Encontrar ruta óptima", clear_route_btn: "Borrar ruta", share_route: "Compartir ruta",
        ai_chat_title: "Asistente de IA", ai_chat_placeholder: "Escribe un mensaje...", menu_settings: "Ajustes",
        menu_dashboard: "Tablero", menu_driver: "Conductor", ai_voice_response: "Respuesta de voz de IA"
    },
    fr: {
        route_preferences: "Préférences d'itinéraire", prefer_highways: "Préférer les autoroutes", avoid_tolls: "Éviter les péages",
        prefer_scenic_route: "Préférer la route panoramique", layers: "Couches", roads: "Routes", pois: "Points d'intérêt",
        incidents: "Incidents", display_panel_title: "Informations à proximité", route_finder: "Chercheur d'itinéraire",
        find_route_btn: "Trouver l'itinéraire optimal", clear_route_btn: "Effacer l'itinéraire", share_route: "Partager l'itinéraire",
        ai_chat_title: "Assistant IA", ai_chat_placeholder: "Écrivez un message...", menu_settings: "Paramètres",
        menu_dashboard: "Tableau de bord", menu_driver: "Conducteur", ai_voice_response: "Réponse vocale de l'IA"
    },
    de: {
        route_preferences: "Routenpräferenzen", prefer_highways: "Autobahnen bevorzugen", avoid_tolls: "Maut vermeiden",
        prefer_scenic_route: "Szenische Route bevorzugen", layers: "Ebenen", roads: "Straßen", pois: "Orte von Interesse",
        incidents: "Vorfälle", display_panel_title: "Informationen in der Nähe", route_finder: "Routenfinder",
        find_route_btn: "Optimale Route finden", clear_route_btn: "Route löschen", share_route: "Route teilen",
        ai_chat_title: "KI-Assistent", ai_chat_placeholder: "Nachricht eingeben...", menu_settings: "Einstellungen",
        menu_dashboard: "Armaturenbrett", menu_driver: "Fahrer", ai_voice_response: "KI-Sprachantwort"
    },
    zh: {
        route_preferences: "路线偏好", prefer_highways: "偏好高速公路", avoid_tolls: "避开收费站", prefer_scenic_route: "偏好风景路线",
        layers: "图层", roads: "道路", pois: "兴趣点", incidents: "事件", display_panel_title: "附近信息",
        route_finder: "路线查找器", find_route_btn: "查找最佳路线", clear_route_btn: "清除路线", share_route: "分享路线",
        ai_chat_title: "AI 助手", ai_chat_placeholder: "输入消息...", menu_settings: "设置", menu_dashboard: "仪表板",
        menu_driver: "司机", ai_voice_response: "AI语音回应"
    },
    ja: {
        route_preferences: "ルート設定", prefer_highways: "高速道路を優先", avoid_tolls: "有料道路を避ける",
        prefer_scenic_route: "景色の良いルートを優先", layers: "レイヤー", roads: "道路", pois: "興味のある地点",
        incidents: "インシデント", display_panel_title: "周辺情報", route_finder: "ルートファインダー",
        find_route_btn: "最適なルートを検索", clear_route_btn: "ルートをクリア", share_route: "ルートを共有",
        ai_chat_title: "AIアシスタント", ai_chat_placeholder: "メッセージを入力...", menu_settings: "設定",
        menu_dashboard: "ダッシュボード", menu_driver: "ドライバー", ai_voice_response: "AI音声応答"
    },
    ko: {
        route_preferences: "경로 기본 설정", prefer_highways: "고속도로 선호", avoid_tolls: "유료 도로 피하기",
        prefer_scenic_route: "경치 좋은 길 선호", layers: "레이어", roads: "도로", pois: "관심 지점",
        incidents: "사건", display_panel_title: "주변 정보", route_finder: "경로 찾기", find_route_btn: "최적 경로 찾기",
        clear_route_btn: "경로 지우기", share_route: "경로 공유", ai_chat_title: "AI 어시스턴트",
        ai_chat_placeholder: "메시지를 입력하세요...", menu_settings: "설정", menu_dashboard: "대시보드", menu_driver: "운전자",
        ai_voice_response: "AI 음성 응답"
    },
    new: { // Newari
        route_preferences: "मार्ग प्राथमिकता", prefer_highways: "राजमार्गयात प्राथमिकता ब्यु", avoid_tolls: "टोलयात त्वताछ्व",
        prefer_scenic_route: "रमणीय मार्गयात प्राथमिकता ब्यु", layers: "तह", roads: "सड़क", pois: "चासोया थाय्",
        incidents: "घटना", display_panel_title: "नापजाःगु जानकारी", route_finder: "मार्ग मालेगु", find_route_btn: "उत्तम मार्ग मालेगु",
        clear_route_btn: "मार्ग पुसेछ्व", share_route: "मार्ग सेयर यायेगु", ai_chat_title: "एआई सहायक",
        ai_chat_placeholder: "सन्देश च्वयेु...", menu_settings: "सेटिङ", menu_dashboard: "ड्यासबोर्ड", menu_driver: "चालक",
        ai_voice_response: "एआई भ्वाइस रेस्पोन्स"
    },
    mai: { // Maithili
        route_preferences: "मार्ग प्राथमिकता", prefer_highways: "राजमार्गक प्राथमिकता दियौ", avoid_tolls: "टोलसँ बचू",
        prefer_scenic_route: "रमणीय मार्गक प्राथमिकता दियौ", layers: "परत", roads: "सड़क", pois: "रुचिक स्थान",
        incidents: "घटना", display_panel_title: "आसपासक जानकारी", route_finder: "मार्ग खोजक", find_route_btn: "उत्तम मार्ग खोजू",
        clear_route_btn: "मार्ग साफ करू", share_route: "मार्ग साझा करू", ai_chat_title: "एआई सहायक",
        ai_chat_placeholder: "संदेश टाइप करू...", menu_settings: "सेटिंग्स", menu_dashboard: "डैशबोर्ड", menu_driver: "चालक",
        ai_voice_response: "एआई आवाज प्रतिक्रिया"
    }
};

/**
 * Loads the available speech synthesis voices from the browser.
 * This can be asynchronous, so it's also tied to the onvoiceschanged event.
 */
const loadSpeechVoices = () => {
    availableVoices = window.speechSynthesis.getVoices();
    if(availableVoices.length > 0) {
        console.log(`${availableVoices.length} speech synthesis voices loaded.`);
    } else {
        console.warn("Speech synthesis voices array is empty. This may happen on first load.");
    }
};

/**
 * Uses the Web Speech API to speak the given text, if enabled.
 * This version is more robust, checking for available voices to prevent errors.
 * @param {string} text The text to speak.
 */
const speakText = (text: string) => {
    if (!isVoiceResponseEnabled || !('speechSynthesis' in window) || !text) {
        return;
    }

    // Cancel any previous speech to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const langMap: { [key: string]: string } = {
        en: 'en-US', np: 'ne-NP', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR',
        de: 'de-DE', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR',
        new: 'ne-NP', // Fallback Newari to Nepali
        mai: 'hi-IN'  // Fallback Maithili to Hindi
    };
    const targetLang = langMap[currentLang] || 'en-US';

    // JIT check for voices if the initial load hasn't populated the array yet.
    // This is a crucial failsafe.
    if (availableVoices.length === 0) {
        availableVoices = window.speechSynthesis.getVoices();
    }
    
    // Find the best available voice for the target language.
    let voice = availableVoices.find(v => v.lang === targetLang);
    if (!voice) {
        voice = availableVoices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
    }

    if (voice) {
        utterance.voice = voice;
        // Explicitly set the lang property to match the chosen voice.
        utterance.lang = voice.lang;
    } else {
        // This is the critical fallback. If no specific voice is found, we do NOT
        // set utterance.voice or utterance.lang. This lets the browser use its
        // default voice and PREVENTS the "language-unavailable" error.
        console.warn(`Speech synthesis voice for lang '${targetLang}' not found. Using browser default.`);
    }

    utterance.rate = 1.0;
    utterance.pitch = 1;

    utterance.onerror = (event) => {
        // Provide more detailed error information for debugging.
        console.error('SpeechSynthesisUtterance.onerror:', {
            error: (event as any).error, // The error string, e.g., "language-unavailable"
            text: utterance.text.substring(0, 100) + '...',
            requestedLang: targetLang,
            usedVoice: utterance.voice ? { name: utterance.voice.name, lang: utterance.voice.lang } : 'default (none found)',
            // Log available voices to help diagnose the issue
            availableVoices: availableVoices.map(v => ({name: v.name, lang: v.lang, default: v.default}))
        });
    };

    window.speechSynthesis.speak(utterance);
};


document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
    const settingsPanel = document.getElementById('settings-panel') as HTMLElement;
    const hamburgerMenu = document.getElementById('hamburger-menu') as HTMLButtonElement;
    const blinkingDot = hamburgerMenu.querySelector('.blinking-dot') as HTMLElement;
    const aiAssistantBtn = document.getElementById('ai-assistant') as HTMLButtonElement;
    const aiChatModal = document.getElementById('ai-chat-modal') as HTMLElement;
    const voiceResponseToggle = document.getElementById('toggle-voice-response') as HTMLInputElement;

    const updateLanguage = (lang: string) => {
        currentLang = lang;
        const elements = document.querySelectorAll('[data-lang-key]');
        elements.forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (key && (translations as any)[lang] && (translations as any)[lang][key]) {
                el.textContent = (translations as any)[lang][key];
            }
        });
        
        const placeholderElements = document.querySelectorAll('[data-lang-key-placeholder]');
        placeholderElements.forEach(el => {
            const key = el.getAttribute('data-lang-key-placeholder');
            if (key && (translations as any)[lang] && (translations as any)[lang][key]) {
                (el as HTMLInputElement).placeholder = (translations as any)[lang][key];
            }
        });
    };
    
    // --- App Initialization ---
    const init = () => {
        setupMap();
        loadData();
        setupEventListeners();
        setupAIChat();
        simulateGpsStatus();
        setupCockpitWidgets();
        simulateWeather();
        simulateUserLocation();
        simulateDriverEmotion();
        simulateVehicleOBD();

        // Load speech synthesis voices. This is asynchronous, so we also listen for the event.
        loadSpeechVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadSpeechVoices;
        }

        // Restore saved language or default to 'en'
        const savedLang = localStorage.getItem('appLanguage') || 'en';
        languageSelect.value = savedLang;
        updateLanguage(savedLang);

        // Restore saved voice response preference
        const savedVoicePref = localStorage.getItem('isVoiceResponseEnabled');
        if (savedVoicePref !== null) {
            isVoiceResponseEnabled = savedVoicePref === 'true';
            voiceResponseToggle.checked = isVoiceResponseEnabled;
        } else {
            voiceResponseToggle.checked = true;
            isVoiceResponseEnabled = true;
        }
    };

    const setupMap = () => {
        map = L.map('map', { zoomControl: false }).setView([27.7, 85.3], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Create zoom control and move it to our custom container
        const zoomControl = L.control.zoom({ position: 'bottomright' }).addTo(map);
        const zoomControlElement = zoomControl.getContainer();
        const overlayContainer = document.getElementById('map-overlays-bottom-right');

        if (zoomControlElement && overlayContainer) {
            // Append the zoom control to our custom container. It will now be part of the flex layout.
            overlayContainer.appendChild(zoomControlElement);
        }

        poisLayer = L.featureGroup().addTo(map);
        incidentsLayer = L.featureGroup().addTo(map);
    };

    const loadData = async () => {
        const roadsData = await api.getRoads();
        roadsLayer = L.geoJSON(roadsData, {
            style: (feature) => {
                switch (feature.properties.status) {
                    case 'good': return { color: "#2ecc71", weight: 5 };
                    case 'fair': return { color: "#f39c12", weight: 5 };
                    case 'poor': return { color: "#e74c3c", weight: 5, dashArray: '5, 10' };
                    default: return { color: "#3498db", weight: 5 };
                }
            }
        }).bindPopup(l => l.feature.properties.name).addTo(map);

        allPois = await api.getPOIs();
        allIncidents = await api.getIncidents();
        
        renderPois(allPois);
        renderIncidents(allIncidents);
        updateDisplayPanel([...allPois, ...allIncidents]);
        setupDisplayPanelFilters();
    };
    
    const renderPois = (pois: any[]) => {
        poisLayer.clearLayers();
        pois.forEach(poi => {
            L.marker([poi.lat, poi.lng]).addTo(poisLayer)
                .bindPopup(`<b>${poi.name}</b><br>${poi.status}`);
        });
    };

    const renderIncidents = (incidents: any[]) => {
        incidentsLayer.clearLayers();
        incidents.forEach(incident => {
            L.marker([incident.lat, incident.lng]).addTo(incidentsLayer)
                .bindPopup(`<b>${incident.name}</b>`);
        });
    };

    const setupDisplayPanelFilters = () => {
        const filtersContainer = document.getElementById('display-panel-filters')!;
        filtersContainer.innerHTML = ''; // Clear existing filters

        const allItems = [...allPois, ...allIncidents];
        const categories = ['All', ...Array.from(new Set(allItems.map(item => item.category)))];
        
        // Map categories to Material Icons
        const categoryToIconMap: { [key: string]: string } = {
            'All': 'apps',
            'landmark': 'account_balance',
            'bridge': 'commit',
            'hospital': 'local_hospital',
            'coffee shop': 'local_cafe',
            'shopping': 'shopping_cart',
            'traffic': 'traffic',
            'construction': 'construction'
        };

        categories.forEach(category => {
            const button = document.createElement('button');
            const iconName = categoryToIconMap[category] || 'place'; // Default icon
            const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

            button.className = 'filter-btn';
            button.innerHTML = `<span class="material-icons">${iconName}</span>`;
            button.dataset.category = category;
            button.title = categoryLabel; // Tooltip for accessibility

            if (category === 'All') {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                // Update active state
                filtersContainer.querySelector('.filter-btn.active')?.classList.remove('active');
                button.classList.add('active');

                const filteredItems = category === 'All'
                    ? allItems
                    : allItems.filter(item => item.category === category);
                updateDisplayPanel(filteredItems);
            });
            filtersContainer.appendChild(button);
        });
    };

    const updateDisplayPanel = (items: any[]) => {
        const listEl = document.getElementById('display-panel-list')!;
        listEl.innerHTML = ''; // Clear list
        if (items.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; padding: 1rem;">No items found.</p>';
            return;
        }
        items.sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.category}</p>
                <span class="card-status ${item.status.toLowerCase().replace(/\s/g, '-')}">${item.status}</span>
            `;
            card.onclick = () => {
                map.flyTo([item.lat, item.lng], 16);
            };
            listEl.appendChild(card);
        });
    };
    
    const addMessageToChat = (message: string, sender: 'user' | 'ai') => {
        const chatMessagesContainer = document.getElementById('chat-messages') as HTMLElement;
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', sender === 'ai' ? 'ai-message' : 'user-message');
        // A simple way to render potential markdown from the AI for better readability
        const processedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        messageEl.innerHTML = `<p>${processedMessage}</p>`;
        chatMessagesContainer.appendChild(messageEl);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

        if (sender === 'ai') {
             // Don't speak intermediate messages like "Searching..."
            if (!message.startsWith("Searching for")) {
                speakText(message);
            }
        }
    };

    const setupAIChat = () => {
        const chatForm = document.getElementById('chat-form') as HTMLFormElement;
        const chatInput = document.getElementById('chat-input') as HTMLInputElement;
        const typingIndicator = document.getElementById('typing-indicator') as HTMLElement;
        const aiChatCloseBtn = document.getElementById('ai-chat-close') as HTMLButtonElement;
        
        // 1. Define the tool schema for the AI
        const tools: Tool[] = [
            {
                functionDeclarations: [
                    {
                        name: "googleSearch",
                        description: "Search for information about specific points of interest (POIs) and incidents in the local Kathmandu area.",
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                searchQuery: {
                                    type: Type.STRING,
                                    description: "The name of the place or incident to search for (e.g., 'Thapathali Bridge', 'Traffic Jam at Baneshwor')."
                                }
                            },
                            required: ["searchQuery"]
                        }
                    }
                ]
            }
        ];
        
        // 2. Implement the tool function. This simulates a search within the app's data.
        const googleSearch = ({ searchQuery }: { searchQuery: string }) => {
            console.log(`AI tool executing search for: "${searchQuery}"`);
            const query = searchQuery.toLowerCase().trim();
            // Search both POIs and Incidents
            const results = [...allPois, ...allIncidents].filter(item =>
                item.name.toLowerCase().includes(query)
            );

            if (results.length > 0) {
                // Return structured data for the AI to interpret
                return { 
                    results: results.map(r => ({ name: r.name, category: r.category, status: r.status })) 
                };
            } else {
                return { results: `No information found for "${searchQuery}".` };
            }
        };

        const availableTools = {
            googleSearch,
        };

        // 3. Update chat logic to handle the function-calling flow
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userInput = chatInput.value.trim();
            if (!userInput) return;

            window.speechSynthesis.cancel();
            addMessageToChat(userInput, 'user');
            chatInput.value = '';
            typingIndicator.classList.remove('hidden');

            try {
                if (!activeChat) {
                     activeChat = ai.chats.create({
                        model: 'gemini-2.5-flash',
                        config: {
                            tools: tools, // Pass tool schema to the chat model
                            // Update system instructions to inform the AI about its new role as a proactive co-pilot
                            systemInstruction: "You are a helpful and proactive road assistant for Nepal called Sadak Sathi. You are a co-pilot. Your primary role is to provide concise and relevant information about roads, points of interest, and driving conditions. When asked about specific locations, use the googleSearch tool to find up-to-date information. IMPORTANT: You will also receive automated system alerts about driver status and vehicle health. When these alerts come in, your next response to the user should directly address the alert and offer help (e.g., suggest a break, or offer to find a petrol station or repair shop)."
                        }
                    });
                }

                let response: GenerateContentResponse = await activeChat.sendMessage({ message: userInput });
                
                // This loop handles the back-and-forth for function calling
                while (true) {
                    const functionCall = response.candidates?.[0]?.content?.parts[0]?.functionCall;
                    
                    if (!functionCall) {
                        break; // Exit loop if no function call is present in the response
                    }

                    const { name, args } = functionCall;
                    const toolFunction = (availableTools as any)[name];

                    if (!toolFunction) {
                        throw new Error(`Error: Unknown tool "${name}" requested by the model.`);
                    }
                    
                    if (args.searchQuery) {
                       addMessageToChat(`Searching for '${args.searchQuery}'...`, 'ai');
                    }
                    
                    // Call the local function that implements the tool
                    const result = toolFunction(args);
                    
                    // Send the tool's result back to the model
                    response = await activeChat.sendMessage({
                        contents: {
                            parts: [
                                {
                                    functionResponse: {
                                        name: name,
                                        response: result
                                    }
                                }
                            ]
                        }
                    });
                }
                
                // Display the final text response from the AI
                addMessageToChat(response.text, 'ai');

            } catch (error) {
                console.error("AI Chat Error:", error);
                addMessageToChat("Sorry, I'm having trouble connecting right now.", 'ai');
            } finally {
                typingIndicator.classList.add('hidden');
            }
        });
        
        aiChatCloseBtn.addEventListener('click', () => {
            aiChatModal.classList.add('hidden');
            window.speechSynthesis.cancel(); // Stop speaking when chat is closed
        });
    };
    
    /**
     * Proactively sends an alert to the user via the AI chat.
     * @param {string} message The alert message.
     */
    const triggerAIAlert = async (message: string) => {
        // Open the chat if it's closed to show the alert
        const aiChatModal = document.getElementById('ai-chat-modal') as HTMLElement;
        if (aiChatModal.classList.contains('hidden')) {
            aiChatModal.classList.remove('hidden');
        }
        
        addMessageToChat(message, 'ai');
        
        // Also send the alert to the AI model's history so it has context
        if (activeChat) {
            try {
                // We send a combined message to the model for context.
                // The model's response will be what it says to the user next.
                const systemMessageForAI = `System Alert Triggered: ${message}. How should I respond to the user about this?`;
                const response = await activeChat.sendMessage({ message: systemMessageForAI });
                addMessageToChat(response.text, 'ai');
            } catch (error) {
                console.error("Error sending system alert to AI:", error);
            }
        }
    };

    const updateGpsStatus = (status: 'searching' | 'connected' | 'lost') => {
        const indicator = document.getElementById('gps-status-indicator');
        if (indicator) {
            indicator.className = ''; // Reset classes
            indicator.classList.add(status);
            indicator.title = `GPS Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        }
    };

    const simulateGpsStatus = () => {
        const states: ('searching' | 'connected' | 'lost')[] = ['searching', 'connected', 'lost'];
        let currentStateIndex = 0;

        const cycleStatus = () => {
            const currentStatus = states[currentStateIndex];
            updateGpsStatus(currentStatus);

            // Set the duration for the current state before scheduling the next one.
            let duration;
            switch (currentStatus) {
                case 'searching':
                    duration = 4000; // 4 seconds
                    break;
                case 'connected':
                    duration = 10000; // 10 seconds
                    break;
                case 'lost':
                    duration = 4000; // 4 seconds
                    break;
                default:
                    duration = 5000; // Fallback
            }

            // Move to the next state for the next cycle.
            currentStateIndex = (currentStateIndex + 1) % states.length;

            // Schedule the next update.
            setTimeout(cycleStatus, duration);
        };

        // Start the simulation cycle.
        cycleStatus();
    };


    const setupCockpitWidgets = () => {
        let currentSpeed = 0;
        let currentHeading = 0;

        const speedValueEl = document.querySelector('#speed-widget .value') as HTMLElement;
        const compassRoseEl = document.querySelector('#compass-widget .compass-rose') as HTMLElement;

        if (!speedValueEl || !compassRoseEl) {
            console.error("Cockpit widgets not found in the DOM.");
            return;
        }

        const degreesToCardinal = (deg: number): string => {
            const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
            return cardinals[Math.round(deg / 45)];
        };

        setInterval(() => {
            // Simulate speed change
            const speedChange = (Math.random() - 0.45) * 10; // Bias towards acceleration
            currentSpeed += speedChange;
            currentSpeed = Math.max(0, Math.min(85, currentSpeed)); // Clamp between 0 and 85

            // Simulate heading change
            const headingChange = (Math.random() - 0.5) * 20;
            currentHeading = (currentHeading + headingChange + 360) % 360;

            // Update DOM
            speedValueEl.textContent = Math.round(currentSpeed).toString();
            compassRoseEl.textContent = degreesToCardinal(currentHeading);

        }, 2500); // Update every 2.5 seconds
    };

    const simulateWeather = () => {
        const weatherIconEl = document.getElementById('weather-icon');
        const weatherTempEl = document.getElementById('weather-temp');
        if (!weatherIconEl || !weatherTempEl) return;

        const weatherStates = [
            { icon: 'sunny', temp: 28 },
            { icon: 'cloud', temp: 24 },
            { icon: 'thunderstorm', temp: 21 },
            { icon: 'ac_unit', temp: 18 }
        ];
        let currentStateIndex = 0;
        
        const updateWeather = () => {
            const newState = weatherStates[currentStateIndex];
            weatherIconEl.textContent = newState.icon;
            weatherTempEl.textContent = `${newState.temp}°C`;
            // Add a class for color styling
            weatherIconEl.className = 'material-icons'; // Reset
            if (newState.icon === 'sunny') weatherIconEl.classList.add('sunny');
            else if (newState.icon === 'cloud') weatherIconEl.classList.add('cloudy');
            else if (newState.icon === 'thunderstorm') weatherIconEl.classList.add('stormy');
            else if (newState.icon === 'ac_unit') weatherIconEl.classList.add('cold');

            currentStateIndex = (currentStateIndex + 1) % weatherStates.length;
        };

        updateWeather(); // Run once immediately
        setInterval(updateWeather, 15000); // Change every 15 seconds
    };

    const simulateUserLocation = () => {
        const locationNameEl = document.getElementById('location-name');
        const locationCoordsEl = document.getElementById('location-coords');
        if (!locationNameEl || !locationCoordsEl) return;
        
        const locations = [
            { name: "Thamel, Kathmandu", coords: "27.71, 85.31" },
            { name: "Patan Durbar Square", coords: "27.67, 85.32" },
            { name: "Boudhanath Stupa", coords: "27.72, 85.36" },
            { name: "Swayambhunath", coords: "27.71, 85.29" }
        ];
        let currentLocationIndex = 0;

        setInterval(() => {
            currentLocationIndex = (currentLocationIndex + 1) % locations.length;
            const newLocation = locations[currentLocationIndex];
            locationNameEl.textContent = newLocation.name;
            locationCoordsEl.textContent = newLocation.coords;
        }, 12000); // Change every 12 seconds
    };
    
    const simulateDriverEmotion = () => {
        const statusIconEl = document.getElementById('driver-status-icon');
        const statusTextEl = document.getElementById('driver-status-text');
        if (!statusIconEl || !statusTextEl) return;

        const states = [
            { status: 'Calm', icon: 'sentiment_very_satisfied', duration: 20000, alert: null },
            { status: 'Tired', icon: 'sentiment_dissatisfied', duration: 10000, alert: "System Alert: Driver appears tired. It might be a good time to take a short break." },
            { status: 'Calm', icon: 'sentiment_very_satisfied', duration: 20000, alert: null },
            { status: 'Stressed', icon: 'sentiment_very_dissatisfied', duration: 10000, alert: "System Alert: Driver appears stressed. Consider pulling over for a moment." }
        ];
        let currentStateIndex = 0;
        let alertSentForState = false;

        const cycleState = () => {
            const currentState = states[currentStateIndex];
            
            statusIconEl.textContent = currentState.icon;
            statusTextEl.textContent = currentState.status;
            statusTextEl.className = `status-text ${currentState.status.toLowerCase()}`;
            
            if(currentState.alert && !alertSentForState) {
                triggerAIAlert(currentState.alert);
                alertSentForState = true;
            }

            currentStateIndex = (currentStateIndex + 1) % states.length;
            // Reset alert flag when moving to a new state
            if(currentStateIndex !== (currentStateIndex - 1 + states.length) % states.length) {
                alertSentForState = false;
            }

            setTimeout(cycleState, currentState.duration);
        };
        cycleState();
    };

    const simulateVehicleOBD = () => {
        let fuel = 85, temp = 90, pressure = 32;
        let isLowFuelAlertSent = false, isLowPressureAlertSent = false;
        
        const fuelValueEl = document.getElementById('fuel-value');
        const fuelBarEl = document.getElementById('fuel-bar');
        const tempValueEl = document.getElementById('temp-value');
        const tempBarEl = document.getElementById('temp-bar');
        const pressureValueEl = document.getElementById('pressure-value');
        const pressureBarEl = document.getElementById('pressure-bar');
        
        if(!fuelValueEl || !fuelBarEl || !tempValueEl || !tempBarEl || !pressureValueEl || !pressureBarEl) return;

        setInterval(() => {
            // Simulate data change
            fuel -= Math.random() * 0.5;
            temp += (Math.random() - 0.5) * 2;
            pressure -= Math.random() * 0.1;
            
            fuel = Math.max(0, fuel);
            temp = Math.max(70, Math.min(120, temp));
            pressure = Math.max(20, pressure);

            // Update UI
            fuelValueEl.textContent = `${Math.round(fuel)}%`;
            fuelBarEl.style.width = `${fuel}%`;
            tempValueEl.textContent = `${Math.round(temp)}°C`;
            tempBarEl.style.width = `${((temp - 70) / 50) * 100}%`; // Normalize temp range
            pressureValueEl.textContent = `${Math.round(pressure)} PSI`;
            pressureBarEl.style.width = `${((pressure - 20) / 15) * 100}%`; // Normalize pressure range

            // Update bar colors based on value
            fuelBarEl.className = fuel > 20 ? 'bar-good' : fuel > 10 ? 'bar-warn' : 'bar-danger';
            tempBarEl.className = temp < 105 ? 'bar-good' : temp < 115 ? 'bar-warn' : 'bar-danger';
            pressureBarEl.className = pressure > 28 ? 'bar-good' : pressure > 25 ? 'bar-warn' : 'bar-danger';
            
            // Trigger AI Alerts
            if (fuel < 15 && !isLowFuelAlertSent) {
                triggerAIAlert("System Alert: Fuel level is critically low. I can search for nearby petrol stations.");
                isLowFuelAlertSent = true;
            } else if (fuel > 20) {
                isLowFuelAlertSent = false; // Reset alert when refueled
            }

            if (pressure < 26 && !isLowPressureAlertSent) {
                triggerAIAlert("System Alert: Tire pressure is low. I can find the nearest repair shop for you.");
                isLowPressureAlertSent = true;
            } else if (pressure > 28) {
                isLowPressureAlertSent = false; // Reset alert when inflated
            }

        }, 3000);
    };


    const setupEventListeners = () => {
        // Language switcher
        languageSelect.addEventListener('change', (e) => {
            const lang = (e.target as HTMLSelectElement).value;
            updateLanguage(lang);
            localStorage.setItem('appLanguage', lang);
        });

        // Settings panel toggle
        hamburgerMenu.addEventListener('click', () => {
            settingsPanel.classList.toggle('open');
            blinkingDot.classList.add('hide');
        });
        document.addEventListener('click', (e) => {
            if (!settingsPanel.contains(e.target as Node) && !hamburgerMenu.contains(e.target as Node)) {
                settingsPanel.classList.remove('open');
            }
        });

        // AI Chat modal toggle
        aiAssistantBtn.addEventListener('click', () => {
            aiChatModal.classList.remove('hidden');
        });

        // Route Finder Panel Toggle
        const routeFinderTrigger = document.getElementById('route-finder-trigger') as HTMLButtonElement;
        const routeFinderPanel = document.getElementById('route-finder-panel') as HTMLElement;
        const routeFinderCloseBtn = document.getElementById('route-finder-close') as HTMLButtonElement;

        if(routeFinderTrigger && routeFinderPanel && routeFinderCloseBtn) {
            routeFinderTrigger.addEventListener('click', () => {
                routeFinderPanel.classList.remove('hidden');
            });
            routeFinderCloseBtn.addEventListener('click', () => {
                routeFinderPanel.classList.add('hidden');
            });
        }


        // Voice response toggle
        voiceResponseToggle.addEventListener('change', () => {
            isVoiceResponseEnabled = voiceResponseToggle.checked;
            localStorage.setItem('isVoiceResponseEnabled', String(isVoiceResponseEnabled));
            if (!isVoiceResponseEnabled) {
                window.speechSynthesis.cancel();
            }
        });
        
        // Display panel toggle
        const displayPanel = document.getElementById('display-panel');
        const displayPanelHeader = document.getElementById('display-panel-header');
        if(displayPanel && displayPanelHeader) {
            displayPanelHeader.addEventListener('click', () => {
                displayPanel.classList.toggle('collapsed');
            });
            // Initially set to collapsed
             displayPanel.classList.add('collapsed');
        }
        
        // Driver Dashboard Toggle
        const dashboardBtn = document.getElementById('dashboard-btn') as HTMLButtonElement;
        const driverDashboard = document.getElementById('driver-dashboard') as HTMLElement;
        if(dashboardBtn && driverDashboard) {
            dashboardBtn.addEventListener('click', () => {
                driverDashboard.classList.toggle('open');
            });
        }

        // Layer toggles
        (document.getElementById('toggle-roads') as HTMLInputElement).addEventListener('change', (e) => {
            if ((e.target as HTMLInputElement).checked) map.addLayer(roadsLayer);
            else map.removeLayer(roadsLayer);
        });
        (document.getElementById('toggle-pois') as HTMLInputElement).addEventListener('change', (e) => {
            if ((e.target as HTMLInputElement).checked) map.addLayer(poisLayer);
            else map.removeLayer(poisLayer);
        });
        (document.getElementById('toggle-incidents') as HTMLInputElement).addEventListener('change', (e) => {
            if ((e.target as HTMLInputElement).checked) map.addLayer(incidentsLayer);
            else map.removeLayer(incidentsLayer);
        });
    };

    // --- Let's go! ---
    init();
});