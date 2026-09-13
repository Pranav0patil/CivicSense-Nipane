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

// Advanced NLP Keywords
const CRITICAL_KEYWORDS = ["accident", "danger", "spark", "fire", "wire", "burst", "overflow", "death", "deep", "emergency", "current", "hospital", "school", "खतरा", "दुर्घटना", "तार", "आग", "गंभीर", "विद्युत", "धोका", "अपघात", "शॉक", "गळती", "पाणी", "लाईट", "करंट"];
const MEDIUM_KEYWORDS = ["leak", "garbage", "smell", "block", "light", "pothole", "कचरा", "दुर्गंध", "खड्डा", "गंदगी", "बंद", "तुंबले", "रस्ता"];

// Multilingual Dictionary
const TRANSLATIONS = {
    en: {
        navHome: "Home",
        navReport: "Report",
        navTracker: "Live Tracker",
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
        lblPhoto: "Upload / Capture Image",
        lblLoc: "Location Tagging",
        btnLoc: "📍 Detect Live GPS Location",
        lblOptional: "Citizen Details (Optional)",
        namePlaceholder: "Your Name (Optional)",
        phonePlaceholder: "Mobile Number (Optional for WhatsApp updates)",
        submitBtn: "Submit to CivicSense Engine",
        trackerTitle: "Live Public Issue Tracker",
        trackerSubtitle: "Click on any marker to see status & AI priority.",
        adminTitle: "CivicSense-Nipane Grampanchayat Admin Portal",
        adminSubtitle: "Real-Time Citizen Grievance & AI Prioritization Console",
        openPublic: "← Open Public App",
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
            photo: "Photo",
            date: "Date & Time",
            desc: "Issue & Description",
            citizen: "Citizen Info",
            priority: "AI Urgency",
            cluster: "Geo-Cluster",
            status: "Status",
            action: "Action"
        },
        btnProg: "Progress",
        btnRes: "Resolve",
        btnDel: "Delete",
        anonymous: "Anonymous",
        noPhone: "No Phone",
        singleReport: "Single",
        clusterTag: "Nearby"
    },
    hi: {
        navHome: "होम",
        navReport: "शिकायत दर्ज करें",
        navTracker: "लाइव ट्रैकर",
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
        lblPhoto: "फोटो अपलोड या कैप्चर करें",
        lblLoc: "स्थान का चयन",
        btnLoc: "📍 लाइव जीपीएस स्थान चुनें",
        lblOptional: "नागरिक विवरण (ऐच्छिक)",
        namePlaceholder: "आपका नाम (ऐच्छिक)",
        phonePlaceholder: "मोबाइल नंबर (व्हाट्सएप अपडेट के लिए ऐच्छिक)",
        submitBtn: "सिविकसेंस प्रणाली में भेजें",
        trackerTitle: "सार्वजनिक लाइव समस्या ट्रैकर",
        trackerSubtitle: "समस्या की स्थिति व एआई प्राथमिकता देखने के लिए मार्कर पर क्लिक करें।",
        adminTitle: "सिविकसेंस-निपाणे ग्रामपंचायत एडमिन पोर्टल",
        adminSubtitle: "नागरिक शिकायत व एआई प्राथमिकता प्रबंधन प्रणाली",
        openPublic: "← पब्लिक ऐप खोलें",
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
            photo: "फोटो",
            date: "दिनांक व समय",
            desc: "समस्या व विवरण",
            citizen: "नागरिक विवरण",
            priority: "एआई गंभीरता",
            cluster: "क्लस्टर चेतावनी",
            status: "स्थिति",
            action: "कार्रवाई"
        },
        btnProg: "प्रगति में",
        btnRes: "हल किया",
        btnDel: "हटाएं",
        anonymous: "अज्ञात नागरिक",
        noPhone: "नंबर नहीं",
        singleReport: "एकल रिपोर्ट",
        clusterTag: "आसपास"
    },
    mr: {
        navHome: "मुख्यपृष्ठ",
        navReport: "तक्रार नोंदणी",
        navTracker: "थेट ट्रॅकर",
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
        lblPhoto: "फोटो अपलोड किंवा कॅमेरा वापरा",
        lblLoc: "स्थान निश्चिती",
        btnLoc: "📍 थेट जीपीएस स्थान निवडा",
        lblOptional: "नागरिकाची माहिती (ऐच्छिक)",
        namePlaceholder: "आपले नाव (ऐच्छिक)",
        phonePlaceholder: "मोबाईल नंबर (व्हॉट्सॲप अपडेटसाठी ऐच्छिक)",
        submitBtn: "सिव्हिकसेन्स प्रणालीमध्ये पाठवा",
        trackerTitle: "थेट नागरी समस्या ट्रॅकर",
        trackerSubtitle: "समस्येची स्थिती व एआय प्राधान्य पाहण्यासाठी मार्करवर क्लिक करा.",
        adminTitle: "सिव्हिकसेन्स-निपाणे ग्रामपंचायत ॲडमिन पोर्टल",
        adminSubtitle: "नागरी तक्रार व एआय प्राधान्य व्यवस्थापन प्रणाली",
        openPublic: "← पब्लिक ॲप उघडा",
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
            photo: "छायाचित्र",
            date: "दिनांक आणि वेळ",
            desc: "समस्या व तपशील",
            citizen: "नागरिकाची माहिती",
            priority: "एआय प्राधान्य",
            cluster: "क्लस्टर इशारा",
            status: "स्थिती",
            action: "कृती"
        },
        btnProg: "प्रगतीपथावर",
        btnRes: "निवारण झाले",
        btnDel: "हटवा",
        anonymous: "अनामिक नागरिक",
        noPhone: "नंबर नाही",
        singleReport: "एकच तक्रार",
        clusterTag: "जवळपास"
    }
};

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang];
    if (!t) return;

    // Sync selectors if both exist
    const pSel = document.getElementById("langSelect");
    const aSel = document.getElementById("adminLangSelect");
    if (pSel) pSel.value = lang;
    if (aSel) aSel.value = lang;

    // Public Page Elements
    const navHome = document.getElementById("nav-home");
    const navReport = document.getElementById("nav-report");
    const navTracker = document.getElementById("nav-tracker");
    if (navHome) navHome.innerText = t.navHome;
    if (navReport) navReport.innerText = t.navReport;
    if (navTracker) navTracker.innerText = t.navTracker;

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
    const lblLoc = document.getElementById("lbl-loc");
    const btnLoc = document.getElementById("btn-detect-loc");
    const lblOptional = document.getElementById("lbl-optional-title");
    const rName = document.getElementById("reporterName");
    const rPhone = document.getElementById("reporterPhone");
    const submitBtn = document.getElementById("submitBtn");
    const trackerTitle = document.getElementById("tracker-title");
    const trackerSubtitle = document.getElementById("tracker-subtitle");

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
    if (lblLoc) lblLoc.innerText = t.lblLoc;
    if (btnLoc) btnLoc.innerText = t.btnLoc;
    if (lblOptional) lblOptional.innerText = t.lblOptional;
    if (rName) rName.placeholder = t.namePlaceholder;
    if (rPhone) rPhone.placeholder = t.phonePlaceholder;
    if (submitBtn && !submitBtn.disabled) submitBtn.innerText = t.submitBtn;
    if (trackerTitle) trackerTitle.innerText = t.trackerTitle;
    if (trackerSubtitle) trackerSubtitle.innerText = t.trackerSubtitle;

    // Public Category Dropdown
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
    if (lblSort) lblSort.innerText = t.sortLabel;

    // Admin Sorter Dropdown Options
    const sortBySelect = document.getElementById("sortBySelect");
    if (sortBySelect) {
        const sortVal = sortBySelect.value;
        sortBySelect.options[0].text = t.sortOptions.newest;
        sortBySelect.options[1].text = t.sortOptions.oldest;
        sortBySelect.options[2].text = t.sortOptions.highPriority;
        sortBySelect.options[3].text = t.sortOptions.lowPriority;
        sortBySelect.value = sortVal;
    }

    // Admin Priority Filter Dropdown
    const pFilter = document.getElementById("priorityFilter");
    if (pFilter) {
        const filterVal = pFilter.value;
        pFilter.options[0].text = t.priorityFilterAll;
        pFilter.options[1].text = t.priorityFilterHigh;
        pFilter.options[2].text = t.priorityFilterMed;
        pFilter.options[3].text = t.priorityFilterLow;
        pFilter.value = filterVal;
    }

    // Table Column Headers
    const ths = t.tableHeaders;
    if (document.getElementById("th-photo")) document.getElementById("th-photo").innerText = ths.photo;
    if (document.getElementById("th-date")) document.getElementById("th-date").innerText = ths.date;
    if (document.getElementById("th-desc")) document.getElementById("th-desc").innerText = ths.desc;
    if (document.getElementById("th-citizen")) document.getElementById("th-citizen").innerText = ths.citizen;
    if (document.getElementById("th-priority")) document.getElementById("th-priority").innerText = ths.priority;
    if (document.getElementById("th-cluster")) document.getElementById("th-cluster").innerText = ths.cluster;
    if (document.getElementById("th-status")) document.getElementById("th-status").innerText = ths.status;
    if (document.getElementById("th-action")) document.getElementById("th-action").innerText = ths.action;

    // Re-render admin table for localized action buttons & labels
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

// 3. Multi-Factor AI Urgency Engine
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
    const photoEl = document.getElementById("photo");
    const badge = document.getElementById("aiPriorityBadge");
    const exp = document.getElementById("aiExplanation");

    if (!catEl || !descEl || !badge || !exp) return;

    const hasPhoto = photoEl && photoEl.files && photoEl.files.length > 0;
    const analysis = calculatePriorityScore(catEl.value, descEl.value, hasPhoto);
    
    badge.className = `p-badge ${analysis.badgeClass}`;
    badge.innerText = `${analysis.level} (Score: ${analysis.score})`;
    exp.innerText = analysis.explanation;
}

// Distance Formula
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

// 4. Image Compression
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

// 5. Submit Handler with Report Language Storage
const civicForm = document.getElementById('civicForm');
if (civicForm) {
    civicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
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
            const photoFile = document.getElementById('photo').files[0];
            const reporterName = document.getElementById('reporterName').value.trim() || "";
            const reporterPhone = document.getElementById('reporterPhone').value.trim() || "";
            
            const compressedBase64 = await compressPhoto(photoFile);
            const aiResult = calculatePriorityScore(cat, desc, true);

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
                reportLang: currentLang, // Saved for language-matched WhatsApp updates
                status: "Pending",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            const successMsg = currentLang === 'mr' 
                ? `तक्रार यशस्वीरित्या नोंदवली गेली!\nएआय प्राधान्य: ${aiResult.level}`
                : (currentLang === 'hi' 
                    ? `शिकायत सफलतापूर्वक दर्ज की गई!\nएआई प्राथमिकता: ${aiResult.level}`
                    : `Complaint lodged successfully!\nAI Priority: ${aiResult.level}`);
            
            alert(successMsg);
            civicForm.reset();
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

// 6. Real-Time Sync & Admin Sorter
db.collection("reports").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    globalReports = [];
    let total = 0, resolved = 0, critical = 0, medium = 0, low = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        globalReports.push(data);

        total++;
        if (data.status === "Resolved") resolved++;
        if (data.priorityLevel === "HIGH" || data.priorityLevel === "CRITICAL") critical++;
        else if (data.priorityLevel === "MEDIUM") medium++;
        else low++;
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

    const sortType = document.getElementById('sortBySelect') ? document.getElementById('sortBySelect').value : 'newest';
    const filter = document.getElementById('priorityFilter') ? document.getElementById('priorityFilter').value : 'All';

    let filtered = [...globalReports];

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

    renderAdminTable(filtered);
}

function renderAdminTable(reports) {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No matching issues found.</td></tr>`;
        return;
    }

    reports.forEach(r => {
        const badgeColor = (r.priorityLevel === 'HIGH' || r.priorityLevel === 'CRITICAL') ? 'p-high' : (r.priorityLevel === 'MEDIUM' ? 'p-med' : 'p-low');
        const clusterHtml = r.clusterCount > 1 
            ? `<span class="cluster-tag">⚠️ ${r.clusterCount} ${t.clusterTag}</span>` 
            : `<span style="color:#94a3b8; font-size:11px;">${t.singleReport}</span>`;
        
        let dateStr = "Recent";
        if (r.timestamp) {
            const d = r.timestamp.toDate();
            dateStr = `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }

        const citizenName = r.reporterName ? r.reporterName : t.anonymous;
        const citizenPhone = r.reporterPhone ? r.reporterPhone : t.noPhone;
        const citizenInfo = `<strong>${citizenName}</strong><br><small style="color:#64748b;">${citizenPhone}</small>`;

        const tr = document.createElement('tr');
        tr.className = "table-row-hover";
        tr.style.borderBottom = "1px solid #f1f5f9";
        
        tr.innerHTML = `
            <td style="padding: 10px;" onclick="openModal('${r.id}')"><img src="${r.photo}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" alt="Issue"/></td>
            <td style="padding: 10px; font-size: 12px; color: #475569;" onclick="openModal('${r.id}')">${dateStr}</td>
            <td style="padding: 10px;" onclick="openModal('${r.id}')"><strong>${r.category}</strong><br><small style="color:#64748b;">${(r.description || '').substring(0, 35)}...</small></td>
            <td style="padding: 10px;" onclick="openModal('${r.id}')">${citizenInfo}</td>
            <td style="padding: 10px;" onclick="openModal('${r.id}')"><span class="p-badge ${badgeColor}">${r.priorityLevel} (${r.priorityScore || 20})</span></td>
            <td style="padding: 10px;" onclick="openModal('${r.id}')">${clusterHtml}</td>
            <td style="padding: 10px;"><strong>${r.status}</strong></td>
            <td style="padding: 10px;">
                <button style="background:#0284c7; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom: 2px;" onclick="updateDocStatus('${r.id}', 'In Progress')">${t.btnProg}</button>
                <button style="background:#16a34a; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom: 2px;" onclick="updateDocStatus('${r.id}', 'Resolved')">${t.btnRes}</button>
                <button style="background:#ef4444; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;" onclick="deleteDocReport('${r.id}')">${t.btnDel}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Multilingual WhatsApp Notification on Status Update
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
                    messageBody = `नमस्कार ${citizenName}, आपण सिव्हिकसेन्स-निपाणे वर नोंदवलेली तक्रार "${report.category}" आता: ${st} झाली आहे. परिसराच्या स्वच्छतेसाठी व सुरक्षेसाठी सहकार्य केल्याबद्दल धन्यवाद! - ग्रामपंचायत निपाणे.`;
                } else if (lang === 'hi') {
                    const st = newStatus === 'Resolved' ? 'हल कर दी गई (Resolved)' : 'प्रगति पर है (In Progress)';
                    messageBody = `नमस्ते ${citizenName}, सिविकसेंस-निपाणे पर दर्ज की गई आपकी शिकायत "${report.category}" अब: ${st} हो चुकी है। ग्राम स्वच्छता और सुरक्षा में सहयोग के लिए धन्यवाद! - ग्रामपंचायत निपाणे।`;
                } else {
                    messageBody = `Hello ${citizenName}, your grievance regarding "${report.category}" reported at CivicSense-Nipane has been marked as: ${newStatus.toUpperCase()}. Thank you for helping keep our locality clean and safe! - Grampanchayat Nipane.`;
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

// 7. Modal & Image Lightbox Zoom Engine
let currentZoom = 1;

function openModal(id) {
    const r = globalReports.find(item => item.id === id);
    if (!r) return;

    let dateStr = "N/A";
    if (r.timestamp) {
        const d = r.timestamp.toDate();
        dateStr = `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN')}`;
    }

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

// Fullscreen Lightbox Zoom Controls
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

// Mouse Wheel Zoom Support inside Lightbox
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
    if (event.target === modal) {
        closeModal();
    }
};

function renderTrackerMarkers() {
    if (!trackerMap) return;
    globalReports.forEach(r => {
        if (r.latitude && r.longitude) {
            L.marker([r.latitude, r.longitude])
             .addTo(trackerMap)
             .bindPopup(`<b>${r.category}</b><br>Priority: ${r.priorityLevel}<br>Status: ${r.status}`);
        }
    });
}

window.onload = function() {
    initMaps();
    changeLanguage(currentLang);
};
