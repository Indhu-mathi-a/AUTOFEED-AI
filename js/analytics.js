/**
 * AutoFeed AI – Aggregated Analytics Engine
 * Processes multiple responses into a single personality consensus
 */

// We can reuse the personality profile definitions from report.js or redefine centrally
const PERSONALITY_PROFILES = {
    Student: {
        high: { name: 'The Scholar Achiever', emoji: '🌟' },
        mid: { name: 'The Steady Grower', emoji: '📈' },
        low: { name: 'The Emerging Learner', emoji: '🌱' },
    },
    Employee: {
        high: { name: 'The High-Impact Professional', emoji: '🚀' },
        mid: { name: 'The Reliable Contributor', emoji: '⚙️' },
        low: { name: 'The Development Candidate', emoji: '🔧' },
    },
    'Team Leader': {
        high: { name: 'The Inspiring Catalyst', emoji: '⚡' },
        mid: { name: 'The Developing Leader', emoji: '🧭' },
        low: { name: 'The Leadership Learner', emoji: '🎯' },
    },
    Manager: {
        high: { name: 'The Visionary Executive', emoji: '👑' },
        mid: { name: 'The Strategic Manager', emoji: '📊' },
        low: { name: 'The Adapting Manager', emoji: '🛠️' },
    },
    Teacher: {
        high: { name: 'The Transformational Educator', emoji: '🌈' },
        mid: { name: 'The Dedicated Practitioner', emoji: '📚' },
        low: { name: 'The Growing Educator', emoji: '🌿' },
    },
};

const SUGGESTIONS = {
    Performance: [
        { num: 1, title: 'Set SMART Goals Weekly', desc: 'Define Specific, Measurable, Achievable, Relevant, and Time-bound goals each Monday.' },
        { num: 2, title: 'Implement Weekly Reflection', desc: 'Dedicate Friday afternoon to reviewing wins and blockers.' },
        { num: 3, title: 'Request Structured Feedback', desc: 'Ask peers specifically "One thing I should stop, start, and continue doing."' }
    ],
    Leadership: [
        { num: 1, title: 'Practice Active Delegation', desc: 'Identify tasks that can grow your team members and delegate with clear outcomes.' },
        { num: 2, title: 'Focus on Servant Leadership', desc: 'Ask your team daily: "What is holding you back that I can remove?"' },
        { num: 3, title: 'Develop Strategic Foresight', desc: 'Schedule 2 hours a week for deep work on long-term initiatives.' }
    ],
    Communication: [
        { num: 1, title: 'Master the Executive Summary', desc: 'When presenting, start with the conclusion and then provide supporting data.' },
        { num: 2, title: 'Listen to Understand', desc: 'Practice reflecting back what you heard before providing your counter-point.' },
        { num: 3, title: 'Consistent Transparency', desc: 'Default to over-communicating the "Why" behind decisions.' }
    ],
    Teamwork: [
        { num: 1, title: 'Foster Psych Safety', desc: 'Share your own mistakes openly to set a standard of vulnerability and learning.' },
        { num: 2, title: 'Map Team Strengths', desc: 'Identify the unique "superpowers" of each member to optimize collaboration.' },
        { num: 3, title: 'Celebrate Small Wins', desc: 'Instant positive reinforcement builds morale faster than annual bonuses.' }
    ]
};

export function analyzeConsensus(responses, config) {
    const traitMap = {
        'Leadership': ['Leadership', 'Decision Making', 'Delegation', 'Influence'],
        'Communication': ['Communication', 'Clarity', 'Active Listening'],
        'Adaptability': ['Adaptability', 'Resilience', 'Change Management'],
        'Teamwork': ['Collaboration', 'Team Support', 'Teamwork'],
        'Creativity': ['Creativity', 'Innovation', 'Creative Process'],
        'Problem Solving': ['Problem Solving', 'Analytical Thinking', 'Strategy'],
    };

    const categoryScores = {};

    // 1. Process all answers
    responses.forEach(resp => {
        Object.entries(resp.answers).forEach(([qIdx, answer]) => {
            const questionMeta = config.questions[qIdx];
            if (!questionMeta) return;

            const category = questionMeta.category || 'General';
            let score = 0;
            if (answer.type === 'scale') score = answer.value * 10;
            else if (answer.type === 'options') score = 75; // Average fixed score for options
            
            if (!categoryScores[category]) categoryScores[category] = { sum: 0, count: 0 };
            categoryScores[category].sum += score;
            categoryScores[category].count++;
        });
    });

    // 2. Map to Traits
    const traits = Object.entries(traitMap).map(([trait, cats]) => {
        let traitSum = 0;
        let traitCount = 0;
        cats.forEach(c => {
            if (categoryScores[c]) {
                traitSum += categoryScores[c].sum;
                traitCount += categoryScores[c].count;
            }
        });

        // Fallback to base score if no specific category data
        const finalScore = traitCount > 0 
            ? Math.round(traitSum / traitCount) 
            : Math.round(50 + (Math.random() * 20)); // Base fallback

        return { trait, score: finalScore };
    });

    // 3. Overall Consensus Score
    const overallScore = Math.round(traits.reduce((s, t) => s + t.score, 0) / traits.length);

    // 4. Determine Persona
    const level = overallScore >= 75 ? 'high' : overallScore >= 50 ? 'mid' : 'low';
    const persona = (PERSONALITY_PROFILES[config.role] || PERSONALITY_PROFILES.Employee)[level];

    // 5. Suggestions
    const suggestions = SUGGESTIONS[config.purpose] || SUGGESTIONS.Performance;

    return {
        overallScore,
        traits,
        persona,
        suggestions
    };
}
