// Firebase Init
const firebaseConfig = {
  apiKey: "AIzaSyCQHnqCtpiNfLCxmVBMhPsFfnTvAe5obG8",
  authDomain: "smart-civic-reporter-73427.firebaseapp.com",
  projectId: "smart-civic-reporter-73427",
  storageBucket: "smart-civic-reporter-73427.firebasestorage.app",
  messagingSenderId: "244215583578",
  appId: "1:244215583578:web:350fa9987215f8eff31963"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let userLocation = { latitude: null, longitude: null };
let reportMap, trackerMap;
let reportMarker = null;
let globalReports = [];
let currentLang = 'en';
let selectedPhotoFile = null;
let activeResolveReportId = null;

// Fixed Security PIN for Admin Console
const ADMIN_SECURITY_PIN = "2486";

// Speech Recognition Engine (Voice-to-Text)
let recognition = null;
let isRecordingVoice = false;

// Advanced NLP Keywords
const CRITICAL_KEYWORDS = ["accident", "danger", "spark", "fire", "wire", "burst", "overflow", "death", "deep", "emergency", "current", "hospital", "school", "खतरा", "दुर्घटना", "तार", "आग", "गंभीर", "विद्युत", "धोका", "अपघात", "शॉक", "गळती", "पाणी", "लाईट", "करंट"];
const MEDIUM_KEYWORDS = ["leak", "garbage", "smell", "block", "light", "pothole", "कचरा", "दुर्गंध", "खड्डा", "गंदगी", "बंद", "तुंबले", "रस्ता"];

// Generate Unique 7-Character Report ID (Strictly 3 letters + 4 digits: e.g. NIP-5479)
function generateReportId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `NIP-${num}`;
}

// Multilingual Dictionary
const TRANSLATIONS = {
    en: {
        navHome: "Home",
        navReport: "Report",
        navTracker: "Live Tracker",
        navStatus: "🔍 Track Status",
        homeTitle: "Intelligent Civic Grievance System",
        homeSubtitle: "Zero-delay local reporting with automated AI severity scoring & geo-duplicate detection.",
        totalIssues: "Total Issues",
        resolvedIssues: "Resolved",
        criticalIssues: "Critical / High",
        reportNow: "📢 Report an Issue Now",
        formHeading: "Report Civic Issue",
        lblCat: "Issue Category",
        categories: {
            placeholder: "-- Select Category --",
            pothole: "Pothole / Broken Road",
            garbage: "Garbage Dump / Sanitation",
            water: "Water Pipe Leakage",
            light: "Broken Street Light / Electrical",
            sewage: "Sewage / Drain Overflow",
            other: "Other Problem"
        },
        lblDesc: "Problem Description",
        descPlaceholder: "Describe issue or click mic to speak...",
        voiceBtnDefault: "Speak (Voice-to-Text)",
        voiceBtnActive: "Listening... Speak now",
        aiMeterTitle: "🤖 AI Urgency Engine:",
        lblPhoto: "Issue Photo (Camera or Gallery)",
        btnTakePhoto: "📷 Open Camera",
        btnPickGallery: "📁 Gallery / Files",
        lblLoc: "Location Tagging",
        btnLoc: "📍 Detect Live GPS Location",
        lblOptional: "Citizen Details (Optional)",
        namePlaceholder: "Your Name (Optional)",
        phonePlaceholder: "Mobile Number (Optional for WhatsApp updates)",
        submitBtn: "Submit to CivicSense Engine",
        trackerTitle: "Live Public Issue Tracker",
        trackerSubtitle: "Click on any marker to see status & AI priority.",
        trackStatusTitle: "Track Grievance Status",
        trackStatusSubtitle: "Enter your 7-character Report ID (e.g., NIP-5479) to check real-time progress.",
        btnSearchStatus: "Search",
        adminTitle: "CivicSense-Nipane Grampanchayat Admin Portal",
        adminSubtitle: "Real-Time Citizen Grievance & AI Prioritization Console",
        openPublic: "← Open Public App",
        viewModeLabel: "View Mode:",
        viewModes: {
            none: "📋 Default (Flat List)",
            geo: "📍 Group by Nearby (100m Geo-Clusters)",
            aiSame: "🤖 Group by Same Problems (AI Matched)"
        },
        sortLabel: "Sort By:",
        sortOptions: {
            newest: "📅 Date: Newest First",
            oldest: "📅 Date: Oldest First",
            highPriority: "⚡ Urgency: High to Low",
            lowPriority: "🌱 Urgency: Low to High"
        },
        priorityFilterAll: "All Priorities",
        priorityFilterHigh: "Critical / High Only",
        priorityFilterMed: "Medium Only",
        priorityFilterLow: "Low Only",
        tableHeaders: {
            id: "#ID",
            photo: "Photo",
            date: "Date & Time",
            desc: "Issue & Description",
            citizen: "Citizen Info",
            priority: "AI Urgency",
            cluster: "Geo-Cluster",
            same: "AI Match",
            status: "Status",
            action: "Action"
        },
        btnProg: "Progress",
        btnRes: "Resolve",
        btnDel: "Delete",
        btnPrint: "Print Slip",
        anonymous: "Anonymous",
        noPhone: "No Phone",
        singleReport: "Single",
        clusterTag: "Nearby",
        uniqueIssue: "Unique"
    },
    hi: {
        navHome: "होम",
        navReport: "शिकायत दर्ज करें",
        navTracker: "लाइव ट्रैकर",
        navStatus: "🔍 स्थिति जांचें",
        homeTitle: "स्मार्ट नागरिक शिकायत निवारण प्रणाली",
        homeSubtitle: "स्वचालित एआई प्राथमिकता और जीपीएस मैपिंग के साथ त्वरित ग्राम शिकायत निवारण।",
        totalIssues: "कुल समस्याएं",
        resolvedIssues: "हल की गई",
        criticalIssues: "अति गंभीर",
        reportNow: "📢 समस्या दर्ज करें",
        formHeading: "नागरिक समस्या दर्ज करें",
        lblCat: "समस्या की श्रेणी",
        categories: {
            placeholder: "-- श्रेणी चुनें --",
            pothole: "सड़क / गड्ढे की समस्या",
            garbage: "कचरा डिपो / स्वच्छता",
            water: "पानी की पाइप लीकेज",
            light: "खराब स्ट्रीट लाइट / विद्युत",
            sewage: "नाली / गटर ओवरफ्लो",
            other: "अन्य समस्या"
        },
        lblDesc: "समस्या का विवरण",
        descPlaceholder: "विवरण लिखें या माइक दबाकर बोलें...",
        voiceBtnDefault: "बोलकर लिखें (माइक)",
        voiceBtnActive: "सुन रहे हैं... बोलिए",
        aiMeterTitle: "🤖 एआई प्राथमिकता इंजन:",
        lblPhoto: "समस्या की फोटो (कैमरा या गैलरी)",
        btnTakePhoto: "📷 कैमरा खोलें",
        btnPickGallery: "📁 गैलरी / फाइल्स",
        lblLoc: "स्थान का चयन",
        btnLoc: "📍 लाइव जीपीएस स्थान चुनें",
        lblOptional: "नागरिक विवरण (ऐच्छिक)",
        namePlaceholder: "आपका नाम (ऐच्छिक)",
        phonePlaceholder: "मोबाइल नंबर (व्हाट्सएप अपडेट के लिए ऐच्छिक)",
        submitBtn: "सिविकसेंस प्रणाली में भेजें",
        trackerTitle: "सार्वजनिक लाइव समस्या ट्रैकर",
        trackerSubtitle: "समस्या की स्थिति व एआई प्राथमिकता देखने के लिए मार्कर पर क्लिक करें।",
        trackStatusTitle: "शिकायत की स्थिति जांचें",
        trackStatusSubtitle: "प्रगति देखने के लिए अपनी 7-अक्षरों की रिपोर्ट आईडी (उदा. NIP-5479) दर्ज करें।",
        btnSearchStatus: "खोजें",
        adminTitle: "सिविकसेंस-निपाणे ग्रामपंचायत एडमिन पोर्टल",
        adminSubtitle: "नागरिक शिकायत व एआई प्राथमिकता प्रबंधन प्रणाली",
        openPublic: "← पब्लिक ऐप खोलें",
        viewModeLabel: "व्यू मोड:",
        viewModes: {
            none: "📋 सामान्य सूची",
            geo: "📍 100 मी. क्लस्टर समूह",
            aiSame: "🤖 समान समस्या समूह (AI)"
        },
        sortLabel: "क्रमबद्ध करें:",
        sortOptions: {
            newest: "📅 दिनांक: नवीनतम पहले",
            oldest: "📅 दिनांक: पुरानी पहले",
            highPriority: "⚡ गंभीरता: उच्च से निम्न",
            lowPriority: "🌱 गंभीरता: निम्न से उच्च"
        },
        priorityFilterAll: "सभी प्राथमिकताएं",
        priorityFilterHigh: "अति गंभीर / उच्च केवल",
        priorityFilterMed: "मध्यम केवल",
        priorityFilterLow: "सामान्य केवल",
        tableHeaders: {
            id: "#आईडी",
            photo: "फोटो",
            date: "दिनांक व समय",
            desc: "समस्या व विवरण",
            citizen: "नागरिक विवरण",
            priority: "एआई गंभीरता",
            cluster: "क्लस्टर चेतावनी",
            same: "समान समस्या",
            status: "स्थिति",
            action: "कार्रवाई"
        },
        btnProg: "प्रगति में",
        btnRes: "हल किया",
        btnDel: "हटाएं",
        btnPrint: "पर्ची प्रिंट करें",
        anonymous: "अज्ञात नागरिक",
        noPhone: "नंबर नहीं",
        singleReport: "एकल रिपोर्ट",
        clusterTag: "आसपास",
        uniqueIssue: "अद्वितीय"
    },
    mr: {
        navHome: "मुख्यपृष्ठ",
        navReport: "तक्रार नोंदणी",
        navTracker: "थेट ट्रॅकर",
        navStatus: "🔍 तक्रार स्थिती",
        homeTitle: "स्मार्ट नागरी तक्रार निवारण प्रणाली",
        homeSubtitle: "स्वयंचलित एआय प्राधान्य आणि जीपीएस मॅपिंगद्वारे थेट ग्राम तक्रार निवारण.",
        totalIssues: "एकूण तक्रारी",
        resolvedIssues: "निवारण झालेल्या",
        criticalIssues: "अति गंभीर",
        reportNow: "📢 तक्रार नोंदवा",
        formHeading: "नागरी समस्या नोंदवा",
        lblCat: "समस्येचा प्रकार",
        categories: {
            placeholder: "-- समस्येचा प्रकार निवडा --",
            pothole: "रस्ता / खड्डे समस्या",
            garbage: "कचरा डेपो / स्वच्छता",
            water: "पाण्याची पाईप गळती",
            light: "बंद पथदिवे / विद्युत समस्या",
            sewage: "सांडपाणी / गटार तुंबणे",
            other: "इतर नागरी समस्या"
        },
        lblDesc: "समस्येचे सविस्तर वर्णन",
        descPlaceholder: "वर्णन लिहा किंवा माईक दाबून बोला...",
        voiceBtnDefault: "बोलून टाईप करा (माईक)",
        voiceBtnActive: "ऐकत आहे... बोला",
        aiMeterTitle: "🤖 एआय प्राधान्य इंजिन:",
        lblPhoto: "समस्येचा फोटो (कॅमेरा किंवा गॅलरी)",
        btnTakePhoto: "📷 कॅमेरा उघडा",
        btnPickGallery: "📁 गॅलरी / फाइल्स",
        lblLoc: "स्थान निश्चिती",
        btnLoc: "📍 थेट जीपीएस स्थान निवडा",
        lblOptional: "नागरिकाची माहिती (ऐच्छिक)",
        namePlaceholder: "आपले नाव (ऐच्छिक)",
        phonePlaceholder: "मोबाईल नंबर (व्हॉट्सॲप अपडेटसाठी ऐच्छिक)",
        submitBtn: "सिव्हिकसेन्स प्रणालीमध्ये पाठवा",
        trackerTitle: "थेट नागरी समस्या ट्रॅकर",
        trackerSubtitle: "समस्येची स्थिती व एआय प्राधान्य पाहण्यासाठी मार्करवर क्लिक करा.",
        trackStatusTitle: "तक्रार निवारण स्थिती",
        trackStatusSubtitle: "थेट स्थिती तपासण्यासाठी आपला ७-अक्षरी रिपोर्ट आयडी (उदा. NIP-5479) टाका.",
        btnSearchStatus: "शोधा",
        adminTitle: "सिव्हिकसेन्स-निपाणे ग्रामपंचायत ॲडमिन पोर्टल",
        adminSubtitle: "नागरी तक्रार व एआय प्राधान्य व्यवस्थापन प्रणाली",
        openPublic: "← पब्लिक ॲप उघडा",
        viewModeLabel: "पाहणी पद्धत:",
        viewModes: {
            none: "📋 सामान्य यादी",
            geo: "📍 १०० मी. परिसर गट (क्लस्टर)",
            aiSame: "🤖 समान समस्या गट (AI जुळणी)"
        },
        sortLabel: "क्रमवारी:",
        sortOptions: {
            newest: "📅 दिनांक: नवीन आधी",
            oldest: "📅 दिनांक: जुने आधी",
            highPriority: "⚡ प्राधान्य: अति गंभीर ते कमी",
            lowPriority: "🌱 प्राधान्य: कमी ते जास्त"
        },
        priorityFilterAll: "सर्व तक्रारी",
        priorityFilterHigh: "अति गंभीर फक्त",
        priorityFilterMed: "मध्यम फक्त",
        priorityFilterLow: "सामान्य फक्त",
        tableHeaders: {
            id: "#आयडी",
            photo: "छायाचित्र",
            date: "दिनांक आणि वेळ",
            desc: "समस्या व तपशील",
            citizen: "नागरिकाची माहिती",
            priority: "एआय प्राधान्य",
            cluster: "क्लस्टर इशारा",
            same: "एआय जुळणी",
            status: "स्थिती",
            action: "कृती"
        },
        btnProg: "प्रगतीपथावर",
        btnRes: "निवारण झाले",
        btnDel: "हटवा",
        btnPrint: "पावती प्रिंट",
        anonymous: "अनामिक नागरिक",
        noPhone: "नंबर नाही",
        singleReport: "एकच तक्रार",
        clusterTag: "जवळपास",
        uniqueIssue: "एकमेव"
    }
};

// Admin Authentication
function checkAdminAuth() {
    const lockScreen = document.getElementById('adminLockScreen');
    if (!lockScreen) return;

    const isAuth = sessionStorage.getItem('civicSenseAdminAuth');
    if (isAuth === 'true') {
        lockScreen.style.display = 'none';
    } else {
        lockScreen.style.display = 'flex';
        const pinInput = document.getElementById('adminPinInput');
        if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
            pinInput.onkeypress = function (e) {
                if (e.key === 'Enter') verifyAdminPin();
            };
        }
    }
}

function verifyAdminPin() {
    const pinInput = document.getElementById('adminPinInput');
    const errorMsg = document.getElementById('pinErrorMsg');
    const lockScreen = document.getElementById('adminLockScreen');

    if (pinInput && pinInput.value === ADMIN_SECURITY_PIN) {
        sessionStorage.setItem('civicSenseAdminAuth', 'true');
        if (lockScreen) lockScreen.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';
        applySortingAndFiltering();
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
        if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
        }
    }
}

function adminLogout() {
    sessionStorage.removeItem('civicSenseAdminAuth');
    window.location.reload();
}

// Feature 1: Voice-to-Text Recognition
function toggleVoiceInput() {
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceText = document.getElementById('voiceBtnText');
    const descInput = document.getElementById('description');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech Recognition not supported in this browser. Please use Chrome/Edge.");
        return;
    }

    if (isRecordingVoice) {
        if (recognition) recognition.stop();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Auto-select dialect according to chosen language
    if (currentLang === 'mr') recognition.lang = 'mr-IN';
    else if (currentLang === 'hi') recognition.lang = 'hi-IN';
    else recognition.lang = 'en-IN';

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {
        isRecordingVoice = true;
        voiceBtn.classList.add('recording');
        voiceText.innerText = TRANSLATIONS[currentLang].voiceBtnActive;
    };

    recognition.onresult = function(event) {
        const speechResult = event.results[0][0].transcript;
        descInput.value = descInput.value ? `${descInput.value}${speechResult}` : speechResult;
        triggerAiAnalysis();
    };

    recognition.onerror = function() {
        recognition.stop();
    };

    recognition.onend = function() {
        isRecordingVoice = false;
        voiceBtn.classList.remove('recording');
        voiceText.innerText = TRANSLATIONS[currentLang].voiceBtnDefault;
    };

    recognition.start();
}

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang];
    if (!t) return;

    const pSel = document.getElementById("langSelect");
    const aSel = document.getElementById("adminLangSelect");
    if (pSel) pSel.value = lang;
    if (aSel) aSel.value = lang;

    // Public Page Elements
    const navHome = document.getElementById("nav-home");
    const navReport = document.getElementById("nav-report");
    const navTracker = document.getElementById("nav-tracker");
    const navStatus = document.getElementById("nav-status");
    if (navHome) navHome.innerText = t.navHome;
    if (navReport) navReport.innerText = t.navReport;
    if (navTracker) navTracker.innerText = t.navTracker;
    if (navStatus) navStatus.innerText = t.navStatus;

    const homeTitle = document.getElementById("home-title");
    const homeSubtitle = document.getElementById("home-subtitle");
    const txtTotal = document.getElementById("txt-stat-total");
    const txtResolved = document.getElementById("txt-stat-resolved");
    const txtCritical = document.getElementById("txt-stat-critical");
    const btnReport = document.getElementById("btn-report-now");
    const formHeading = document.getElementById("form-heading");
    const lblCat = document.getElementById("lbl-cat");
    const lblDesc = document.getElementById("lbl-desc");
    const descField = document.getElementById("description");
    const voiceBtnText = document.getElementById("voiceBtnText");
    const txtAiMeter = document.getElementById("txt-ai-meter-title");
    const lblPhoto = document.getElementById("lbl-photo");
    const btnTakePhoto = document.getElementById("btn-take-photo");
    const btnPickGallery = document.getElementById("btn-pick-gallery");
    const lblLoc = document.getElementById("lbl-loc");
    const btnLoc = document.getElementById("btn-detect-loc");
    const lblOptional = document.getElementById("lbl-optional-title");
    const rName = document.getElementById("reporterName");
    const rPhone = document.getElementById("reporterPhone");
    const submitBtn = document.getElementById("submitBtn");
    const trackerTitle = document.getElementById("tracker-title");
    const trackerSubtitle = document.getElementById("tracker-subtitle");
    const trackStatusTitle = document.getElementById("track-status-title");
    const trackStatusSubtitle = document.getElementById("track-status-subtitle");
    const btnSearchStatus = document.getElementById("btn-search-status");

    if (homeTitle) homeTitle.innerText = t.homeTitle;
    if (homeSubtitle) homeSubtitle.innerText = t.homeSubtitle;
    if (txtTotal) txtTotal.innerText = t.totalIssues;
    if (txtResolved) txtResolved.innerText = t.resolvedIssues;
    if (txtCritical) txtCritical.innerText = t.criticalIssues;
    if (btnReport) btnReport.innerText = t.reportNow;
    if (formHeading) formHeading.innerText = t.formHeading;
    if (lblCat) lblCat.innerText = t.lblCat;
    if (lblDesc) lblDesc.innerText = t.lblDesc;
    if (descField) descField.placeholder = t.descPlaceholder;
    if (voiceBtnText) voiceBtnText.innerText = t.voiceBtnDefault;
    if (txtAiMeter) txtAiMeter.innerText = t.aiMeterTitle;
    if (lblPhoto) lblPhoto.innerText = t.lblPhoto;
    if (btnTakePhoto) btnTakePhoto.innerText = t.btnTakePhoto;
    if (btnPickGallery) btnPickGallery.innerText = t.btnPickGallery;
    if (lblLoc) lblLoc.innerText = t.lblLoc;
    if (btnLoc) btnLoc.innerText = t.btnLoc;
    if (lblOptional) lblOptional.innerText = t.lblOptional;
    if (rName) rName.placeholder = t.namePlaceholder;
    if (rPhone) rPhone.placeholder = t.phonePlaceholder;
    if (submitBtn && !submitBtn.disabled) submitBtn.innerText = t.submitBtn;
    if (trackerTitle) trackerTitle.innerText = t.trackerTitle;
    if (trackerSubtitle) trackerSubtitle.innerText = t.trackerSubtitle;
    if (trackStatusTitle) trackStatusTitle.innerText = t.trackStatusTitle;
    if (trackStatusSubtitle) trackStatusSubtitle.innerText = t.trackStatusSubtitle;
    if (btnSearchStatus) btnSearchStatus.innerText = t.btnSearchStatus;

    const catSelect = document.getElementById("category");
    if (catSelect) {
        const val = catSelect.value;
        catSelect.options[0].text = t.categories.placeholder;
        catSelect.options[1].text = t.categories.pothole;
        catSelect.options[2].text = t.categories.garbage;
        catSelect.options[3].text = t.categories.water;
        catSelect.options[4].text = t.categories.light;
        catSelect.options[5].text = t.categories.sewage;
        catSelect.options[6].text = t.categories.other;
        catSelect.value = val;
    }

    // Admin Page Elements
    const adminTitle = document.getElementById("admin-title");
    const adminSubtitle = document.getElementById("admin-subtitle");
    const linkPublic = document.getElementById("link-public-app");
    const lblGroup = document.getElementById("lbl-group");
    const lblSort = document.getElementById("lbl-sort");

    if (adminTitle) {
        adminTitle.innerHTML = `
            <svg width="26" height="26" viewBox="0 0 120 120">
                <rect width="120" height="120" rx="28" fill="#2563eb"/>
                <path d="M60 26C45.64 26 34 37.64 34 52C34 71.5 60 94 60 94C60 94 86 71.5 86 52C86 37.64 74.36 26
