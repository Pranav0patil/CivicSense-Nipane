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
const CRITICAL_KEYWORDS = ["accident", "danger", "spark", "fire", "wire", "burst", "overflow", "death", "deep", "emergency", "current", "hospital", "school", "खतरा", "दुर्घटना", "तार", "आग", "गंभीर", "विद्युत", "धोका", "अपघात", "शॉक", "गळती"];
const MEDIUM_KEYWORDS = ["leak", "garbage", "smell", "block", "light", "pothole", "कचरा", "दुर्गंध", "खड्डा", "गंदगी", "बंद", "तुंबले"];

// Language Translation Dictionaries
const TRANSLATIONS = {
    en: {
        homeTitle: "Intelligent Civic Grievance System",
        homeSubtitle: "Zero-delay local reporting with automated AI severity scoring & geo-duplicate detection.",
        totalIssues: "Total Issues",
        resolvedIssues: "Resolved",
        criticalIssues: "Critical / High",
        reportNow: "📢 Report an Issue Now",
        formHeading: "Report Civic Issue",
        lblCat: "Issue Category",
        lblDesc: "Problem Description",
        lblPhoto: "Upload / Capture Image",
        btnLoc: "📍 Detect Live GPS Location",
        submitBtn: "Submit to CivicSense Engine",
        trackerTitle: "Live Public Issue Tracker",
        adminTitle: "CivicSense-Nipane Grampanchayat Admin Portal",
        adminSubtitle: "Real-Time Citizen Grievance & AI Prioritization Console"
    },
    hi: {
        homeTitle: "स्मार्ट नागरिक शिकायत निवारण प्रणाली",
        homeSubtitle: "स्वचालित एआई प्राथमिकता और जीपीएस मैपिंग के साथ त्वरित ग्राम शिकायत निवारण।",
        totalIssues: "कुल समस्याएं",
        resolvedIssues: "हल की गई",
        criticalIssues: "अति गंभीर",
        reportNow: "📢 समस्या दर्ज करें",
        formHeading: "समस्या दर्ज करें",
        lblCat: "समस्या का प्रकार",
        lblDesc: "समस्या का विवरण",
        lblPhoto: "फोटो अपलोड या कैप्चर करें",
        btnLoc: "📍 लाइव जीपीएस लोकेशन चुनें",
        submitBtn: "सिविकसेंस इंजन में जमा करें",
        trackerTitle: "सार्वजनिक लाइव ट्रैकर",
        adminTitle: "सिविकसेंस-निपाणे ग्रामपंचायत एडमिन पोर्टल",
        adminSubtitle: "नागरिक शिकायत और एआई प्राथमिकता प्रबंधन कंसोल"
    },
    mr: {
        homeTitle: "स्मार्ट नागरी तक्रार निवारण प्रणाली",
        homeSubtitle: "स्वयंचलित एआय प्राधान्य आणि जीपीएस मॅपिंगद्वारे थेट ग्राम तक्रार निवारण.",
        totalIssues: "एकूण तक्रारी",
        resolvedIssues: "निवारण झालेल्या",
        criticalIssues: "अति गंभीर",
        reportNow: "📢 तक्रार नोंदवा",
        formHeading: "नागरी समस्या नोंदवा",
        lblCat: "समस्येचा प्रकार",
        lblDesc: "समस्येचे सविस्तर वर्णन",
        lblPhoto: "फोटो अपलोड किंवा कॅमेरा वापरा",
        btnLoc: "📍 थेट जीपीएस लोकेशन निवडा",
        submitBtn: "सिव्हिकसेन्स प्रणालीमध्ये पाठवा",
        trackerTitle: "थेट नागरी ट्रॅकर नकाशा",
        adminTitle: "सिव्हिकसेन्स-निपाणे ग्रामपंचायत ॲडमिन पोर्टल",
        adminSubtitle: "नागरी तक्रार आणि एआय प्राधान्य व्यवस्थापन प्रणाली"
    }
};

function changeLanguage(lang) {
    currentLang = lang;
    const t = TRANSLATIONS[lang];
    if (!t) return;

    // Public Dashboard Translations
    const homeTitle = document.getElementById("home-title");
    const homeSubtitle = document.getElementById("home-subtitle");
    const txtTotal = document.getElementById("txt-stat-total");
    const txtResolved = document.getElementById("txt-stat-resolved");
    const txtCritical = document.getElementById("txt-stat-critical");
    const btnReport = document.getElementById("btn-report-now");
    const formHeading = document.getElementById("form-heading");
    const lblCat = document.getElementById("lbl-cat");
    const lblDesc = document.getElementById("lbl-desc");
    const lblPhoto = document.getElementById("lbl-photo");
    const btnLoc = document.getElementById("btn-detect-loc");
    const submitBtn = document.getElementById("submitBtn");
    const trackerTitle = document.getElementById("tracker-title");

    if (homeTitle) homeTitle.innerText = t.homeTitle;
    if (homeSubtitle) homeSubtitle.innerText = t.homeSubtitle;
    if (txtTotal) txtTotal.innerText = t.totalIssues;
    if (txtResolved) txtResolved.innerText = t.resolvedIssues;
    if (txtCritical) txtCritical.innerText = t.criticalIssues;
    if (btnReport) btnReport.innerText = t.reportNow;
    if (formHeading) formHeading.innerText = t.formHeading;
    if (lblCat) lblCat.innerText = t.lblCat;
    if (lblDesc) lblDesc.innerText = t.lblDesc;
    if (lblPhoto) lblPhoto.innerText = t.lblPhoto;
    if (btnLoc) btnLoc.innerText = t.btnLoc;
    if (submitBtn && submitBtn.innerText.indexOf("Analyzing") === -1) submitBtn.innerText = t.submitBtn;
    if (trackerTitle) trackerTitle.innerText = t.trackerTitle;

    // Admin Dashboard Translations
    const adminTitle = document.getElementById("admin-title");
    const adminSubtitle = document.getElementById("admin-subtitle");
    if (adminTitle) {
        adminTitle.innerHTML = `
            <svg width="26" height="26" viewBox="0 0 120 120">
                <rect width="120" height="120" rx="28" fill="#2563eb"/>
                <path d="M60 26C45.64 26 34 37.64 34 52C34 71.5 60 94 60 94C60 94 86 71.5 86 52C86 37.64 74.36 26 60 26Z" fill="#ffffff"/>
                <circle cx="60" cy="52" r="12" fill="#2563eb"/>
                <circle cx="60" cy="52" r="6" fill="#38bdf8"/>
            </svg> ${t.adminTitle}`;
    }
    if (adminSubtitle) adminSubtitle.innerText = t.adminSubtitle;
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

// 2. Map Configuration
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
        }, () => alert("Enable GPS permission or pin manually on map."));
    }
}

// 3. Multi-Factor AI Engine (Category + NLP + Image Metadata)
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
        reasons.push(`Emergency words found: "${criticalHits.join(', ')}"`);
    } else if (medHits.length > 0) {
        score += 15;
        reasons.push(`Issue words found: "${medHits.join(', ')}"`);
    }

    if (photoAttached) {
        score += 10;
        reasons.push("Photographic visual proof validated");
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

// Haversine Distance
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

// 5. Submit Handler
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
            const reporterName = document.getElementById('reporterName').value.trim() || "Anonymous Citizen";
            const reporterPhone = document.getElementById('reporterPhone').value.trim() || "Not Provided";
            
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
                status: "Pending",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`Complaint lodged successfully!\nAI Assigned Urgency: ${aiResult.level}`);
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

// 6. Real-Time Sync & Dashboard Render
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

// Windows 10 File Manager Style Sorting & Filter
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

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No matching issues found.</td></tr>`;
        return;
    }

    reports.forEach(r => {
        const badgeColor = (r.priorityLevel === 'HIGH' || r.priorityLevel === 'CRITICAL') ? 'p-high' : (r.priorityLevel === 'MEDIUM' ? 'p-med' : 'p-low');
        const clusterHtml = r.clusterCount > 1 ? `<span class="cluster-tag">⚠️ ${r.clusterCount} Nearby</span>` : `<span style="color:#94a3b8; font-size:11px;">Single</span>`;
        
        let dateStr = "Just now";
        if (r.timestamp) {
            const d = r.timestamp.toDate();
            dateStr = `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }

        const citizenInfo = `<strong>${r.reporterName || 'Anonymous'}</strong><br><small style="color:#64748b;">${r.reporterPhone || 'No Phone'}</small>`;

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
                <button style="background:#0284c7; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom: 2px;" onclick="updateDocStatus('${r.id}', 'In Progress')">Progress</button>
                <button style="background:#16a34a; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-bottom: 2px;" onclick="updateDocStatus('${r.id}', 'Resolved')">Resolve</button>
                <button style="background:#ef4444; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:11px;" onclick="deleteDocReport('${r.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Status Update & WhatsApp Notification Trigger
function updateDocStatus(id, newStatus) {
    const report = globalReports.find(r => r.id === id);
    db.collection("reports").doc(id).update({ status: newStatus }).then(() => {
        if (report && report.reporterPhone && report.reporterPhone !== "Not Provided") {
            const sendMsg = confirm(`Status updated to "${newStatus}". Would you like to notify ${report.reporterName} on WhatsApp?`);
            if (sendMsg) {
                let cleanPhone = report.reporterPhone.replace(/\D/g, '');
                if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
                
                const text = encodeURIComponent(`Hello ${report.reporterName}, your grievance regarding "${report.category}" reported at CivicSense-Nipane has been marked as: ${newStatus.toUpperCase()}. Thank you for helping keep our locality clean and safe!`);
                window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
            }
        }
    });
}

function deleteDocReport(id) {
    if (confirm("Are you sure you want to delete this grievance record?")) {
        db.collection("reports").doc(id).delete();
    }
}

// Modal Functions
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

window.onload = initMaps;
