/**
 * AutoFeed AI – Public Response Logic
 * Fetches form from Firestore and submits guest responses
 */
import { db } from './firebase-config.js';
import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const loadingView = document.getElementById('loading-view');
    const formView = document.getElementById('form-view');
    const qContainer = document.getElementById('questions-container');
    const metaText = document.getElementById('form-meta-text');
    const submitBtn = document.getElementById('submit-btn');

    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('fid');
    console.log("📄 Public form loading for FID:", formId);

    if (!formId) {
        if (loadingView) {
            loadingView.innerHTML = `<div style="text-align:center; padding:40px;">
                <div style="font-size:3rem">🔗</div>
                <h2>Missing Form ID</h2>
                <p>Please use the full link shared with you. It should end with <code>?fid=...</code></p>
                <a href="index.html" class="btn-primary" style="margin-top:20px; display:inline-block">Go Home</a>
            </div>`;
        }
        return;
    }

    const state = {
        formId: formId,
        questions: [],
        answers: {},
        config: null
    };

    // ── Fetch Form ──
    try {
        console.log("🔍 Fetching form config for ID:", formId);
        const docRef = doc(db, "forms", formId);
        const docSnap = await getDoc(docRef);

        console.log("📄 Doc snapshot received. Exists:", docSnap.exists());
        
        if (docSnap.exists()) {
            state.config = docSnap.data();
            state.questions = state.config.questions;
            metaText.textContent = `Feedback for ${state.config.role} – Focus: ${state.config.purpose}`;
            renderQuestions();
            loadingView.style.display = 'none';
            formView.style.display = 'block';
        } else {
            loadingView.innerHTML = `<div style="text-align:center; padding:40px;">
                <div style="font-size:3rem">⚠️</div>
                <h2>Form Not Found</h2>
                <p>This link might be expired or incorrect.</p>
                <a href="index.html" class="btn-primary" style="margin-top:20px; display:inline-block">Go Home</a>
            </div>`;
        }
    } catch (err) {
        console.error("💥 Error fetching form:", err);
        loadingView.innerHTML = `<div style="text-align:center; padding:40px;">
            <div style="font-size:3rem">❌</div>
            <h2>Connection Error</h2>
            <p>Could not reach the database. Please check your internet or Firebase permissions.</p>
            <pre style="font-size:0.8rem; margin-top:20px; color:#ef4444; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">${err.message}</pre>
        </div>`;
    }

    // ── Render Questions ──
    function renderQuestions() {
        qContainer.innerHTML = '';
        state.questions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.id = `qcard-${index}`;

            let inputHtml = '';
            if (q.type === 'scale') {
                inputHtml = `<div class="scale-container"><div class="scale-dots">${[1,2,3,4,5,6,7,8,9,10].map(n => `<button class="scale-dot" data-val="${n}" data-index="${index}" type="button">${n}</button>`).join('')}</div></div>`;
            } else if (q.type === 'options') {
                inputHtml = `<div class="options-grid">${q.options.map((opt, oi) => `<button class="option-btn" data-val="${oi}" data-index="${index}" type="button"><span>${opt}</span></button>`).join('')}</div>`;
            } else if (q.type === 'text') {
                inputHtml = `<textarea class="q-textarea" data-index="${index}" placeholder="Write your feedback here..."></textarea>`;
            } else {
                // Fallback for custom questions or missing types
                inputHtml = `<textarea class="q-textarea" data-index="${index}" placeholder="Write your response here..."></textarea>`;
            }

            card.innerHTML = `
                <div class="q-header">
                    <div class="q-number">${index + 1}</div>
                    <div>
                        <div class="q-category">${q.category || 'General'}</div>
                        <div class="q-text">${q.text}</div>
                    </div>
                </div>
                ${inputHtml}
            `;
            qContainer.appendChild(card);
        });
        
        attachEventListeners();
    }

    function attachEventListeners() {
        qContainer.addEventListener('click', (e) => {
            const dot = e.target.closest('.scale-dot');
            const opt = e.target.closest('.option-btn');
            
            if (dot) {
                const idx = dot.dataset.index;
                const val = parseInt(dot.dataset.val);
                state.answers[idx] = { type: 'scale', value: val };
                
                document.querySelectorAll(`#qcard-${idx} .scale-dot`).forEach(d => {
                    d.classList.toggle('selected', d.dataset.val <= val);
                });
                markAnswered(idx);
            }

            if (opt) {
                const idx = opt.dataset.index;
                const val = parseInt(opt.dataset.val);
                state.answers[idx] = { type: 'options', value: val, text: opt.textContent.trim() };
                
                document.querySelectorAll(`#qcard-${idx} .option-btn`).forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                markAnswered(idx);
            }
        });

        qContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('q-textarea')) {
                const idx = e.target.dataset.index;
                const val = e.target.value.trim();
                if (val.length > 5) {
                    state.answers[idx] = { type: 'text', value: val };
                    markAnswered(idx);
                }
            }
        });
    }

    function markAnswered(idx) {
        document.getElementById(`qcard-${idx}`).classList.add('answered');
        updateProgress();
    }

    function updateProgress() {
        const count = Object.keys(state.answers).length;
        document.getElementById('answered-count').textContent = count;
        const pct = (count / state.questions.length) * 100;
        document.getElementById('progress-bar-fill').style.width = `${pct}%`;
        submitBtn.disabled = count < Math.ceil(state.questions.length * 0.7);
    }

    // ── Submit ──
    submitBtn.addEventListener('click', async () => {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        try {
            await addDoc(collection(db, "responses"), {
                formId: state.formId,
                answers: state.answers,
                timestamp: serverTimestamp()
            });

            formView.style.display = 'none';
            document.getElementById('success-view').style.display = 'block';
            window.scrollTo(0, 0);
        } catch (err) {
            console.error("💥 Submission error:", err);
            const errorMsg = err.code ? `Error: ${err.code}` : "Connection failed";
            alert(`Submission failed (${errorMsg}). Please check your connection and Firebase permissions.`);
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Feedback";
        }
    });
});
