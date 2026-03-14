/**
 * AutoFeed AI – AI Analysis & Report Engine
 * Analyzes user responses and generates personality profiles
 */

document.addEventListener('DOMContentLoaded', function () {

    const stateRaw = sessionStorage.getItem('autofeed_state');
    const answersRaw = sessionStorage.getItem('autofeed_answers');

    if (!stateRaw || !answersRaw) {
        // Redirect if no data
        document.getElementById('report-main').innerHTML = `
      <div style="text-align:center;padding:100px 24px;">
        <div style="font-size:3rem;margin-bottom:20px">⚠️</div>
        <h2 style="font-family:'Space Grotesk',sans-serif;font-size:1.8rem;font-weight:800;margin-bottom:12px">No Data Found</h2>
        <p style="color:var(--text-secondary);margin-bottom:32px">Please complete a feedback form first to see your analysis.</p>
        <a href="form.html" class="btn-primary" style="display:inline-flex;align-items:center;gap:10px;padding:14px 32px;background:linear-gradient(135deg,#7C3AED,#06B6D4);border:none;border-radius:50px;color:white;font-size:1rem;font-weight:600;cursor:pointer;text-decoration:none;">
          Start Feedback Form
        </a>
      </div>`;
        return;
    }

    const state = JSON.parse(stateRaw);
    const answers = JSON.parse(answersRaw);

    // ── AI Analysis Engine ──
    function analyzeResponses(role, purpose, questions, answers) {

        // Calculate aggregate score from scale answers
        const scaleAnswers = Object.values(answers).filter(a => a.type === 'scale');
        const avgScale = scaleAnswers.length > 0
            ? scaleAnswers.reduce((s, a) => s + a.value, 0) / scaleAnswers.length
            : 7;

        const overallScore = Math.round(avgScale * 10);

        // ── Personality Profiles (Role + Score Based) ──
        const personalityProfiles = {
            Student: {
                high: { name: 'The Scholar Achiever', emoji: '🌟', desc: 'You are a highly self-motivated learner with strong academic discipline, intellectual curiosity, and a natural ability to absorb and apply new knowledge. You set high standards for yourself and consistently strive to exceed them.' },
                mid: { name: 'The Steady Grower', emoji: '📈', desc: 'You are a consistent and thoughtful student who learns well from experience. With clear goals and structured support, you have strong potential to achieve exceptional academic and personal outcomes.' },
                low: { name: 'The Emerging Learner', emoji: '🌱', desc: 'You are at the beginning of building strong academic habits. There are clear and exciting opportunities to develop focus, self-motivation, and learning strategies that will accelerate your growth.' },
            },
            Employee: {
                high: { name: 'The High-Impact Professional', emoji: '🚀', desc: 'You are a results-driven professional who takes full ownership of your work, consistently delivers high-quality output, and proactively contributes beyond your defined role. You are an asset to any team.' },
                mid: { name: 'The Reliable Contributor', emoji: '⚙️', desc: 'You are a dependable team member who delivers on commitments and works collaboratively. With a growth mindset and strategic focus, you are well-positioned for advancement.' },
                low: { name: 'The Development Candidate', emoji: '🔧', desc: 'There is significant opportunity to strengthen your professional effectiveness. With the right coaching, clearer goal-setting, and focused development, you can substantially increase your impact.' },
            },
            'Team Leader': {
                high: { name: 'The Inspiring Catalyst', emoji: '⚡', desc: 'You are a dynamic, emotionally intelligent leader who energizes teams, drives results, and develops other leaders. Your teams feel safe, motivated, and are consistently high-performing.' },
                mid: { name: 'The Developing Leader', emoji: '🧭', desc: 'You have solid leadership foundations with genuine care for your team. Developing more strategic thinking, delegation, and coaching skills will significantly amplify your leadership impact.' },
                low: { name: 'The Leadership Learner', emoji: '🎯', desc: 'You are building your leadership identity. Focusing on core leadership competencies—communication, delegation, and team building—will create a strong foundation for your growth.' },
            },
            Manager: {
                high: { name: 'The Visionary Executive', emoji: '👑', desc: 'You are a compelling, strategically sophisticated leader who thinks systemically, inspires across organizational levels, and drives meaningful change. You are a true organizational asset and multiplier.' },
                mid: { name: 'The Strategic Manager', emoji: '📊', desc: 'You effectively balance operational demands with strategic thinking. Elevating your executive presence and talent development capabilities will position you for senior leadership.' },
                low: { name: 'The Adapting Manager', emoji: '🛠️', desc: 'Management at scale requires ongoing development. Investing in strategic thinking, systems leadership, and executive communication will substantially boost your organizational effectiveness.' },
            },
            Teacher: {
                high: { name: 'The Transformational Educator', emoji: '🌈', desc: 'You are a deeply impactful educator who inspires learning, builds genuine student potential, and creates inclusive, joyful learning environments. Your students are deeply fortunate to have you.' },
                mid: { name: 'The Dedicated Practitioner', emoji: '📚', desc: 'You are a committed educator with strong subject knowledge and care for your students. Deepening your pedagogical range and educational leadership will multiply your impact significantly.' },
                low: { name: 'The Growing Educator', emoji: '🌿', desc: 'Teaching is a craft that deepens with practiced reflection. Focusing on differentiated instruction, student engagement, and formative assessment will accelerate your professional growth.' },
            },
        };

        const level = avgScale >= 7.5 ? 'high' : avgScale >= 5 ? 'mid' : 'low';
        const personality = (personalityProfiles[role] || personalityProfiles.Employee)[level];

        // ── Trait Scores (based on question categories and answers) ──
        const categoryScores = {};
        questions.forEach((q, idx) => {
            const answer = answers[idx];
            if (!answer) return;
            let score = 0;
            if (answer.type === 'scale') score = answer.value * 10;
            else if (answer.type === 'options') score = [90, 70, 45, 75][answer.value] || 65;
            else if (answer.type === 'text') score = Math.min(90, 50 + answer.value.length / 3);

            if (!categoryScores[q.category]) categoryScores[q.category] = [];
            categoryScores[q.category].push(score);
        });

        // Aggregate to trait groups
        const traitMap = {
            'Leadership': ['Leadership', 'Leadership Experience', 'Decision Making', 'Delegation', 'Vision', 'Influence'],
            'Communication': ['Communication', 'Clarity', 'Active Listening', 'Public Speaking', 'Written Communication'],
            'Adaptability': ['Adaptability', 'Resilience', 'Change Management', 'Ambiguity Tolerance'],
            'Teamwork': ['Collaboration', 'Team Support', 'Teamwork', 'Co-Teaching'],
            'Creativity': ['Creativity', 'Innovation', 'Creative Process', 'Open-mindedness'],
            'Problem Solving': ['Problem Solving', 'Analytical Thinking', 'Strategy', 'Resourcefulness'],
            'Self-Awareness': ['Self-Awareness', 'Reflection', 'Growth Mindset', 'Self-Assessment'],
            'Empathy': ['Empathy', 'Inclusivity', 'Psychological Safety', 'Student Advocacy'],
        };

        const traits = Object.entries(traitMap).map(([trait, cats]) => {
            const relevant = cats.flatMap(c => categoryScores[c] || []);
            const base = avgScale * 10;
            const score = relevant.length > 0
                ? Math.min(98, Math.max(35, Math.round(relevant.reduce((s, v) => s + v, 0) / relevant.length + (Math.random() * 10 - 5)))
                ) : Math.min(95, Math.max(40, Math.round(base + (Math.random() * 20 - 10))));
            const colors = ['var(--purple)', 'var(--cyan)', 'var(--green)', 'var(--amber)', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];
            return { trait, score, color: colors[Object.keys(traitMap).indexOf(trait) % colors.length] };
        }).sort((a, b) => b.score - a.score);

        // ── Strengths (top traits) ──
        const strengthDetails = {
            'Leadership': 'You naturally take initiative and guide others effectively. Your clarity of direction and decision-making confidence inspire those around you.',
            'Communication': 'You articulate ideas with clarity and precision. Your listening skills and communication adaptability build strong professional relationships.',
            'Adaptability': 'You remain effective under changing conditions. Your resilience and flexibility allow you to navigate uncertainty and thrive through disruption.',
            'Teamwork': 'You are a collaborative force who elevates the entire team. Your willingness to support others and share credit creates high-trust environments.',
            'Creativity': 'You think beyond conventional boundaries and generate innovative ideas. Your creative problem-solving ability adds distinctive value to any context.',
            'Problem Solving': 'You break down complexity into manageable components and identify effective solutions. Your analytical approach and persistence produce results.',
            'Self-Awareness': 'You possess deep insight into your own motivations, behaviors, and areas for growth. This metacognitive strength accelerates your learning and development.',
            'Empathy': 'You understand and respond to others\' perspectives with genuine care. Your emotional intelligence builds psychological safety and trust in relationships.',
        };

        const strengths = traits.slice(0, 3).map(t => ({
            title: t.trait,
            desc: strengthDetails[t.trait] || `Strong performance in ${t.trait.toLowerCase()}.`,
        }));

        // ── Weaknesses (bottom traits) ──
        const weaknessDetails = {
            'Leadership': 'Leadership presence and decisiveness may need strengthening. Opportunities exist to take more visible initiative and own decision-making more consistently.',
            'Communication': 'There may be gaps in clearly articulating ideas or adapting your communication to different audiences. Proactive communication efforts could significantly improve outcomes.',
            'Adaptability': 'Navigating change and ambiguity may present challenges. Building flexibility and developing a growth mindset will improve performance in dynamic environments.',
            'Teamwork': 'Collaborative tendencies may need development. Being more proactively supportive, inclusive, and team-oriented will enhance team cohesion and results.',
            'Creativity': 'Generating innovative ideas and challenging convention may be an area for growth. Deliberately cultivating curiosity and creative risk-taking will unlock potential.',
            'Problem Solving': 'Structured analytical problem-solving approaches may benefit from development. Building systematic frameworks for tackling complex challenges will increase effectiveness.',
            'Self-Awareness': 'Greater reflection on your own behaviors, triggers, and development areas can accelerate personal and professional growth considerably.',
            'Empathy': 'Strengthening emotional intelligence and deepening sensitivity to others\' perspectives will enhance relationships, trust, and collaborative effectiveness.',
        };

        const weaknesses = traits.slice(-3).reverse().map(t => ({
            title: t.trait,
            desc: weaknessDetails[t.trait] || `Room for growth in ${t.trait.toLowerCase()}.`,
        }));

        // ── Behavior Patterns ──
        const behavioralPatterns = {
            high: [
                { emoji: '🎯', name: 'Results Orientation', desc: 'You have a consistent drive to achieve goals and deliver measurable outcomes in everything you undertake.' },
                { emoji: '🔄', name: 'Proactive Adaptation', desc: 'You anticipate change and actively position yourself to respond positively rather than reactively.' },
                { emoji: '🤝', name: 'Collaborative Mindset', desc: 'You default to partnership and elevate the people and teams around you through genuine collaborative investment.' },
                { emoji: '💡', name: 'Innovative Thinking', desc: 'You naturally seek better ways of doing things and challenge the status quo in constructive ways.' },
            ],
            mid: [
                { emoji: '📋', name: 'Structured Execution', desc: 'You work best with clear frameworks and organized approaches, delivering solid results within defined structures.' },
                { emoji: '🤔', name: 'Reflective Processing', desc: 'You tend to think carefully before acting, which enhances decision quality but may slow responsiveness in some situations.' },
                { emoji: '🔃', name: 'Consistent Effort', desc: 'You maintain steady engagement and reliability, building trust through consistency over time.' },
                { emoji: '📊', name: 'Data-Conscious', desc: 'You prefer to base decisions on evidence and concrete information rather than intuition or gut feeling.' },
            ],
            low: [
                { emoji: '⏸️', name: 'Cautious Approach', desc: 'You tend to be careful and conservative, which promotes safety but may limit speed and innovation opportunities.' },
                { emoji: '🎯', name: 'Focused but Narrow', desc: 'Your strong focus on specific tasks serves reliability but may benefit from expanding to broader strategic thinking.' },
                { emoji: '🌱', name: 'Growth in Progress', desc: 'You are actively in a developmental phase where habits, skills, and mindsets are being intentionally built and reinforced.' },
                { emoji: '🔍', name: 'Detail-Oriented', desc: 'You pay close attention to specifics, which supports quality but occasionally may slow down the bigger picture perspective.' },
            ],
        };

        const patterns = behavioralPatterns[level];

        // ── Personalized Suggestions ──
        const purposeSuggestions = {
            Performance: [
                { title: 'Set SMART Goals Weekly', desc: 'Define Specific, Measurable, Achievable, Relevant, Time-bound goals each week. Review progress on Fridays and adjust for the following week.' },
                { title: 'Implement a Reflection Practice', desc: 'Spend 10 minutes daily or 30 minutes weekly reviewing what worked, what didn\'t, and what you\'ll do differently. A journal dramatically accelerates development.' },
                { title: 'Seek Regular Feedback', desc: 'Actively request structured feedback from peers, supervisors, or mentors every 2-4 weeks. Ask specific questions rather than open-ended ones for actionable insights.' },
                { title: 'Track Your Wins', desc: 'Document achievements, no matter how small. This builds confidence, provides evidence for performance reviews, and identifies your most productive patterns.' },
                { title: 'Master Time-Blocking', desc: 'Allocate dedicated blocks for deep, focused work on your highest-priority tasks. Protect these blocks ruthlessly to maximize your most valuable output.' },
            ],
            Leadership: [
                { title: 'Find a Leadership Mentor', desc: 'Identify a leader whose style you admire and request 30-minute bi-monthly conversations. Ask for honest feedback on your leadership blind spots.' },
                { title: 'Practice Servant Leadership Skills', desc: 'Spend one week deliberately prioritizing others\'s needs in your team. Track how this shifts team dynamics and your own satisfaction.' },
                { title: 'Read & Apply Leadership Books', desc: 'Start with "Leaders Eat Last" by Simon Sinek or "Dare to Lead" by Brené Brown. Apply one principle per week and measure the impact.' },
                { title: 'Develop Your Emotional Intelligence', desc: 'Take the EQ-i 2.0 assessment or similar tool. Identify your lowest EQ competency and work with a coach or apply targeted development strategies.' },
                { title: 'Create a Leadership Development Plan', desc: 'Write a 90-day leadership development plan with 3 clear competencies to build, specific experiences to seek, and measurable success indicators.' },
            ],
            Communication: [
                { title: 'Join Toastmasters or Similar', desc: 'Regular public speaking practice in a supportive environment dramatically builds confidence, clarity, and communication effectiveness within 3-6 months.' },
                { title: 'Practice Active Listening Daily', desc: 'In every conversation this week, focus entirely on understanding before responding. Summarize what you heard before sharing your view.' },
                { title: 'Write More – Email & Summaries', desc: 'Practice written communication by summarizing meetings, writing thought leadership posts, or maintaining a professional blog. Writing clarifies thinking.' },
                { title: 'Get Communication Coaching', desc: 'Work with a professional coach on your specific communication challenges. Even 4-6 sessions can produce transformative improvements in clarity and impact.' },
                { title: 'Record and Review Yourself', desc: 'Record a 5-minute spoken explanation of a complex topic. Review it critically for clarity, pacing, and presence. This is one of the fastest improvement methods available.' },
            ],
            Teamwork: [
                { title: 'Conduct a Personal Team Audit', desc: 'List all your current team relationships. Identify which are strong, which need investment, and which have friction. Create a 30-day relationship investment plan.' },
                { title: 'Volunteer for Cross-Functional Projects', desc: 'Actively seek opportunities to work with colleagues outside your immediate team. This builds networks, empathy, and collaboration skills simultaneously.' },
                { title: 'Practice Recognition Daily', desc: 'Send one specific, genuine appreciation message to a colleague daily for 30 days. Notice the impact on both your relationships and your own motivation.' },
                { title: 'Learn Conflict Resolution Skills', desc: 'Take a conflict resolution course or workshop. Understanding interest-based negotiation and mediation transforms your ability to navigate team challenges constructively.' },
                { title: 'Create Team Rituals', desc: 'Introduce simple rituals that build connection: weekly wins sharing, retrospectives, or team learning sessions. Consistent rituals compound team culture over time.' },
            ],
            Creativity: [
                { title: 'Embrace a Daily Curiosity Practice', desc: 'Spend 15 minutes daily exploring something entirely outside your field – art, science, history, music. Cross-domain learning is the primary source of creative breakthrough.' },
                { title: 'Create an Idea Journal', desc: 'Capture every idea, no matter how impractical, in a dedicated notebook or app. Review weekly and identify patterns or combinations with potential.' },
                { title: 'Use the SCAMPER Framework', desc: 'Apply SCAMPER (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Rearrange) to your work challenges weekly. It systematically generates creative options.' },
                { title: 'Schedule Unstructured Think Time', desc: 'Block 60-90 minutes weekly for completely unstructured exploration with no deliverables. Innovation requires space that organizations rarely provide but individuals can protect.' },
                { title: 'Build a Creative Community', desc: 'Find or create a group of creative thinkers in your field or adjacent fields. Regular idea-sharing sessions with diverse thinkers exponentially expands your creative range.' },
            ],
            'Problem Solving': [
                { title: 'Learn Root Cause Analysis', desc: 'Master the "5 Whys" technique and Fishbone (Ishikawa) diagramming. Applying these tools prevents solving symptoms instead of root causes.' },
                { title: 'Build a Problem-Solving Toolkit', desc: 'Develop personal fluency in 3-4 frameworks: Design Thinking, First Principles reasoning, Systems Thinking, and PDCA (Plan-Do-Check-Act) cycles.' },
                { title: 'Practice Structured Decomposition', desc: 'When facing complex problems, break them into components using a logic tree before generating solutions. Structure before speed dramatically improves outcome quality.' },
                { title: 'Develop a Solutions Database', desc: 'Document every significant problem and solution in a personal knowledge base. Over time, this becomes an invaluable reference for pattern recognition and faster future resolution.' },
                { title: 'Train with Case Studies', desc: 'Regularly practice with Harvard Business School cases, technical challenges, or industry problem sets. Deliberate problem-solving practice builds intuition and speed.' },
            ],
        };

        const suggestions = (purposeSuggestions[purpose] || purposeSuggestions.Performance).map((s, i) => ({
            num: i + 1,
            ...s,
        }));

        return {
            overallScore,
            personality,
            traits,
            strengths,
            weaknesses,
            patterns,
            suggestions,
            level,
        };
    }

    // ── Render Report ──
    const analysis = analyzeResponses(state.role, state.purpose, state.questions, answers);
    renderReport(state, analysis);

    function renderReport(state, analysis) {
        const main = document.getElementById('report-main');
        const displayName = state.name || `${state.role} Professional`;
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const circumference = 2 * Math.PI * 42; // r=42
        const strokeDash = circumference - (analysis.overallScore / 100) * circumference;

        main.innerHTML = `
      <!-- Report Hero -->
      <div class="report-hero">
        <div class="report-avatar">${getAvatarEmoji(state.role)}</div>
        <div class="report-meta">
          <div class="report-name">${displayName}</div>
          <div class="report-role-badge">
            ${getRoleEmoji(state.role)} ${state.role} &nbsp;·&nbsp; ${state.purpose} Feedback
          </div>
          <div class="report-date">📅 Generated on ${today} &nbsp;·&nbsp; AutoFeed AI Analysis</div>
        </div>
        <div class="report-score-circle">
          <div class="score-ring">
            <svg class="score-svg" width="100" height="100" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#7C3AED"/>
                  <stop offset="100%" stop-color="#06B6D4"/>
                </linearGradient>
              </defs>
              <circle class="score-bg" cx="50" cy="50" r="42" fill="none" stroke-width="8"/>
              <circle class="score-fill" cx="50" cy="50" r="42" fill="none" stroke-width="8"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${circumference}"
                id="score-circle-fill"/>
            </svg>
            <div class="score-number">${analysis.overallScore}%</div>
          </div>
          <div class="score-label">Overall<br/>Score</div>
        </div>
      </div>

      <!-- Personality Card (full width) -->
      <div class="report-card personality-card">
        <div class="card-title">
          <span class="card-title-icon">🧬</span>
          Personality Profile
        </div>
        <div class="personality-display">
          <div class="personality-type">
            <div class="personality-label">Your Personality Type</div>
            <div class="personality-name">${analysis.personality.name}</div>
            <div class="personality-desc">${analysis.personality.desc}</div>
            <div class="personality-tags">
              ${analysis.traits.slice(0, 4).map(t => `<span class="personality-tag">${t.trait}</span>`).join('')}
            </div>
          </div>
          <div class="personality-emoji">${analysis.personality.emoji}</div>
        </div>
      </div>

      <!-- Main Report Grid -->
      <div class="report-grid">

        <!-- Trait Analysis -->
        <div class="report-card">
          <div class="card-title">
            <span class="card-title-icon">📊</span>
            Core Trait Analysis
          </div>
          <div class="traits-list">
            ${analysis.traits.map(t => `
              <div class="trait-item">
                <div class="trait-item-label">${t.trait}</div>
                <div class="trait-item-bar">
                  <div class="trait-item-fill" style="--w:${t.score}%;--c:${t.color};animation-delay:${Math.random() * 0.5}s"></div>
                </div>
                <div class="trait-item-val">${t.score}%</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Behavior Patterns -->
        <div class="report-card">
          <div class="card-title">
            <span class="card-title-icon">🔄</span>
            Behavioral Patterns
          </div>
          <div class="patterns-grid">
            ${analysis.patterns.map(p => `
              <div class="pattern-item">
                <div class="pattern-emoji">${p.emoji}</div>
                <div class="pattern-name">${p.name}</div>
                <div class="pattern-desc">${p.desc}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Strengths -->
        <div class="report-card">
          <div class="card-title">
            <span class="card-title-icon">💪</span>
            Core Strengths
          </div>
          <div class="sw-list">
            ${analysis.strengths.map(s => `
              <div class="sw-item strength">
                <span class="sw-icon">✅</span>
                <div>
                  <strong>${s.title}</strong><br/>
                  <span>${s.desc}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Weaknesses -->
        <div class="report-card">
          <div class="card-title">
            <span class="card-title-icon">🎯</span>
            Development Areas
          </div>
          <div class="sw-list">
            ${analysis.weaknesses.map(w => `
              <div class="sw-item weakness">
                <span class="sw-icon">⚠️</span>
                <div>
                  <strong>${w.title}</strong><br/>
                  <span>${w.desc}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Suggestions (full width) -->
        <div class="report-card full-width">
          <div class="card-title">
            <span class="card-title-icon">🚀</span>
            Personalized Development Recommendations
          </div>
          <div class="suggestions-list">
            ${analysis.suggestions.map(s => `
              <div class="suggestion-item">
                <div class="suggestion-num">${s.num}</div>
                <div class="suggestion-content">
                  <div class="suggestion-title">${s.title}</div>
                  <div class="suggestion-desc">${s.desc}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>

      </div>

      <!-- New Analysis CTA -->
      <div style="text-align:center;margin-top:48px;padding:48px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:20px;">
        <h3 style="font-family:'Space Grotesk',sans-serif;font-size:1.5rem;font-weight:700;margin-bottom:12px;">Ready for Another Analysis?</h3>
        <p style="color:var(--text-secondary);margin-bottom:28px;">Try different roles or purposes to unlock more insights about yourself.</p>
        <a href="form.html" class="btn-primary" style="display:inline-flex;align-items:center;gap:10px;padding:14px 32px;background:linear-gradient(135deg,#7C3AED,#06B6D4);border:none;border-radius:50px;color:white;font-size:1rem;font-weight:600;cursor:pointer;text-decoration:none;">
          <span>Start New Analysis</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </a>
      </div>
    `;

        // Animate score ring
        setTimeout(() => {
            const fill = document.getElementById('score-circle-fill');
            if (fill) {
                const circumference = 2 * Math.PI * 42;
                fill.style.transition = 'stroke-dashoffset 2s ease';
                fill.style.strokeDashoffset = circumference - (analysis.overallScore / 100) * circumference;
            }
        }, 300);
    }

    function getAvatarEmoji(role) {
        const map = { Student: '🎓', Employee: '💼', 'Team Leader': '👥', Manager: '🏢', Teacher: '📚' };
        return map[role] || '👤';
    }

    function getRoleEmoji(role) {
        const map = { Student: '🎓', Employee: '💼', 'Team Leader': '👥', Manager: '🏢', Teacher: '📚' };
        return map[role] || '👤';
    }

});
