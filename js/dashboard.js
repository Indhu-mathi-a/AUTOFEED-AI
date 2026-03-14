/**
 * AutoFeed AI – Results Dashboard Logic
 * Fetches all responses for a form, aggregates them, and renders charts
 */
import { db } from './firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { analyzeConsensus } from './analytics.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('fid');
    const loadingView = document.getElementById('loading-view');
    const dashView = document.getElementById('dashboard-view');

    if (!formId) {
        if (loadingView) {
            loadingView.innerHTML = `<div style="text-align:center; padding:50px;">
                <div style="font-size:3rem">🔍</div>
                <h2 style="margin:20px 0">Dashboard ID Missing</h2>
                <p style="color:var(--text-secondary)">Please access the dashboard through the "View Dashboard" button on your Form Builder.</p>
                <a href="create-form.html" class="btn-primary" style="margin-top:20px; display:inline-block">Go to Builder</a>
            </div>`;
        }
        return;
    }
    const traitsChartCanvas = document.getElementById('traitsRadarChart');

    try {
        // 1. Fetch Form Config
        const formSnap = await getDoc(doc(db, "forms", formId));
        if (!formSnap.exists()) {
            alert("Form not found.");
            return;
        }
        const formConfig = formSnap.data();

        // 2. Fetch All Responses
        const q = query(collection(db, "responses"), where("formId", "==", formId));
        const respSnap = await getDocs(q);
        const responses = [];
        respSnap.forEach(doc => responses.push(doc.data()));

        if (responses.length === 0) {
            loadingView.innerHTML = `<div style="text-align:center; padding:50px;">
                <div style="font-size:3rem">⏳</div>
                <h2 style="margin:20px 0">Waiting for Responses...</h2>
                <p style="color:var(--text-secondary)">Share your public link to start collecting feedback.</p>
                <div style="margin-top:20px; color:var(--cyan)">${window.location.origin}/public-form.html?fid=${formId}</div>
            </div>`;
            return;
        }

        // 3. Analyze Data
        const report = analyzeConsensus(responses, formConfig);

        // 4. Update UI
        document.getElementById('dash-title').textContent = `${formConfig.role} Consensus Report`;
        document.getElementById('dash-meta').textContent = `Aggregated from ${responses.length} participants | Focus: ${formConfig.purpose}`;
        document.getElementById('total-resp-count').textContent = responses.length;
        document.getElementById('avg-score').textContent = `${report.overallScore}%`;
        document.getElementById('persona-name').textContent = report.persona.name;
        
        // Render Traits Radar
        renderRadar(report.traits);

        // Render Comments
        const commentsList = document.getElementById('comments-list');
        const textAnswers = responses.flatMap(r => Object.values(r.answers).filter(a => a.type === 'text').map(a => a.value));
        if (textAnswers.length) {
            commentsList.innerHTML = textAnswers.map(t => `<div class="comment-item">"${t}"</div>`).join('');
        } else {
            commentsList.innerHTML = `<div class="comment-item">No text feedback received yet.</div>`;
        }

        // Render Suggestions
        const suggestionsList = document.getElementById('suggestions-list');
        suggestionsList.innerHTML = report.suggestions.map(s => `
            <div class="suggestion-item">
                <div class="suggestion-num">${s.num}</div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${s.title}</div>
                    <div class="suggestion-desc">${s.desc}</div>
                </div>
            </div>
        `).join('');

        loadingView.style.display = 'none';
        dashView.style.display = 'block';

    } catch (err) {
        console.error("Dashboard error:", err);
        alert("Failed to load dashboard data.");
    }

    function renderRadar(traits) {
        new Chart(traitsChartCanvas, {
            type: 'radar',
            data: {
                labels: traits.map(t => t.trait),
                datasets: [{
                    label: 'Team Consensus',
                    data: traits.map(t => t.score),
                    backgroundColor: 'rgba(124, 58, 237, 0.2)',
                    borderColor: '#7C3AED',
                    pointBackgroundColor: '#7C3AED',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#7C3AED'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#94A3B8', font: { size: 12 } },
                        ticks: { display: false, stepSize: 20 },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
});
