// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQHnqCtpiNfLCxmVBMhPsFfnTvAe5obG8",
  authDomain: "smart-civic-reporter-73427.firebaseapp.com",
  projectId: "smart-civic-reporter-73427",
  storageBucket: "smart-civic-reporter-73427.firebasestorage.app",
  messagingSenderId: "244215583578",
  appId: "1:244215583578:web:350fa9987215f8eff31963"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let userLocation = {
    latitude: null,
    longitude: null
};

// Translations
const translations = {
    en: {
        title: "Smart Issue Reporter",
        subtitle: "Report local civic issues directly to authorities",
        lblCat: "Issue Category:",
        optDefault: "-- Select Issue Type --",
        optRoad: "Pothole / Damaged Road",
        optGarbage: "Garbage Dump",
        optWater: "Water Pipe Leakage",
        optLight: "Broken Street Light",
        optOther: "Other Issue",
        lblDesc: "Issue Description:",
        placeholderDesc: "Describe the issue in detail...",
        lblPhoto: "Upload / Click Photo:",
        lblLoc: "Location (GPS or Pick on Map):",
        btnLoc: "📍 Fetch Live Location",
        mapHint: "👆 Tap anywhere on map to pin problem spot",
        locDefault: "Location not captured yet.",
        locFetching: "Fetching GPS coordinates...",
        locSuccess: "Location Captured! ✅",
        locError: "Failed to get location. Please allow GPS or select on map.",
        btnSubmit: "Submit Report",
        submitting: "Submitting report...",
        submitSuccess: "Complaint reported successfully! 🎉"
    },
    hi: {
        title: "स्मार्ट समस्या निवारक",
        subtitle: "अपने आस-पास की समस्याओं को सीधे प्रशासन तक पहुँचाएं",
        lblCat: "समस्या का प्रकार:",
        optDefault: "-- समस्या का प्रकार चुनें --",
        optRoad: "टूटी सड़क / गड्ढा (Pothole)",
        optGarbage: "कचरे का ढेर (Garbage Dump)",
        optWater: "पानी का रिसाव (Water Leakage)",
        optLight: "खराब स्ट्रीट लाइट",
        optOther: "अन्य समस्या",
        lblDesc: "समस्या का विवरण:",
        placeholderDesc: "समस्या के बारे में विस्तार से लिखें...",
        lblPhoto: "फोटो खींचें / अपलोड करें:",
        lblLoc: "लोकेशन (GPS या मैप पर चुनें):",
        btnLoc: "📍 लाइव लोकेशन प्राप्त करें",
        mapHint: "👆 समस्या की जगह चुनने के लिए मैप पर टैप करें",
        locDefault: "लोकेशन अभी नहीं ली गई है।",
        locFetching: "लोकेशन ली जा रही है...",
        locSuccess: "लोकेशन दर्ज हो गई! ✅",
        locError: "लोकेशन नहीं मिल सकी। कृपया मैप पर जगह चुनें।",
        btnSubmit: "रिपोर्ट दर्ज करें",
        submitting: "रिपोर्ट दर्ज की जा रही है...",
        submitSuccess: "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है! 🎉"
    },
    mr: {
        title: "स्मार्ट तक्रार निवारक",
        subtitle: "आपल्या परिसरातील समस्या थेट प्रशासनापर्यंत पोहोचवा",
        lblCat: "समस्येचा प्रकार:",
        optDefault: "-- समस्येचा प्रकार निवडा --",
        optRoad: "खड्डे / खराब रस्ता (Pothole)",
        optGarbage: "कचऱ्याचे ढीग (Garbage)",
        optWater: "पाणी गळती (Water Leakage)",
        optLight: "बंद पथदिवा (Street Light)",
        optOther: "इतर समस्या",
        lblDesc: "समस्येचे वर्णन:",
        placeholderDesc: "समस्येबद्दल सविस्तर माहिती लिहा...",
        lblPhoto: "फोटो काढा / अपलोड करा:",
        lblLoc: "स्थान (GPS किंवा नकाशावर निवडा):",
        btnLoc: "📍 चालू स्थान मिळवा",
        mapHint: "👆 समस्या असलेली जागा निवडण्यासाठी नकाशावर टॅप करा",
        locDefault: "स्थान अद्याप नोंदवले नाही.",
        locFetching: "स्थान शोधत आहे...",
        locSuccess: "स्थान यशस्वीरित्या नोंदवले! ✅",
        locError: "स्थान मिळू शकले नाही. कृपया नकाशावर निवडा.",
        btnSubmit: "तक्रार नोंदवा",
        submitting: "तक्रार नोंदवली जात आहे...",
        submitSuccess: "आपली तक्रार यशस्वीरित्या नोंदवली गेली आहे! 🎉"
    }
};

// Map Setup
const map = L.map('map').setView([20.5937, 78.9629], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker = null;

function setPinOnMap(lat, lng) {
    userLocation.latitude = lat;
    userLocation.longitude = lng;

    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng]).addTo(map);
    }

    const selectedLang = document.getElementById("langSelect").value;
    const t = translations[selectedLang];
    const statusText = document.getElementById("locationStatus");
    statusText.innerText = `${t.locSuccess} (Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)})`;
    statusText.style.color = "#28a745";
}

map.on('click', function(e) {
    setPinOnMap(e.latlng.lat, e.latlng.lng);
});

// Language Function
function changeLanguage() {
    const selectedLang = document.getElementById("langSelect").value;
    const t = translations[selectedLang];

    document.getElementById("txt-title").innerText = t.title;
    document.getElementById("txt-subtitle").innerText = t.subtitle;
    document.getElementById("lbl-cat").innerText = t.lblCat;
    document.getElementById("opt-default").innerText = t.optDefault;
    document.getElementById("opt-road").innerText = t.optRoad;
    document.getElementById("opt-garbage").innerText = t.optGarbage;
    document.getElementById("opt-water").innerText = t.optWater;
    document.getElementById("opt-light").innerText = t.optLight;
    document.getElementById("opt-other").innerText = t.optOther;
    document.getElementById("lbl-desc").innerText = t.lblDesc;
    document.getElementById("description").placeholder = t.placeholderDesc;
    document.getElementById("lbl-photo").innerText = t.lblPhoto;
    document.getElementById("lbl-loc").innerText = t.lblLoc;
    document.getElementById("locBtn").innerText = t.btnLoc;
    document.getElementById("map-hint").innerText = t.mapHint;
    document.getElementById("btn-submit").innerText = t.btnSubmit;

    const locStatus = document.getElementById("locationStatus");
    if (!userLocation.latitude) {
        locStatus.innerText = t.locDefault;
    }
}

// GPS Location
function getLocation() {
    const statusText = document.getElementById("locationStatus");
    const selectedLang = document.getElementById("langSelect").value;
    const t = translations[selectedLang];

    if ("geolocation" in navigator) {
        statusText.innerText = t.locFetching;
        statusText.style.color = "#1a73e8";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 16);
                setPinOnMap(lat, lng);
            },
            () => {
                statusText.innerText = t.locError;
                statusText.style.color = "#dc3545";
            },
            { enableHighAccuracy: true }
        );
    }
}

// Convert image to string (Base64) for free cloud storage
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Form Submit Handler
document.getElementById("problemForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const selectedLang = document.getElementById("langSelect").value;
    const t = translations[selectedLang];

    if (!userLocation.latitude) {
        alert("Kripya GPS button dabayein ya map par jagah select karein!");
        return;
    }

    const submitBtn = document.getElementById("btn-submit");
    submitBtn.innerText = t.submitting;
    submitBtn.disabled = true;

    try {
        const category = document.getElementById("category").value;
        const description = document.getElementById("description").value;
        const photoFile = document.getElementById("photo").files[0];

        let photoBase64 = "";
        if (photoFile) {
            photoBase64 = await getBase64(photoFile);
        }

        // Firestore mein report save karna
        await db.collection("reports").add({
            category: category,
            description: description,
            photo: photoBase64,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            status: "Pending",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(t.submitSuccess);
        document.getElementById("problemForm").reset();
        userLocation.latitude = null;
        userLocation.longitude = null;
        document.getElementById("locationStatus").innerText = t.locDefault;
        if (marker) {
            map.removeLayer(marker);
            marker = null;
        }
    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        submitBtn.innerText = t.btnSubmit;
        submitBtn.disabled = false;
    }
});