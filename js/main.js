/**
 * AutoFeed AI – Main Landing Page Script
 */
document.addEventListener('DOMContentLoaded', function () {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(8,11,20,0.97)';
                navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)';
            } else {
                navbar.style.background = 'rgba(8,11,20,0.85)';
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // Animate hero elements on load
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        setTimeout(() => {
            heroContent.style.transition = '0.8s cubic-bezier(0.4,0,0.2,1)';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 100);
    }

    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
        heroVisual.style.opacity = '0';
        heroVisual.style.transform = 'translateY(30px)';
        setTimeout(() => {
            heroVisual.style.transition = '0.8s cubic-bezier(0.4,0,0.2,1) 0.2s';
            heroVisual.style.opacity = '1';
            heroVisual.style.transform = 'translateY(0)';
        }, 150);
    }

    // Intersection observer for step cards
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 120);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.step-card, .feature-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = '0.6s cubic-bezier(0.4,0,0.2,1)';
        observer.observe(el);
    });
});
