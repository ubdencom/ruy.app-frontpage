// ========================================
// Particle Background Animation
// ========================================
class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80;
        
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 1,
                vx: Math.random() * 0.5 - 0.25,
                vy: Math.random() * 0.5 - 0.25,
                color: `rgba(99, 102, 241, ${Math.random() * 0.5 + 0.2})`
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles.forEach((particle, i) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
            
            // Connect nearby particles
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = particle.x - this.particles[j].x;
                const dy = particle.y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 * (1 - distance / 150)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// Main Application
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize particle background
    new ParticleBackground('particle-canvas');
    
    // Disable AOS animations - show everything immediately
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 0,
            once: true,
            disable: true // Disable all animations
        });
    }
    
    // ========================================
    // Loading Screen
    // ========================================
    const mainContainer = document.getElementById('main-container');
    
    // Show content immediately without waiting
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1000); // Reduced from 2000ms to 1000ms
    
    // ========================================
    // Show Title Immediately
    // ========================================
    const mainTitle = document.getElementById('main-title');
    const titleText = "WE RUN YOUR APP";
    
    // Show title immediately without typewriter effect
    if (mainTitle) {
        mainTitle.textContent = titleText;
    }
    
    // ========================================
    // Navigation
    // ========================================
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.querySelector('.navbar');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // ========================================
    // Stats Counter Animation
    // ========================================
    function animateCounter(element, target, duration = 2000) {
        let current = 0;
        const increment = target / (duration / 16);
        const suffix = element.dataset.target.includes('+') ? '+' : '';
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }
    
    // Observe stats section
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number').forEach(stat => {
                    const target = parseInt(stat.dataset.target);
                    animateCounter(stat, target);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
    
    // ========================================
    // App Search and Filter
    // ========================================
    const searchInput = document.getElementById('app-search');
    const filterTags = document.querySelectorAll('.filter-tag');
    const appCards = document.querySelectorAll('.app-card');
    
    let currentFilter = 'all';
    
    function filterApps() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        appCards.forEach(card => {
            const category = card.dataset.category;
            const title = card.querySelector('.app-title').textContent.toLowerCase();
            const description = card.querySelector('.app-description').textContent.toLowerCase();
            
            const matchesFilter = currentFilter === 'all' || category === currentFilter;
            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
            
            if (matchesFilter && matchesSearch) {
                card.style.display = 'block';
                card.removeAttribute('data-hidden');
                gsap.fromTo(card, 
                    { opacity: 0, scale: 0.8 },
                    { opacity: 1, scale: 1, duration: 0.5 }
                );
            } else {
                card.style.display = 'none';
                card.setAttribute('data-hidden', 'true');
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterApps);
    }
    
    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentFilter = tag.dataset.filter;
            filterApps();
        });
    });
    
    // ========================================
    // Popups
    // ========================================
    const featuresPopup = document.getElementById('features-popup');
    const contactPopup = document.getElementById('contact-popup');
    
    window.openFeaturesPopup = function() {
        featuresPopup.style.display = 'block';
        gsap.to(featuresPopup, {
            opacity: 1,
            duration: 0.3
        });
        gsap.fromTo(featuresPopup.querySelector('.popup-content'),
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
        document.body.style.overflow = 'hidden';
    };
    
    window.closeFeaturesPopup = function() {
        gsap.to(featuresPopup.querySelector('.popup-content'),
            { scale: 0.8, opacity: 0, duration: 0.3 }
        );
        gsap.to(featuresPopup, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                featuresPopup.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    };
    
    window.openContactPopup = function() {
        contactPopup.style.display = 'block';
        gsap.to(contactPopup, {
            opacity: 1,
            duration: 0.3
        });
        gsap.fromTo(contactPopup.querySelector('.popup-content'),
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
        document.body.style.overflow = 'hidden';
    };
    
    window.closeContactPopup = function() {
        gsap.to(contactPopup.querySelector('.popup-content'),
            { scale: 0.8, opacity: 0, duration: 0.3 }
        );
        gsap.to(contactPopup, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                contactPopup.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    };
    
    // Close popups on background click
    [featuresPopup, contactPopup].forEach(popup => {
        if (popup) {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    if (popup === featuresPopup) {
                        window.closeFeaturesPopup();
                    } else {
                        window.closeContactPopup();
                    }
                }
            });
        }
    });
    
    // Close popups on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (featuresPopup.style.display === 'block') {
                window.closeFeaturesPopup();
            }
            if (contactPopup.style.display === 'block') {
                window.closeContactPopup();
            }
        }
    });
    
    // ========================================
    // Contact Form
    // ========================================
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            // Show success message
            alert('Your message has been sent successfully! We will get back to you as soon as possible.');
            
            // Reset form
            contactForm.reset();
            
            // Close popup
            window.closeContactPopup();
        });
    }
    
    // ========================================
    // Smooth Scroll
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href) return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ========================================
    // 3D Card Effect on Mouse Move
    // ========================================
    document.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.querySelector('.app-card-inner').style.transform = 
                `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.querySelector('.app-card-inner').style.transform = 
                'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
    
    // ========================================
    // Feature Cards 3D Effect
    // ========================================
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;
            
            card.style.transform = 
                `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });
    
    // ========================================
    // Background Music (Optional)
    // ========================================
    const backgroundMusic = document.getElementById('background-music');
    if (backgroundMusic) {
        // Auto-play with user interaction
        document.addEventListener('click', () => {
            if (backgroundMusic.paused) {
                backgroundMusic.play().catch(e => {
                    console.log('Audio play prevented:', e);
                });
            }
        }, { once: true });
        
        // Set volume
        backgroundMusic.volume = 0.3;
    }
    
    // ========================================
    // Scroll Progress Indicator
    // ========================================
    const scrollProgress = document.createElement('div');
    scrollProgress.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(scrollProgress);
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgress.style.width = scrolled + '%';
    });
    
    // ========================================
    // Performance Optimization
    // ========================================
    // Lazy load images if any
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // ========================================
    // Console Easter Egg
    // ========================================
    console.log('%c🚀 RUY.APP', 'font-size: 40px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
    console.log('%cWe Are Run Your App!', 'font-size: 20px; color: #667eea;');
    console.log('%cInterested in joining our team? Contact us at info@ruy.app', 'font-size: 14px; color: #a0aec0;');
});

// ========================================
// Service Worker Registration (Optional - for PWA)
// ========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}
