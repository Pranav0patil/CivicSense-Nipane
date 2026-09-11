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

// 1. Navigation Controller (Public App)
function switchTab(viewId) {
    document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add('active');
    event?.target?.classList?.add('active');

    if (viewId === 'report' && reportMap) {
        setTimeout(() => { reportMap.invalidateSize(); }, 300);
    } else if (viewId === 'tracker' && trackerMap) {
        setTimeout(() => { 
            trackerMap.invalidateSize();
            renderTrackerMarkers();
        }, 300);
    }
}

// 2. Maps Setup (Only on Public Page)
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

// 3. ZERO-COST AI PRIORITY & CLUSTERING LOGIC
function calculatePriorityScore(category, text) {
    let score = 20;
    let reasons = [];

    if (category === "Sewage Overflow" || category === "Street Light") {
        score += 25;
        reasons.push("Public health/safety category");
    } else if (category === "Road / Pothole") {
        score += 20;
        reasons.push("Traffic disruption category");
    }

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
    const catEl = document.getElementById("category");
    const descEl = document.getElementById("description");
    const badge = document.getElementById("aiPriorityBadge");
    const exp = document.getElementById("aiExplanation");

    if (!catEl || !descEl || !badge || !exp) return;

    const analysis = calculatePriorityScore(catEl.value, descEl.value);
    badge.className = `p-badge ${analysis.badgeClass}`;
    badge.innerText = `${analysis.level} (Score: ${analysis.score})`;
    exp.innerText = analysis.explanation;
}

// Haversine formula
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

// 5. Submit Handler (Safe Check for Public Page)
const civicForm = document.getElementById('civicForm');
if (civicForm) {
    civicForm.addEventListener('submit', async (e) => {
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

            const aiResult = calculatePriorityScore(cat, desc);

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
                status: "Pending",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`Complaint lodged successfully!\nAI Assigned Priority: ${aiResult.level}`);
            civicForm.reset();
            userLocation = { latitude: null, longitude: null };
            if (reportMarker && reportMap) reportMap.removeLayer(reportMarker);
            switchTab('home');
        } catch (err) {
            alert("Submission failed: " + err.message);
        } finally {
            submitBtn.innerText = "Submit to CivicSense Engine";
            submitBtn.disabled = false;
        }
    });
}

// 6. Real-Time Data Sync & Dashboard Engine
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

    // Public Home Stats Safe Update
    const statTotal = document.getElementById('stat-total');
    const statResolved = document.getElementById('stat-resolved');
    const statCritical = document.getElementById('stat-critical');
    if (statTotal) statTotal.innerText = total;
    if (statResolved) statResolved.innerText = resolved;
    if (statCritical) statCritical.innerText = critical;

    // Admin Badges Safe Update
    const bUrgent = document.getElementById('badgeUrgent');
    const bMedium = document.getElementById('badgeMedium');
    const bLow = document.getElementById('badgeLow');
    if (bUrgent) bUrgent.innerText = `🔴 High Urgency: ${critical}`;
    if (bMedium) bMedium.innerText = `🟡 Medium: ${medium}`;
    if (bLow) bLow.innerText = `🟢 Low: ${low}`;

    // Render Views
    if (document.getElementById('adminTableBody')) {
        renderAdminTable(globalReports);
    }
    if (trackerMap) {
        renderTrackerMarkers();
    }
});

function renderAdminTable(reports) {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">No issues logged yet.</td></tr>`;
        return;
    }

    reports.forEach(r => {
        const badgeColor = (r.priorityLevel === 'HIGH' || r.priorityLevel === 'CRITICAL') ? 'p-high' : (r.priorityLevel === 'MEDIUM' ? 'p-med' : 'p-low');
        const clusterHtml = r.clusterCount > 1 ? `<span class="cluster-tag">⚠️ ${r.clusterCount} Reports Nearby</span>` : `<span style="color:#94a3b8; font-size:11px;">Single Report</span>`;
        const mapLink = `https://www.google.com/maps?q=${r.latitude},${r.longitude}`;

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #f1f5f9";
        tr.innerHTML = `
            <td style="padding: 10px;"><img src="${r.photo}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" alt="Issue"/></td>
            <td style="padding: 10px;"><strong>${r.category}</strong><br><small style="color:#64748b;">${r.description || ''}</small></td>
            <td style="padding: 10px;"><span class="p-badge ${badgeColor}">${r.priorityLevel} (${r.priorityScore || 20})</span></td>
            <td style="padding: 10px;">${clusterHtml}</td>
            <td style="padding: 10px;"><a href="${mapLink}" target="_blank" style="color:#2563eb; text-decoration:none; font-weight:600;">📍 Open Map</a></td>
            <td style="padding: 10px;"><strong>${r.status}</strong></td>
            <td style="padding: 10px;">
                <button style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:4px;" onclick="updateDocStatus('${r.id}', 'In Progress')">Progress</button>
                <button style="background:#16a34a; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; margin-right:4px;" onclick="updateDocStatus('${r.id}', 'Resolved')">Resolve</button>
                <button style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;" onclick="deleteDocReport('${r.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateDocStatus(id, newStatus) {
    db.collection("reports").doc(id).update({ status: newStatus });
}

function deleteDocReport(id) {
    if (confirm("Are you sure you want to delete this grievance report?")) {
        db.collection("reports").doc(id).delete();
    }
}

function filterAdminTable() {
    const filterEl = document.getElementById('priorityFilter');
    if (!filterEl) return;
    const filter = filterEl.value;
    if (filter === "All") renderAdminTable(globalReports);
    else renderAdminTable(globalReports.filter(r => r.priorityLevel === filter));
}

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

function changeLanguage() {
    // Multi-language switch handler
}

window.onload = initMaps;
