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

// Fixed Security PIN for Admin Console
const ADMIN_SECURITY_PIN = "2486";

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
        descPlaceholder: "Describe issue (e.g. broken wire sparking, accident hazard)...",
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
        descPlaceholder: "समस्या का विवरण लिखें (उदा. टूटा हुआ तार, दुर्घटना की संभावना)...",
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
        descPlaceholder: "समस्येचे वर्णन लिहा (उदा. तुटलेली विजेची वायर, अपघात धोका)...",
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
        anonymous: "अनामिक नागरिक",
        noPhone: "नंबर नाही",
        singleReport: "एकच तक्रार",
        clusterTag: "जवळपास",
        uniqueIssue: "एकमेव"
    }
};

// Admin Authentication Functions
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
                <path d="M60 26C45.64 26 34 37.64 34 52C34 71.5 60 94 60 94C60 94 86 71.5 86 52C86 37.64 74.36 26 60 26Z" fill="#ffffff"/>
                <circle cx="60" cy="52" r="12" fill="#2563eb"/>
                <circle cx="60" cy="52" r="6" fill="#38bdf8"/>
            </svg>
            ${t.adminTitle}
        `;
    }
    if (adminSubtitle) adminSubtitle.innerText = t.adminSubtitle;
    if (linkPublic) linkPublic.innerText = t.openPublic;
    if (lblGroup) lblGroup.innerText = t.viewModeLabel;
    if (lblSort) lblSort.innerText = t.sortLabel;

    const groupSelect = document.getElementById("groupBySelect");
    if (groupSelect) {
        const gVal = groupSelect.value;
        groupSelect.options[0].text = t.viewModes.none;
        groupSelect.options[1].text = t.viewModes.geo;
        groupSelect.options[2].text = t.viewModes.aiSame;
        groupSelect.value = gVal;
    }

    const sortBySelect = document.getElementById("sortBySelect");
    if (sortBySelect) {
        const sortVal = sortBySelect.value;
        sortBySelect.options[0].text = t.sortOptions.newest;
        sortBySelect.options[1].text = t.sortOptions.oldest;
        sortBySelect.options[2].text = t.sortOptions.highPriority;
        sortBySelect.options[3].text = t.sortOptions.lowPriority;
        sortBySelect.value = sortVal;
    }

    const pFilter = document.getElementById("priorityFilter");
    if (pFilter) {
        const filterVal = pFilter.value;
        pFilter.options[0].text = t.priorityFilterAll;
        pFilter.options[1].text = t.priorityFilterHigh;
        pFilter.options[2].text = t.priorityFilterMed;
        pFilter.options[3].text = t.priorityFilterLow;
        pFilter.value = filterVal;
    }

    const ths = t.tableHeaders;
    if (document.getElementById("th-id")) document.getElementById("th-id").innerText = ths.id;
    if (document.getElementById("th-photo")) document.getElementById("th-photo").innerText = ths.photo;
    if (document.getElementById("th-date")) document.getElementById("th-date").innerText = ths.date;
    if (document.getElementById("th-desc")) document.getElementById("th-desc").innerText = ths.desc;
    if (document.getElementById("th-citizen")) document.getElementById("th-citizen").innerText = ths.citizen;
    if (document.getElementById("th-priority")) document.getElementById("th-priority").innerText = ths.priority;
    if (document.getElementById("th-cluster")) document.getElementById("th-cluster").innerText = ths.cluster;
    if (document.getElementById("th-same")) document.getElementById("th-same").innerText = ths.same;
    if (document.getElementById("th-status")) document.getElementById("th-status").innerText = ths.status;
    if (document.getElementById("th-action")) document.getElementById("th-action").innerText = ths.action;

    applySortingAndFiltering();
}

// 1. Navigation
function switchTab(viewId) {
    document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add('active');
    const activeBtn = document.getElementById(`nav-${viewId}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (viewId === 'report' && reportMap) {
        setTimeout(() => { reportMap.invalidateSize(); }, 300);
    } else if (viewId === 'tracker' && trackerMap) {
        setTimeout(() => { 
            trackerMap.invalidateSize();
            renderTrackerMarkers();
        }, 300);
    }
}

// 2. Maps Setup
function initMaps() {
    const reportMapEl = document.getElementById('reportMap');
    const trackerMapEl = document.getElementById('trackerMap');

    if (reportMapEl) {
        reportMap = L.map('reportMap').setView([20.8149, 75.3545], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(reportMap);

        reportMap.on('click', (e) => {
            setReportLocation(e.latlng.lat, e.latlng.lng);
        });
    }

    if (trackerMapEl) {
        trackerMap = L.map('trackerMap').setView([20.8149, 75.3545], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(trackerMap);
    }
}

function setReportLocation(lat, lng) {
    userLocation.latitude = lat;
    userLocation.longitude = lng;
    if (reportMarker) {
        reportMarker.setLatLng([lat, lng]);
    } else if (reportMap) {
        reportMarker = L.marker([lat, lng]).addTo(reportMap);
    }

    const feedback = document.getElementById('locationFeedback');
    if (feedback) {
        feedback.innerText = `Location Pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        feedback.style.color = "#16a34a";
    }
    triggerAiAnalysis();
}

function fetchLiveLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (reportMap) reportMap.setView([lat, lng], 16);
            setReportLocation(lat, lng);
        }, () => alert("Enable GPS permission or pin spot manually on map."));
    }
}

// 3. Photo Selection Handler (Camera or Gallery)
function handlePhotoSelection(inputEl) {
    if (inputEl.files && inputEl.files[0]) {
        selectedPhotoFile = inputEl.files[0];
        
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photoPreviewThumb').src = e.target.result;
            document.getElementById('photoFeedbackBox').style.display = 'flex';
            document.getElementById('photoFileName').innerText = selectedPhotoFile.name || "Image ready to upload";
        };
        reader.readAsDataURL(selectedPhotoFile);

        triggerAiAnalysis();
    }
}

// 4. Multi-Factor AI Urgency Engine
function calculatePriorityScore(category, text, photoAttached) {
    let score = 20;
    let reasons = [];

    if (category === "Sewage Overflow" || category === "Street Light") {
        score += 25;
        reasons.push("Public health/electrical hazard category");
    } else if (category === "Road / Pothole") {
        score += 20;
        reasons.push("Traffic danger category");
    }

    const lowerText = (text || "").toLowerCase();
    let criticalHits = CRITICAL_KEYWORDS.filter(w => lowerText.includes(w));
    let medHits = MEDIUM_KEYWORDS.filter(w => lowerText.includes(w));

    if (criticalHits.length > 0) {
        score += 40;
        reasons.push(`Emergency words: "${criticalHits.slice(0, 3).join(', ')}"`);
    } else if (medHits.length > 0) {
        score += 15;
        reasons.push(`Issue words: "${medHits.slice(0, 3).join(', ')}"`);
    }

    if (photoAttached) {
        score += 10;
        reasons.push("Visual proof verified");
    }

    score = Math.min(score, 100);

    let level = "LOW";
    let badgeClass = "p-low";
    if (score >= 65) {
        level = "HIGH";
        badgeClass = "p-high";
    } else if (score >= 40) {
        level = "MEDIUM";
        badgeClass = "p-med";
    }

    return { score, level, badgeClass, explanation: reasons.join(" • ") || "Routine Grievance" };
}

function triggerAiAnalysis() {
    const catEl = document.getElementById("category");
    const descEl = document.getElementById("description");
    const badge = document.getElementById("aiPriorityBadge");
    const exp = document.getElementById("aiExplanation");

    if (!catEl || !descEl || !badge || !exp) return;

    const hasPhoto = selectedPhotoFile !== null;
    const analysis = calculatePriorityScore(catEl.value, descEl.value, hasPhoto);
    
    badge.className = `p-badge ${analysis.badgeClass}`;
    badge.innerText = `${analysis.level} (Score: ${analysis.score})`;
    exp.innerText = analysis.explanation;
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    const words1 = text1.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, '').split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, '').split(/\s+/).filter(w => w.length > 2);
    if (words1.length === 0 || words2.length === 0) return 0;

    const set1 = new Set(words1);
    const common = words2.filter(w => set1.has(w));
    return (2.0 * common.length) / (words1.length + words2.length);
}

// 5. Image Compression
function compressPhoto(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 750;
                const scale = maxWidth / img.width;
                canvas.width = (img.width > maxWidth) ? maxWidth : img.width;
                canvas.height = (img.width > maxWidth) ? (img.height * scale) : img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.65));
            };
        };
    });
}

// 6. Submit Handler
const civicForm = document.getElementById('civicForm');
if (civicForm) {
    civicForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedPhotoFile) {
            alert(currentLang === 'mr' ? "कृपया समस्येचा फोटो घ्या किंवा निवडा." : (currentLang === 'hi' ? "कृपया समस्या का फोटो लें या चुनें।" : "Please take or choose a photo of the issue."));
            return;
        }

        if (!userLocation.latitude) {
            alert(currentLang === 'mr' ? "कृपया नकाशावर समस्येचे ठिकाण निवडा." : (currentLang === 'hi' ? "कृपया मानचित्र पर समस्या का स्थान चुनें।" : "Please pin issue location on the map."));
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerText = "Analyzing & Syncing...";
        submitBtn.disabled = true;

        try {
            const cat = document.getElementById('category').value;
            const desc = document.getElementById('description').value;
            const reporterName = document.getElementById('reporterName').value.trim() || "";
            const reporterPhone = document.getElementById('reporterPhone').value.trim() || "";
            
            const compressedBase64 = await compressPhoto(selectedPhotoFile);
            const aiResult = calculatePriorityScore(cat, desc, true);
            const customReportId = generateReportId();

            let clusterCount = 1;
            globalReports.forEach(r => {
                if (r.category === cat && r.status !== 'Resolved') {
                    const d = getDistanceMeters(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude);
                    if (d <= 100) clusterCount++;
                }
            });

            if (clusterCount > 1) {
                aiResult.score = Math.min(aiResult.score + 25, 100);
                if (aiResult.score >= 60) aiResult.level = "HIGH";
            }

            await db.collection("reports").add({
                reportId: customReportId,
                category: cat,
                description: desc,
                photo: compressedBase64,
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                priorityScore: aiResult.score,
                priorityLevel: aiResult.level,
                clusterCount: clusterCount,
                reporterName: reporterName,
                reporterPhone: reporterPhone,
                reportLang: currentLang,
                status: "Pending",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            const successMsg = currentLang === 'mr' 
                ? `तक्रार यशस्वीरित्या नोंदवली गेली!\n\nतुमचा रिपोर्ट आयडी: ${customReportId}\n(तक्रारीची स्थिती तपासण्यासाठी हा आयडी जपून ठेवा)\nएआय प्राधान्य: ${aiResult.level}`
                : (currentLang === 'hi' 
                    ? `शिकायत सफलतापूर्वक दर्ज की गई!\n\nआपकी रिपोर्ट आईडी: ${customReportId}\n(स्थिति जांचने के लिए इस आईडी को सुरक्षित रखें)\nएआई प्राथमिकता: ${aiResult.level}`
                    : `Complaint lodged successfully!\n\nYour Report ID: ${customReportId}\n(Save this ID to track your grievance status)\nAI Assigned Urgency: ${aiResult.level}`);
            
            alert(successMsg);
            civicForm.reset();
            selectedPhotoFile = null;
            document.getElementById('photoFeedbackBox').style.display = 'none';
            userLocation = { latitude: null, longitude: null };
            if (reportMarker && reportMap) reportMap.removeLayer(reportMarker);
            switchTab('home');
        } catch (err) {
            alert("Submission failed: " + err.message);
        } finally {
            submitBtn.innerText = TRANSLATIONS[currentLang].submitBtn;
            submitBtn.disabled = false;
        }
    });
}

// 7. Public Grievance Status Tracker
function trackCitizenReport() {
    const input = document.getElementById("searchReportIdInput").value.trim().toUpperCase();
    const resultCard = document.getElementById("statusResultCard");
    if (!input) {
        alert("Please enter a valid Report ID.");
        return;
    }

    const matched = globalReports.find(r => (r.reportId || '').toUpperCase() === input);

    if (matched) {
        resultCard.style.display = "block";
        document.getElementById("resReportId").innerText = matched.reportId;
        
        const badge = document.getElementById("resStatusBadge");
        badge.innerText = matched.status;
        if (matched.status === 'Resolved') {
            badge.className = "p-badge p-low";
        } else if (matched.status === 'In Progress') {
            badge.className = "p-badge p-med";
        } else {
            badge.className = "p-badge p-high";
        }

        document.getElementById("resCategory").innerText = matched.category;
        
        let dateStr = "Recent";
        if (matched.timestamp) {
            const d = matched.timestamp.toDate();
            dateStr = `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN')}`;
        }
        document.getElementById("resDate").innerText = dateStr;
        document.getElementById("resPriority").innerText = `${matched.priorityLevel} (${matched.priorityScore || 20})`;
        document.getElementById("resDesc").innerText = matched.description || "No description.";
    } else {
        resultCard.style.display = "none";
        alert("No grievance report found matching this ID. Please check and try again.");
    }
}

// 8. Real-Time Sync & Dynamic Linking
db.collection("reports").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    globalReports = [];
    let total = 0, resolved = 0, critical = 0, medium = 0, low = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;

        // Strictly enforce 3 letters + 4 pure digits (NIP-XXXX)
        if (!data.reportId || !/^NIP-\d{4}$/.test(data.reportId)) {
            let hash = 0;
            for (let i = 0; i < data.id.length; i++) {
                hash = (hash * 31 + data.id.charCodeAt(i)) % 9000;
            }
            data.reportId = `NIP-${1000 + Math.abs(hash)}`;
        }

        globalReports.push(data);

        total++;
        if (data.status === "Resolved") resolved++;
        if (data.priorityLevel === "HIGH" || data.priorityLevel === "CRITICAL") critical++;
        else if (data.priorityLevel === "MEDIUM") medium++;
        else low++;
    });

    // Dynamic Calculation of Cluster Lists and Same Problem Lists
    globalReports.forEach((r, idx) => {
        let nearbyList = [];
        let sameList = [];

        globalReports.forEach((other, oIdx) => {
            if (idx !== oIdx) {
                // Geo-Distance < 100m
                if (r.latitude && r.longitude && other.latitude && other.longitude) {
                    const dist = getDistanceMeters(r.latitude, r.longitude, other.latitude, other.longitude);
                    if (dist <= 100) {
                        nearbyList.push(other);
                    }
                }

                // Similar Issue
                if (r.category === other.category) {
                    const sim = calculateSimilarity(r.description, other.description);
                    if (sim >= 0.35 || (r.description && other.description && r.description.trim().toLowerCase() === other.description.trim().toLowerCase())) {
                        sameList.push(other);
                    }
                }
            }
        });

        r.nearbyReports = nearbyList;
        r.sameReports = sameList;
        r.liveNearbyCount = nearbyList.length + 1;
        r.liveSameCount = sameList.length + 1;
    });

    const statTotal = document.getElementById('stat-total');
    const statResolved = document.getElementById('stat-resolved');
    const statCritical = document.getElementById('stat-critical');
    if (statTotal) statTotal.innerText = total;
    if (statResolved) statResolved.innerText = resolved;
    if (statCritical) statCritical.innerText = critical;

    const bUrgent = document.getElementById('badgeUrgent');
    const bMedium = document.getElementById('badgeMedium');
    const bLow = document.getElementById('badgeLow');
    if (bUrgent) bUrgent.innerText = `🔴 High: ${critical}`;
    if (bMedium) bMedium.innerText = `🟡 Medium: ${medium}`;
    if (bLow) bLow.innerText = `🟢 Low: ${low}`;

    applySortingAndFiltering();

    if (trackerMap) {
        renderTrackerMarkers();
    }
});

function applySortingAndFiltering() {
    if (!document.getElementById('adminTableBody')) return;

    const groupBy = document.getElementById('groupBySelect') ? document.getElementById('groupBySelect').value : 'none';
    const sortType = document.getElementById('sortBySelect') ? document.getElementById('sortBySelect').value : 'newest';
    const filter = document.getElementById('priorityFilter') ? document.getElementById('priorityFilter').value : 'All';
    const searchKeyword = document.getElementById('adminSearchInput') ? document.getElementById('adminSearchInput').value.trim().toLowerCase() : '';

    let filtered = [...globalReports];

    if (searchKeyword) {
        filtered = filtered.filter(r => 
            (r.reportId && r.reportId.toLowerCase().includes(searchKeyword)) ||
            (r.category && r.category.toLowerCase().includes(searchKeyword)) ||
            (r.description && r.description.toLowerCase().includes(searchKeyword)) ||
            (r.reporterName && r.reporterName.toLowerCase().includes(searchKeyword))
        );
    }

    if (filter !== "All") {
        filtered = filtered.filter(r => r.priorityLevel === filter);
    }

    filtered.sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
        const scoreA = a.priorityScore || 20;
        const scoreB = b.priorityScore || 20;

        if (sortType === 'newest') return timeB - timeA;
        if (sortType === 'oldest') return timeA - timeB;
        if (sortType === 'highPriority') return scoreB - scoreA;
        if (sortType === 'lowPriority') return scoreA - scoreB;
        return 0;
    });

    renderAdminTable(filtered, groupBy);
}

function renderAdminTable(reports, groupBy = 'none') {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 20px; color: #64748b;">No matching issues found.</td></tr>`;
        return;
    }

    function buildRowHtml(r) {
        const badgeColor = (r.priorityLevel === 'HIGH' || r.priorityLevel === 'CRITICAL') ? 'p-high' : (r.priorityLevel === 'MEDIUM' ? 'p-med' : 'p-low');
        
        const countGeo = r.liveNearbyCount || 1;
        const clusterHtml = countGeo > 1 
            ? `<span class="cluster-tag clickable-badge" title="Click to view related reports" onclick="event.stopPropagation(); openClusterListModal('${r.id}', 'geo')">⚠️ ${countGeo} ${t.clusterTag}</span>` 
            : `<span style="color:#94a3b8; font-size:11px;">${t.singleReport}</span>`;

        const countSame = r.liveSameCount || 1;
        const sameHtml = countSame > 1 
            ? `<span class="ai-same-tag clickable-badge" title="Click to view identical reports" onclick="event.stopPropagation(); openClusterListModal('${r.id}', 'same')">🔁 ${countSame} Same</span>` 
            : `<span style="color:#94a3b8; font-size:11px;">${t.uniqueIssue}</span>`;
        
        let dateStr = "Recent";
        if (r.timestamp) {
            const d = r.timestamp.toDate();
            dateStr = `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }

        const citizenName = r.reporterName ? r.reporterName : t.anonymous;
        const citizenPhone = r.reporterPhone ? r.reporterPhone : t.noPhone;
        const citizenInfo = `<strong>${citizenName}</strong><br><small style="color:#64748b;">${citizenPhone}</small>`;

        return `
            <tr class="table-row-hover" style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px;" onclick="openModal('${r.id}')"><span class="id-badge">${r.reportId}</span></td>
                <td style="padding: 10px;" onclick="openModal('${r.id}')"><img src="${r.photo}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;" alt="Issue"/></td>
                <td style="padding: 10px; font-size: 12px; color: #475569;" onclick="openModal('${r.id}')">${dateStr}</td>
                <td style="padding: 10px;" onclick="openModal('${r.id}')"><strong>${r.category}</strong><br><small style="color:#64748b;">${(r.description || '').substring(0, 35)}...</small></td>
                <td style="padding: 10px;" onclick="openModal('${r.id}')">${citizenInfo}</td>
                <td style="padding: 10px;" onclick="openModal('${r.id}')"><span class="p-badge ${badgeColor}">${r.priorityLevel} (${r.priorityScore || 20})</span></td>
                <td style="padding: 10px;">${clusterHtml}</td>
                <td style="padding: 10px;">${sameHtml}</td>
                <td style="padding: 10px;"><strong>${r.status}</strong></td>
                <td style="padding: 10px;">
                    <button style="background:#0284c7; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom: 2px;" onclick="updateDocStatus('${r.id}', 'In Progress')">${t.btnProg}</button>
                    <button style="background:#16a34a; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom: 2px;" onclick="updateDocStatus('${r.id}', 'Resolved')">${t.btnRes}</button>
                    <button style="background:#ef4444; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;" onclick="deleteDocReport('${r.id}')">${t.btnDel}</button>
                </td>
            </tr>
        `;
    }

    if (groupBy === 'none') {
        tbody.innerHTML = reports.map(buildRowHtml).join('');
    } else if (groupBy === 'geo') {
        const groups = {};
        reports.forEach(r => {
            const key = (r.liveNearbyCount > 1) ? `📍 100m Cluster Zone (${r.liveNearbyCount} Reports Linked)` : `📍 Isolated / Single Reports`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });

        let fullHtml = "";
        for (const [groupName, items] of Object.entries(groups)) {
            fullHtml += `<tr><td colspan="10" class="group-header-row">${groupName}</td></tr>`;
            fullHtml += items.map(buildRowHtml).join('');
        }
        tbody.innerHTML = fullHtml;
    } else if (groupBy === 'aiSame') {
        const groups = {};
        reports.forEach(r => {
            const key = (r.liveSameCount > 1) ? `🤖 AI Matched Group: "${r.category}" (${r.liveSameCount} Identical Reports)` : `🤖 Unique Individual Reports`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });

        let fullHtml = "";
        for (const [groupName, items] of Object.entries(groups)) {
            fullHtml += `<tr><td colspan="10" class="group-header-row" style="background:#f3e8ff; color:#581c87;">${groupName}</td></tr>`;
            fullHtml += items.map(buildRowHtml).join('');
        }
        tbody.innerHTML = fullHtml;
    }
}

// Cluster Inspector Modal
function openClusterListModal(reportDocId, mode) {
    const parentReport = globalReports.find(r => r.id === reportDocId);
    if (!parentReport) return;

    const listContainer = document.getElementById('clusterModalList');
    const title = document.getElementById('clusterModalTitle');
    const subtitle = document.getElementById('clusterModalSubtitle');
    listContainer.innerHTML = "";

    const related = mode === 'geo' ? parentReport.nearbyReports : parentReport.sameReports;

    if (mode === 'geo') {
        title.innerText = `📍 Nearby 100m Cluster (${related.length + 1} Reports)`;
        subtitle.innerText = `Reports filed within 100m of issue #${parentReport.reportId}:`;
    } else {
        title.innerText = `🤖 AI Similar Problems (${related.length + 1} Reports)`;
        subtitle.innerText = `Issues matching descriptions with issue #${parentReport.reportId}:`;
    }

    const allLinked = [parentReport, ...related];

    allLinked.forEach((item) => {
        let dateStr = "Recent";
        if (item.timestamp) {
            const d = item.timestamp.toDate();
            dateStr = `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }

        const isRoot = item.id === parentReport.id;
        const card = document.createElement('div');
        card.style.cssText = `display: flex; gap: 12px; align-items: center; background: ${isRoot ? '#eff6ff' : '#f8fafc'}; border: 1px solid ${isRoot ? '#93c5fd' : '#e2e8f0'}; padding: 10px; border-radius: 8px; cursor: pointer;`;
        card.onclick = () => {
            closeClusterModal();
            openModal(item.id);
        };

        card.innerHTML = `
            <img src="${item.photo}" style="width: 45px; height: 45px; border-radius: 6px; object-fit: cover;" alt="issue">
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="id-badge">${item.reportId}</span>
                    <span style="font-size: 11px; font-weight: bold; color: ${item.status === 'Resolved' ? '#16a34a' : '#2563eb'};">${item.status}</span>
                </div>
                <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${item.category} ${isRoot ? '<small style="color:#2563eb;">(Current)</small>' : ''}</div>
                <div style="font-size: 11px; color: #64748b;">${(item.description || '').substring(0, 45)}... • ${dateStr}</div>
            </div>
        `;
        listContainer.appendChild(card);
    });

    document.getElementById('clusterModal').style.display = "block";
}

function closeClusterModal() {
    document.getElementById('clusterModal').style.display = "none";
}

// WhatsApp Updates
function updateDocStatus(id, newStatus) {
    const report = globalReports.find(r => r.id === id);
    db.collection("reports").doc(id).update({ status: newStatus }).then(() => {
        if (report && report.reporterPhone && report.reporterPhone.trim() !== "") {
            const lang = report.reportLang || currentLang || 'en';
            
            const promptMsg = lang === 'mr' 
                ? `स्थिती "${newStatus}" अशी बदलली आहे. ${report.reporterName || 'नागरिकाला'} व्हॉट्सॲपवर संदेश पाठवायचा आहे का?`
                : (lang === 'hi' 
                    ? `स्थिति "${newStatus}" कर दी गई है। क्या आप ${report.reporterName || 'नागरिक'} को व्हाट्सएप पर संदेश भेजना चाहते हैं?`
                    : `Status updated to "${newStatus}". Send WhatsApp update to ${report.reporterName || 'citizen'}?`);

            const sendMsg = confirm(promptMsg);
            if (sendMsg) {
                let cleanPhone = report.reporterPhone.replace(/\D/g, '');
                if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
                
                let messageBody = "";
                const citizenName = report.reporterName || (lang === 'mr' ? 'नागरिक' : (lang === 'hi' ? 'नागरिक' : 'Citizen'));
                
                if (lang === 'mr') {
                    const st = newStatus === 'Resolved' ? 'निवारण झाले (Resolved)' : 'प्रगतीपथावर (In Progress)';
                    messageBody = `नमस्कार ${citizenName}, आपण नोंदवलेली तक्रार [ID: ${report.reportId}] "${report.category}" आता: ${st} झाली आहे. परिसराच्या स्वच्छतेसाठी व सुरक्षेसाठी सहकार्य केल्याबद्दल धन्यवाद! - ग्रामपंचायत निपाणे.`;
                } else if (lang === 'hi') {
                    const st = newStatus === 'Resolved' ? 'हल कर दी गई (Resolved)' : 'प्रगति पर है (In Progress)';
                    messageBody = `नमस्ते ${citizenName}, आपकी शिकायत [ID: ${report.reportId}] "${report.category}" अब: ${st} हो चुकी है। ग्राम स्वच्छता और सुरक्षा में सहयोग के लिए धन्यवाद! - ग्रामपंचायत निपाणे।`;
                } else {
                    messageBody = `Hello ${citizenName}, your grievance [ID: ${report.reportId}] regarding "${report.category}" has been marked as: ${newStatus.toUpperCase()}. Thank you for helping keep our locality clean and safe! - Grampanchayat Nipane.`;
                }

                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageBody)}`, '_blank');
            }
        }
    });
}

function deleteDocReport(id) {
    if (confirm("Are you sure you want to delete this grievance record?")) {
        db.collection("reports").doc(id).delete();
    }
}

// Modal & Lightbox
let currentZoom = 1;

function openModal(id) {
    const r = globalReports.find(item => item.id === id);
    if (!r) return;

    let dateStr = "N/A";
    if (r.timestamp) {
        const d = r.timestamp.toDate();
        dateStr = `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN')}`;
    }

    const modalIdBadge = document.getElementById('modalReportIdBadge');
    if (modalIdBadge) modalIdBadge.innerText = r.reportId || 'NIP-0000';

    document.getElementById('modalCategory').innerText = `${r.category} (${r.status})`;
    document.getElementById('modalImg').src = r.photo;
    document.getElementById('modalDateTime').innerText = dateStr;
    document.getElementById('modalPriority').innerText = `${r.priorityLevel} (Score: ${r.priorityScore || 20})`;
    document.getElementById('modalReporter').innerText = `${r.reporterName || 'Anonymous'} (Phone: ${r.reporterPhone || 'Not Provided'})`;
    document.getElementById('modalDesc').innerText = r.description || "No description provided.";
    document.getElementById('modalMapLink').href = `https://www.google.com/maps?q=${r.latitude},${r.longitude}`;

    document.getElementById('detailModal').style.display = "block";
}

function closeModal() {
    document.getElementById('detailModal').style.display = "none";
}

function openLightbox() {
    const mainImg = document.getElementById('modalImg');
    const lbImg = document.getElementById('lightboxImage');
    if (!mainImg || !lbImg) return;

    lbImg.src = mainImg.src;
    currentZoom = 1;
    lbImg.style.transform = `scale(1)`;
    document.getElementById('lightboxOverlay').style.display = 'flex';
}

function closeLightbox() {
    document.getElementById('lightboxOverlay').style.display = 'none';
}

function closeLightboxOnBackdrop(e) {
    if (e.target.id === 'lightboxOverlay') {
        closeLightbox();
    }
}

function adjustZoom(delta) {
    const lbImg = document.getElementById('lightboxImage');
    currentZoom = Math.min(Math.max(0.5, currentZoom + delta), 4.0);
    lbImg.style.transform = `scale(${currentZoom})`;
}

function resetZoom() {
    currentZoom = 1;
    const lbImg = document.getElementById('lightboxImage');
    if (lbImg) lbImg.style.transform = `scale(1)`;
}

window.addEventListener('wheel', function(e) {
    const lb = document.getElementById('lightboxOverlay');
    if (lb && lb.style.display === 'flex') {
        e.preventDefault();
        if (e.deltaY < 0) adjustZoom(0.15);
        else adjustZoom(-0.15);
    }
}, { passive: false });

window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    const clusterModal = document.getElementById('clusterModal');
    if (event.target === modal) closeModal();
    if (event.target === clusterModal) closeClusterModal();
};

function renderTrackerMarkers() {
    if (!trackerMap) return;
    globalReports.forEach(r => {
        if (r.latitude && r.longitude) {
            L.marker([r.latitude, r.longitude])
             .addTo(trackerMap)
             .bindPopup(`<b>#${r.reportId} - ${r.category}</b><br>Priority: ${r.priorityLevel}<br>Status: ${r.status}`);
        }
    });
}

window.onload = function() {
    checkAdminAuth();
    initMaps();
    changeLanguage(currentLang);
};
