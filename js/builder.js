/**
 * AutoFeed AI – Form Builder Logic
 * Handles customization of questions and saving to Firestore
 */
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        role: 'Employee',
        purpose: 'Performance',
        questions: []
    };

    const importBtn = document.getElementById('import-btn');
    const editorView = document.getElementById('editor-view');
    const questionsList = document.getElementById('questions-list');
    const addQBtn = document.getElementById('add-q');
    const publishBtn = document.getElementById('publish-btn');
    const qCount = document.getElementById('q-count');

    // ── Import from Bank ──
    importBtn.addEventListener('click', () => {
        state.role = document.getElementById('role-select').value;
        state.purpose = document.getElementById('purpose-select').value;
        
        const bank = getQuestions(state.role, state.purpose);
        state.questions = bank.map((q, i) => ({
            id: `q_${Date.now()}_${i}`,
            text: q.q,
            type: q.type,
            category: q.category,
            options: q.options || []
        }));

        editorView.style.display = 'block';
        renderQuestions();
    });

    // ── Render List ──
    function renderQuestions() {
        questionsList.innerHTML = '';
        state.questions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'q-editor-card';
            card.innerHTML = `
                <input type="text" class="q-editor-input" value="${q.text}" data-index="${index}" placeholder="Enter question text">
                <select class="q-editor-select" data-index="${index}">
                    <option value="scale" ${q.type === 'scale' ? 'selected' : ''}>Rating</option>
                    <option value="options" ${q.type === 'options' ? 'selected' : ''}>Options</option>
                    <option value="text" ${q.type === 'text' ? 'selected' : ''}>Text</option>
                </select>
                <button class="delete-btn" data-index="${index}">×</button>
            `;
            questionsList.appendChild(card);
        });
        qCount.textContent = state.questions.length;
        
        // Add listeners
        document.querySelectorAll('.q-editor-input').forEach(input => {
            input.addEventListener('input', (e) => {
                state.questions[e.target.dataset.index].text = e.target.value;
            });
        });

        document.querySelectorAll('.q-editor-select').forEach(select => {
            select.addEventListener('change', (e) => {
                state.questions[e.target.dataset.index].type = e.target.value;
                if (e.target.value === 'options' && !state.questions[e.target.dataset.index].options.length) {
                    state.questions[e.target.dataset.index].options = ["Option 1", "Option 2"];
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.dataset.index;
                state.questions.splice(idx, 1);
                renderQuestions();
            });
        });
    }

    // ── Add Custom ──
    addQBtn.addEventListener('click', () => {
        state.questions.push({
            id: `q_${Date.now()}`,
            text: "New Question Text",
            type: "scale",
            category: "General",
            options: []
        });
        renderQuestions();
    });

    // ── Publish ──
    publishBtn.addEventListener('click', async () => {
        if (state.questions.length === 0) {
            alert("Add at least one question.");
            return;
        }

        publishBtn.disabled = true;
        publishBtn.textContent = "Publishing...";

        try {
            const docRef = await addDoc(collection(db, "forms"), {
                role: state.role,
                purpose: state.purpose,
                questions: state.questions,
                createdAt: serverTimestamp(),
                active: true
            });

            let base = window.location.pathname;
            const hasHtml = base.includes('.html');
            const target = hasHtml ? 'public-form.html' : 'public-form';

            if (base.endsWith('create-form.html')) {
                base = base.replace('create-form.html', target);
            } else if (base.endsWith('create-form')) {
                base = base.replace('create-form', target);
            } else {
                base = base.substring(0, base.lastIndexOf('/') + 1) + target;
            }
            const shareUrl = `${window.location.origin}${base}?fid=${docRef.id}`;
            showModal(shareUrl, docRef.id);
        } catch (err) {
            console.error("💥 Error publishing:", err);
            // Provide more specific feedback if possible
            const errorMsg = err.code ? `Error: ${err.code} - ${err.message}` : err.message || "Unknown connection error";
            alert(`Publishing failed: ${errorMsg}\n\nTIP: Check your Firebase Firestore "Rules" tab. It might be in "Locked Mode".`);
            publishBtn.disabled = false;
            publishBtn.textContent = "Publish & Get Link";
        }
    });

    function showModal(url, id) {
        const modal = document.getElementById('share-modal');
        const linkText = document.getElementById('share-link-text');
        const copyBtn = document.getElementById('copy-btn');
        const hasHtml = window.location.pathname.includes('.html');
        const dashBtn = document.getElementById('view-dashboard-btn');
        const dashTarget = hasHtml ? 'dashboard.html' : 'dashboard';
        
        linkText.textContent = url;
        modal.style.display = 'flex';
        if (dashBtn) dashBtn.href = `${dashTarget}?fid=${id}`;

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(url);
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = "Copy", 2000);
        });
    }
});
