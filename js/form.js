/**
 * AutoFeed AI – Form Controller
 * Handles role/purpose selection, question rendering, and form submission
 */
document.addEventListener('DOMContentLoaded', function () {
    const state = {
        role: null,
        purpose: null,
        name: '',
        questions: [],
        answers: {},
    };

    // ── Step Navigation ──
    function showStep(num) {
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.getElementById(`step-${num}`).classList.add('active');
        // Update progress
        document.querySelectorAll('.prog-step').forEach((s, i) => {
            s.classList.remove('active', 'done');
            if (i + 1 < num) s.classList.add('done');
            if (i + 1 === num) s.classList.add('active');
        });
        document.querySelectorAll('.prog-connector').forEach((c, i) => {
            c.classList.toggle('active', i + 1 < num);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Role Selection ──
    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.role = card.dataset.role;
            updateGenerateButton();
        });
    });

    // ── Purpose Selection ──
    document.querySelectorAll('.purpose-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.purpose-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            state.purpose = chip.dataset.purpose;
            updateGenerateButton();
        });
    });

    function updateGenerateButton() {
        const btn = document.getElementById('generate-btn');
        const btnText = document.getElementById('gen-btn-text');
        if (state.role && state.purpose) {
            btn.disabled = false;
            btnText.textContent = `Generate ${state.purpose} Questions for ${state.role}`;
        } else if (state.role) {
            btn.disabled = true;
            btnText.textContent = `Select a Purpose for ${state.role}`;
        } else if (state.purpose) {
            btn.disabled = true;
            btnText.textContent = `Select Your Role First`;
        } else {
            btn.disabled = true;
            btnText.textContent = `Select Role & Purpose First`;
        }
    }

    // ── Generate Questions ──
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            state.name = document.getElementById('user-name').value.trim();
            state.questions = getQuestions(state.role, state.purpose);
            state.answers = {};

            if (state.questions.length === 0) {
                alert('No questions available for this combination. Please try a different selection.');
                return;
            }

            // Save to sessionStorage for report page
            sessionStorage.setItem('autofeed_state', JSON.stringify({
                role: state.role,
                purpose: state.purpose,
                name: state.name,
                questions: state.questions,
            }));

            showStep(2);
            renderQuestions();
        });
    }

    // ── Render Questions ──
    function renderQuestions() {
        const container = document.getElementById('questions-container');
        const indicator = document.getElementById('ai-indicator');
        const headerInfo = document.getElementById('form-header-info');
        const subtitleText = document.getElementById('form-subtitle-text');
        const footer = document.getElementById('form-footer');
        const totalCount = document.getElementById('total-count');

        if (!container) return;

        container.innerHTML = '';
        container.style.opacity = '0';

        // Simulate AI "generating" delay
        setTimeout(() => {
            if (indicator) indicator.style.display = 'none';
            if (headerInfo) headerInfo.style.display = 'block';
            if (subtitleText) subtitleText.textContent = `${state.questions.length} personalized questions for ${state.role} – ${state.purpose} feedback`;
            if (footer) footer.style.display = 'flex';
            if (totalCount) totalCount.textContent = state.questions.length;

            state.questions.forEach((q, index) => {
                const card = createQuestionCard(q, index);
                card.style.animationDelay = `${index * 80}ms`;
                container.appendChild(card);
            });

            container.style.transition = 'opacity 0.4s ease';
            container.style.opacity = '1';
            updateProgress();
        }, 2000); // Simulate AI generation time
    }

    function createQuestionCard(q, index) {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `qcard-${index}`;

        let inputHtml = '';

        if (q.type === 'scale') {
            inputHtml = `
        <div class="scale-container">
          <span class="scale-label-left">Strongly Disagree</span>
          <div class="scale-dots" id="scale-${index}">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n =>
                `<button class="scale-dot" data-val="${n}" data-q="${index}" type="button">${n}</button>`
            ).join('')}
          </div>
          <span class="scale-label-right">Strongly Agree</span>
        </div>`;
        } else if (q.type === 'options') {
            inputHtml = `
        <div class="options-grid" id="options-${index}">
          ${q.options.map((opt, oi) => `
            <button class="option-btn" data-val="${oi}" data-q="${index}" type="button">
              <div class="option-indicator"></div>
              <span>${opt}</span>
            </button>`).join('')}
        </div>`;
        } else if (q.type === 'text') {
            inputHtml = `
        <textarea class="q-textarea" id="text-${index}" data-q="${index}" 
          placeholder="Share your thoughts here... (minimum 20 characters)" 
          rows="3"></textarea>`;
        }

        card.innerHTML = `
      <div class="q-header">
        <div class="q-number">${index + 1}</div>
        <div>
          <div class="q-category">${q.category}</div>
          <div class="q-text">${q.q}</div>
        </div>
      </div>
      ${inputHtml}`;

        return card;
    }

    // ── Handle Answers via Event Delegation ──
    const questionsContainer = document.getElementById('questions-container');
    if (questionsContainer) {
        questionsContainer.addEventListener('click', function (e) {
            // Scale dots
            if (e.target.classList.contains('scale-dot')) {
                const qIdx = parseInt(e.target.dataset.q);
                const val = parseInt(e.target.dataset.val);

                document.querySelectorAll(`#scale-${qIdx} .scale-dot`).forEach(d => {
                    d.classList.remove('selected');
                    if (d.dataset.val <= val) d.classList.add('selected');
                });

                state.answers[qIdx] = { type: 'scale', value: val };
                markAnswered(qIdx);
            }

            // Option buttons
            if (e.target.classList.contains('option-btn') || e.target.closest('.option-btn')) {
                const btn = e.target.closest('.option-btn');
                const qIdx = parseInt(btn.dataset.q);
                const val = parseInt(btn.dataset.val);

                document.querySelectorAll(`#options-${qIdx} .option-btn`).forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                state.answers[qIdx] = { type: 'options', value: val, text: btn.querySelector('span').textContent };
                markAnswered(qIdx);
            }
        });

        questionsContainer.addEventListener('input', function (e) {
            if (e.target.classList.contains('q-textarea')) {
                const qIdx = parseInt(e.target.dataset.q);
                const val = e.target.value.trim();
                if (val.length >= 20) {
                    state.answers[qIdx] = { type: 'text', value: val };
                    markAnswered(qIdx);
                } else {
                    delete state.answers[qIdx];
                    document.getElementById(`qcard-${qIdx}`)?.classList.remove('answered');
                    updateProgress();
                }
            }
        });
    }

    function markAnswered(qIdx) {
        const card = document.getElementById(`qcard-${qIdx}`);
        if (card) card.classList.add('answered');
        updateProgress();
    }

    function updateProgress() {
        const answered = Object.keys(state.answers).length;
        const total = state.questions.length;
        const pct = total > 0 ? (answered / total) * 100 : 0;

        const answeredCount = document.getElementById('answered-count');
        const progressFill = document.getElementById('progress-bar-fill');
        const submitBtn = document.getElementById('submit-btn');

        if (answeredCount) answeredCount.textContent = answered;
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (submitBtn) submitBtn.disabled = answered < Math.ceil(total * 0.7); // 70% required
    }

    // ── Submit ──
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            // Save answers
            sessionStorage.setItem('autofeed_answers', JSON.stringify(state.answers));
            showStep(3);
            runAnalysisSimulation();
        });
    }

    function runAnalysisSimulation() {
        const steps = ['astep-1', 'astep-2', 'astep-3', 'astep-4'];
        let current = 0;

        function processStep() {
            if (current > 0) {
                const prev = document.getElementById(steps[current - 1]);
                if (prev) {
                    prev.classList.remove('active');
                    prev.classList.add('done');
                }
            }

            if (current < steps.length) {
                const el = document.getElementById(steps[current]);
                if (el) {
                    el.classList.remove('pending');
                    el.classList.add('active');
                }
                current++;
                setTimeout(processStep, 1200);
            } else {
                // All done – navigate to report
                setTimeout(() => {
                    window.location.href = 'report.html';
                }, 800);
            }
        }

        processStep();
    }

});
