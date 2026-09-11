// Firebase Init
const firebaseConfig = {
  apiKey: "AIzaSyCQHnqCtpiNfLCxmVBMhPsFfnTvAe5obG8",
  authDomain: "smart-civic-reporter-73427.firebaseapp.com",
  projectId: "smart-civic-reporter-73427",
  storageBucket: "smart-civic-reporter-73427.firebasestorage.app",
  messagingSenderId: "244215583578",
  appId: "1:244215583578:web:350fa9987215f8eff31963"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let userLocation = { latitude: null, longitude: null };
let reportMap, trackerMap;
let reportMarker = null;
let globalReports = [];

// Critical Keywords for Zero-Cost NLP Heuristics
const CRITICAL_KEYWORDS = ["accident", "danger", "spark", "fire", "wire", "burst", "overflow", "death", "deep", "emergency", "current", "hospital", "school", "खतरा", "दुर्घटना", "तार", "आग", "गंभीर"];
const MEDIUM_KEYWORDS = ["leak", "garbage", "smell", "block", "light", "pothole", "कचरा", "दुर्गंध", "खड्डा", "गळती"];

// 1. Navigation Controller
function switchTab(viewId) {
    document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    event?.target?.classList?.add('active');

    if (viewId === 'report') {
        setTimeout(() => { reportMap.invalidateSize(); }, 300);
    } else if (viewId === 'tracker') {
        setTimeout(() => { 
            trackerMap.invalidateSize();
            renderTrackerMarkers();
        }, 300);
    }
}

// 2. Maps Setup
function initMaps() {
    reportMap = L.map('reportMap').setView([20.8149, 75.3545], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(reportMap);

    reportMap.on('click', (e) => {
        setReportLocation(e.latlng.lat, e.latlng.lng);
    });

    trackerMap = L.map('trackerMap').setView([20.8149, 75.3545], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(trackerMap);
}

function setReportLocation(lat, lng) {
    userLocation.latitude = lat;
    userLocation.longitude = lng;
    if (reportMarker) reportMarker.setLatLng([lat, lng]);
    else reportMarker = L.marker([lat, lng]).addTo(reportMap);

    document.getElementById('locationFeedback').innerText = `Location Pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    document.getElementById('locationFeedback').style.color = "#16a34a";
    triggerAiAnalysis();
}

function fetchLiveLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            reportMap.setView([lat, lng], 16);
            setReportLocation(lat, lng);
        }, () => alert("Enable GPS permission or pin spot manually on map."));
    }
}

// 3. ZERO-COST AI PRIORITY & CLUSTERING LOGIC
function calculatePriorityScore(category, text) {
    let score = 20; // baseline
    let reasons = [];

    // Category weighting
    if (category === "Sewage Overflow" || category === "Street Light") {
        score += 25;
        reasons.push("Public health/safety category");
    } else if (category === "Road / Pothole") {
        score += 20;
        reasons.push("Traffic disruption category");
    }

    // Keyword NLP Scan
    const lowerText = (text || "").toLowerCase();
    let criticalHits = CRITICAL_KEYWORDS.filter(w => lowerText.includes(w));
    let medHits = MEDIUM_KEYWORDS.filter(w => lowerText.includes(w));

    if (criticalHits.length > 0) {
        score += 40;
        reasons.push(`Detected critical urgency words: "${criticalHits.join(', ')}"`);
    } else if (medHits.length > 0) {
        score += 15;
        reasons.push(`Detected issue words: "${medHits.join(', ')}"`);
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

    return { score, level, badgeClass, explanation: reasons.join(" • ") || "Normal routine grievance." };
}

function triggerAiAnalysis() {
    const cat = document.getElementById("category").value;
    const desc = document.getElementById("description").value;
    const badge = document.getElementById("aiPriorityBadge");
    const exp = document.getElementById("aiExplanation");

    const analysis = calculatePriorityScore(cat, desc);
    badge.className = `p-badge ${analysis.badgeClass}`;
    badge.innerText = `${analysis.level} (Score: ${analysis.score})`;
    exp.innerText = analysis.explanation;
}

// Haversine formula: calculate distance between 2 coordinates in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// 4. Image Compression (<100KB)
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

// 5. Submit Handler
document.getElementById('civicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userLocation.latitude) {
        alert("Please set issue location on the map.");
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "Analyzing & Syncing...";
    submitBtn.disabled = true;

    try {
        const cat = document.getElementById('category').value;
        const desc = document.getElementById('description').value;
        const photoFile = document.getElementById('photo').files[0];
        const compressedBase64 = await compressPhoto(photoFile);

        // Run AI Score
        const aiResult = calculatePriorityScore(cat, desc);

        // Check Duplicate Cluster within 100 meters
        let clusterCount = 1;
        globalReports.forEach(r => {
            if (r.category === cat && r.status !== 'Resolved') {
                const d = getDistanceMeters(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude);
                if (d <= 100) clusterCount++;
            }
        });

        // Boost priority if multiple reports from same 100m zone
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
            status: "Pending",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Complaint lodged successfully!\nAI Assigned Priority: ${aiResult.level}`);
        document.getElementById('civicForm').reset();
        userLocation = { latitude: null, longitude: null };
        if (reportMarker) reportMap.removeLayer(reportMarker);
        switchTab('home');
    } catch (err) {
        alert("Submission failed: " + err.message);
    } finally {
        submitBtn.innerText = "Submit to CivicSense Engine";
        submitBtn.disabled = false;
    }
});

// 6. Real-Time Data Sync & Dashboard Engine
db.collection("reports").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    globalReports = [];
    let total = 0, resolved = 0, critical = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        globalReports.push(data);

        total++;
        if (data.status === "Resolved") resolved++;
        if (data.priorityLevel === "HIGH") critical++;
    });

    // Update Counter Cards
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-resolved').innerText = resolved;
    document.getElementById('stat-critical').innerText = critical;

    renderAdminTable(globalReports);
});

function renderAdminTable(reports) {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = "";

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No issues logged yet.</td></tr>`;
        return;
    }

    reports.forEach(r => {
        const badgeColor = r.priorityLevel === 'HIGH' ? 'p-high' : (r.priorityLevel === 'MEDIUM' ? 'p-med' : 'p-low');
        const clusterHtml = r.clusterCount > 1 ? `<span class="cluster-tag">⚠️ ${r.clusterCount} Reports Nearby</span>` : `<span style="color:#94a3b8; font-size:11px;">Single Report</span>`;
        const mapLink = `https://www.google.com/maps?q=${r.latitude},${r.longitude}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${r.photo}" class="admin-thumb" alt="Issue"/></td>
            <td><strong>${r.category}</strong><br><small style="color:#64748b;">${r.description}</small></td>
            <td><span class="p-badge ${badgeColor}">${r.priorityLevel} (${r.priorityScore || 20})</span></td>
            <td>${clusterHtml}</td>
            <td><a href="${mapLink}" target="_blank" style="color:#2563eb; text-decoration:none; font-weight:600;">📍 Map Link</a></td>
            <td><strong>${r.status}</strong></td>
            <td>
                <button class="btn-status btn-prog" onclick="updateDocStatus('${r.id}', 'In Progress')">Progress</button>
                <button class="btn-status btn-res" onclick="updateDocStatus('${r.id}', 'Resolved')">Resolve</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateDocStatus(id, newStatus) {
    db.collection("reports").doc(id).update({ status: newStatus });
}

function filterAdminTable() {
    const filter = document.getElementById('priorityFilter').value;
    if (filter === "ALL") renderAdminTable(globalReports);
    else renderAdminTable(globalReports.filter(r => r.priorityLevel === filter));
}

function renderTrackerMarkers() {
    globalReports.forEach(r => {
        if (r.latitude && r.longitude) {
            L.marker([r.latitude, r.longitude])
             .addTo(trackerMap)
             .bindPopup(`<b>${r.category}</b><br>Priority: ${r.priorityLevel}<br>Status: ${r.status}`);
        }
    });
}

// Translations dictionary
function changeLanguage() {
    // Localization logic for EN/HI/MR
}

window.onload = initMaps;
